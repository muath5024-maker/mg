import { Context } from 'hono';
import type { Env } from '../types';

/**
 * POST /secure/media/upload-urls
 * يولّد روابط رفع مؤقتة لـ R2 (للصور) و Cloudflare Stream (للفيديو)
 * 
 * الطلب:
 * {
 *   "files": [
 *     { "type": "image" },
 *     { "type": "image" },
 *     { "type": "video" }
 *   ]
 * }
 * 
 * الاستجابة:
 * {
 *   "ok": true,
 *   "uploadUrls": [
 *     { "type": "image", "uploadUrl": "...", "publicUrl": "..." },
 *     ...
 *   ]
 * }
 */
export async function generateUploadUrls(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const { files } = body;

    // التحقق من صحة الطلب
    if (!files || !Array.isArray(files) || files.length === 0) {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'files array is required',
      }, 400);
    }

    // التحقق من عدد الملفات
    const images = files.filter((f: any) => f.type === 'image');
    const videos = files.filter((f: any) => f.type === 'video');

    if (images.length > 4) {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Maximum 4 images allowed',
      }, 400);
    }

    if (videos.length > 1) {
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Maximum 1 video allowed',
      }, 400);
    }

    const uploadUrls = [];
    
    // الحصول على base URL للـ Worker
    const workerBaseUrl = 'https://misty-mode-b68b.baharista1.workers.dev';

    // توليد روابط رفع للصور باستخدام R2
    for (let i = 0; i < images.length; i++) {
      try {
        // إنشاء اسم ملف فريد
        const imageId = crypto.randomUUID();
        const fileName = `products/${imageId}.jpg`;
        
        // بناء URL للرفع المباشر عبر Worker
        const uploadUrl = `${workerBaseUrl}/secure/media/upload/${imageId}`;
        // استخدام Worker URL لخدمة الملفات (بدلاً من R2 public URL)
        const publicUrl = `${workerBaseUrl}/media/${fileName}`;
        
        console.log('[generateUploadUrls] Generated image URL:', { uploadUrl, publicUrl, imageId });
        
        uploadUrls.push({
          type: 'image',
          uploadUrl: uploadUrl,
          publicUrl: publicUrl,
          imageId: imageId,
          fileName: fileName,
        });
      } catch (error: any) {
        console.error('Error generating image upload URL:', error);
        return c.json({
          ok: false,
          code: 'IMAGE_UPLOAD_ERROR',
          message: 'Failed to generate image upload URL',
        }, 500);
      }
    }

    // توليد رابط رفع للفيديو باستخدام R2
    for (let i = 0; i < videos.length; i++) {
      try {
        const videoId = crypto.randomUUID();
        const fileName = `videos/${videoId}.mp4`;
        
        const uploadUrl = `${workerBaseUrl}/secure/media/upload/${videoId}?type=video`;
        // استخدام Worker URL لخدمة الملفات
        const publicUrl = `${workerBaseUrl}/media/${fileName}`;
        
        console.log('[generateUploadUrls] Generated video URL:', { uploadUrl, publicUrl, videoId });
        
        uploadUrls.push({
          type: 'video',
          uploadUrl: uploadUrl,
          publicUrl: publicUrl,
          videoId: videoId,
          fileName: fileName,
        });
      } catch (error: any) {
        console.error('Error generating video upload URL:', error);
        return c.json({
          ok: false,
          code: 'VIDEO_UPLOAD_ERROR',
          message: 'Failed to generate video upload URL',
        }, 500);
      }
    }

    return c.json({
      ok: true,
      uploadUrls,
    }, 200);

  } catch (error: any) {
    console.error('Error in generateUploadUrls:', error);
    return c.json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    }, 500);
  }
}

/**
 * POST /secure/media/upload/:id
 * يرفع ملف مباشرة إلى R2
 */
export async function uploadMedia(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id');
    const type = c.req.query('type') || 'image';
    
    console.log('[uploadMedia] Starting upload. ID:', id, 'Type:', type);
    
    if (!id) {
      console.error('[uploadMedia] Missing file ID');
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'File ID is required',
      }, 400);
    }
    
    // قراءة البيانات من الطلب
    const contentType = c.req.header('Content-Type') || 'image/jpeg';
    const body = await c.req.arrayBuffer();
    
    console.log('[uploadMedia] Content-Type:', contentType, 'Body size:', body?.byteLength || 0);
    
    if (!body || body.byteLength === 0) {
      console.error('[uploadMedia] Empty file body');
      return c.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'File data is required',
      }, 400);
    }
    
    // تحديد مسار الملف
    const extension = type === 'video' ? 'mp4' : 'jpg';
    const folder = type === 'video' ? 'videos' : 'products';
    const fileName = `${folder}/${id}.${extension}`;
    
    console.log('[uploadMedia] Target file:', fileName);
    
    // رفع الملف إلى R2 باستخدام R2 binding مباشرة
    if (!c.env.R2) {
      console.error('[uploadMedia] R2 binding not available');
      return c.json({
        ok: false,
        code: 'CONFIG_ERROR',
        message: 'R2 storage not configured',
      }, 500);
    }
    
    try {
      console.log('[uploadMedia] Uploading to R2...');
      await c.env.R2.put(fileName, body, {
        httpMetadata: {
          contentType: contentType,
        },
      });
      console.log(`✅ [uploadMedia] Successfully uploaded file to R2: ${fileName}, size: ${body.byteLength} bytes`);
    } catch (r2Error: any) {
      console.error('[uploadMedia] R2 upload error:', r2Error.message || r2Error);
      return c.json({
        ok: false,
        code: 'UPLOAD_ERROR',
        message: `Failed to upload file: ${r2Error.message}`,
      }, 500);
    }
    
    // استخدام Worker URL لخدمة الملفات
    const workerBaseUrl = 'https://misty-mode-b68b.baharista1.workers.dev';
    const publicUrl = `${workerBaseUrl}/media/${fileName}`;
    
    console.log('[uploadMedia] Success! Public URL:', publicUrl);
    
    return c.json({
      ok: true,
      url: publicUrl,
      id: id,
      fileName: fileName,
    }, 200);
    
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return c.json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /media/:path+
 * يخدم الملفات من R2 مباشرة (بديل عن Public Access)
 */
export async function serveMedia(c: Context<{ Bindings: Env }>) {
  try {
    // استخراج المسار من URL
    const url = new URL(c.req.url);
    const path = url.pathname.replace('/media/', '');
    
    if (!path) {
      return c.json({ error: 'File path required' }, 400);
    }
    
    console.log('[serveMedia] Serving file:', path);
    
    // جلب الملف من R2
    const object = await c.env.R2.get(path);
    
    if (!object) {
      console.log('[serveMedia] File not found:', path);
      return c.json({ error: 'File not found' }, 404);
    }
    
    // تحديد Content-Type
    const contentType = object.httpMetadata?.contentType || 
      (path.endsWith('.mp4') ? 'video/mp4' : 
       path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' : 
       path.endsWith('.png') ? 'image/png' : 
       'application/octet-stream');
    
    // إرجاع الملف
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error: any) {
    console.error('[serveMedia] Error:', error);
    return c.json({ error: 'Failed to serve file' }, 500);
  }
}


