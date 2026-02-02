/**
 * JWT Utilities
 * Re-exports JWT functions from authMiddleware for use in GraphQL context
 */

/**
 * Verify JWT token and extract payload
 * Uses Web Crypto API available in Cloudflare Workers
 */
export async function verifyToken(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('[JWT] Token expired');
      return null;
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureArray = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, signatureArray, data);

    if (!isValid) {
      console.log('[JWT] Invalid signature');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[JWT] Verification error:', error);
    return null;
  }
}
