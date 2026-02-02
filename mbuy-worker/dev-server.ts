/**
 * Development Server - بديل لـ Wrangler
 * يشغل الـ Worker على Node.js مباشرة
 */
import { serve } from '@hono/node-server';
import app from './src/index.js';

const port = parseInt(process.env.PORT || '8787');

console.log(`🚀 MBUY Worker Dev Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server running at http://localhost:${info.port}`);
});
