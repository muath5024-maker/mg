/**
 * Media Routes Module
 * File upload and media management routes
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { generateUploadUrls, uploadMedia, serveMedia } from '../endpoints/media';

type Variables = SupabaseAuthContext;

const mediaRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Public Media Access
// ========================================

// Serve media files from R2
mediaRoutes.get('/*', serveMedia);

// ========================================
// Image Upload (Cloudflare Images)
// ========================================

mediaRoutes.post('/image', async (c) => {
  try {
    const body = await c.req.json();
    const { filename } = body;

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_IMAGES_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CF_IMAGES_API_TOKEN}`,
        },
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      return c.json({ error: 'Failed to create upload URL', detail: error }, 500);
    }

    const uploadData: any = await uploadResponse.json();

    return c.json({
      ok: true,
      uploadURL: uploadData.result.uploadURL,
      id: uploadData.result.id,
      viewURL: `https://imagedelivery.net/${c.env.CF_IMAGES_ACCOUNT_ID}/${uploadData.result.id}/public`,
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to process image upload', detail: error.message }, 500);
  }
});

// ========================================
// Video Upload (Cloudflare Stream)
// ========================================

mediaRoutes.post('/video', async (c) => {
  try {
    const body = await c.req.json();
    const { filename } = body;

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_STREAM_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CF_STREAM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600,
          requireSignedURLs: false,
        }),
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      return c.json({ error: 'Failed to create video upload URL', detail: error }, 500);
    }

    const uploadData: any = await uploadResponse.json();

    return c.json({
      ok: true,
      uploadURL: uploadData.result.uploadURL,
      playbackId: uploadData.result.uid,
      viewURL: `https://customer-${c.env.CF_STREAM_ACCOUNT_ID}.cloudflarestream.com/${uploadData.result.uid}/manifest/video.m3u8`,
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to process video upload', detail: error.message }, 500);
  }
});

// ========================================
// R2 Upload (General files)
// ========================================

mediaRoutes.post('/upload', uploadMedia);
mediaRoutes.post('/upload-urls', generateUploadUrls);

export default mediaRoutes;
