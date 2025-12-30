import { Context } from 'hono';
import { Env } from '../types';
import { Ai } from '@cloudflare/ai';

export const cloudflareAiGenerate = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json();
    const { taskType, prompt, image } = body;
    const ai = new Ai(c.env.AI);

    let result;
    let contentType = 'application/json';

    switch (taskType) {
      case 'landing_page':
      case 'video_script': // For video tasks, we generate a script/plan first
      case 'product_description':
      case 'text_product_desc':
      case 'text_seo':
      case 'text_keywords':
      case 'text_marketing_plan':
      case 'text_content_plan':
      case 'text_suggestions':
      case 'text_pricing':
      case 'text_campaigns':
      case 'text_spreadsheet':
      case 'text_diary':
      case 'text_notes':
      case 'assistant_personal':
      case 'assistant_marketing':
      case 'assistant_account_manager':
      case 'assistant_chat_bot':
        // Text Generation
        let systemPrompt = 'You are a helpful AI assistant for a merchant platform.';
        if (taskType === 'text_product_desc') systemPrompt = 'You are an expert copywriter. Write a compelling product description.';
        if (taskType === 'text_seo') systemPrompt = 'You are an SEO expert. Generate SEO titles, descriptions, and tags.';
        if (taskType === 'text_keywords') systemPrompt = 'You are an SEO specialist. Generate high-ranking keywords.';
        if (taskType === 'text_marketing_plan') systemPrompt = 'You are a marketing strategist. Create a detailed marketing plan.';
        if (taskType === 'assistant_marketing') systemPrompt = 'You are a dedicated marketing assistant. Help with campaigns and strategy.';
        if (taskType === 'assistant_account_manager') systemPrompt = 'You are a smart account manager. Help manage the store and sales.';

        const textResponse = await ai.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        });
        result = { text: textResponse };
        break;

      case 'logo':
      case 'visual_identity':
      case 'ai_image':
      case 'product_image':
      case 'banner':
      case 'social_design':
      case 'background_merge':
      case 'professional_image':
      case 'advertisement':
      case 'scene_merge':
      case '3d_image':
      case 'story': // Generate an image for the story
      case 'ad_video': // Generate a keyframe
      case 'ugc_video': // Generate a keyframe
      case 'social_video': // Generate a keyframe
        // Image Generation
        // Using SDXL for better quality
        let enhancedPrompt = prompt;
        if (taskType === 'logo') enhancedPrompt += ', logo design, minimal, vector style';
        if (taskType === '3d_image') enhancedPrompt += ', 3d render, blender, high quality';
        if (taskType === 'product_image' || taskType === 'professional_image') enhancedPrompt += ', product photography, professional, commercial, high quality';
        if (taskType === 'banner' || taskType === 'advertisement') enhancedPrompt += ', banner design, marketing, promotional';
        if (taskType === 'social_design') enhancedPrompt += ', social media design, modern, engaging';
        
        const imageBytes = await ai.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
          prompt: enhancedPrompt,
        });
        
        // Convert Uint8Array to Base64
        const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));
        result = { image: `data:image/png;base64,${imageBase64}` };
        break;

      case 'remove_background':
        if (!image) {
          return c.json({ error: 'Image is required for background removal' }, 400);
        }
        // Convert base64 to array buffer
        const binaryString = atob(image.split(',')[1]);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const inputImage = [...bytes];

        const maskBytes = await ai.run('@cf/bytedance/stable-diffusion-xl-lightning' as any, {
          image: inputImage
        }) as ArrayBuffer;
        const maskBase64 = btoa(String.fromCharCode(...new Uint8Array(maskBytes)));
        result = { image: `data:image/png;base64,${maskBase64}` };
        break;
        
      case 'upscale':
      case 'enhance':
         // Placeholder for upscale as standard binding might not support it directly yet
         // We will return a mock success or try a different model if available.
         // For now, let's treat it as "not implemented" or just return the original to avoid crash
         return c.json({ error: 'Upscaling model not currently available in this tier' }, 501);

      default:
        return c.json({ error: 'Invalid task type' }, 400);
    }

    return c.json({ 
      ok: true,
      success: true, 
      taskType, 
      result,
      data: result
    });

  } catch (error: any) {
    console.error('Cloudflare AI Error:', error);
    return c.json({ error: 'AI Generation Failed', details: error.message }, 500);
  }
};


