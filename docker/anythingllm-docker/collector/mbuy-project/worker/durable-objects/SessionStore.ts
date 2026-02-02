/**
 * SessionStore Durable Object
 * Manages user sessions with persistence
 */
export class SessionStore {
  private state: DurableObjectState;
  private sessions: Map<string, any>;
  private cleanupTimer?: number;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();

    // Auto cleanup expired sessions every 5 minutes
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    // Clean up expired sessions every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000) as any; // 5 minutes
  }

  private cleanupExpiredSessions() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, session] of this.sessions.entries()) {
      // Check if session has expiry and is expired
      if (session.expiresAt && session.expiresAt < now) {
        expiredKeys.push(key);
      }
    }

    // Remove expired sessions
    expiredKeys.forEach(key => {
      this.sessions.delete(key);
      this.state.storage.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired sessions`);
    }
  }

  async handleSession(websocket: WebSocket) {
    // Handle WebSocket connections if needed in the future
    websocket.accept();

    websocket.addEventListener('close', () => {
      // Cleanup on disconnect
      console.log('SessionStore WebSocket disconnected');
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/set' && request.method === 'POST') {
        const { sessionId, data } = await request.json() as any;
        await this.state.storage.put(sessionId, data);
        this.sessions.set(sessionId, data);
        return new Response(JSON.stringify({ ok: true, sessionId }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/get' && request.method === 'POST') {
        const { sessionId } = await request.json() as any;
        let data = this.sessions.get(sessionId);
        if (!data) {
          data = await this.state.storage.get(sessionId);
          if (data) this.sessions.set(sessionId, data);
        }
        return new Response(JSON.stringify({ ok: true, data }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/delete' && request.method === 'POST') {
        const { sessionId } = await request.json() as any;
        await this.state.storage.delete(sessionId);
        this.sessions.delete(sessionId);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not found', { status: 404 });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Cleanup method called when Durable Object is terminated
  async handleTerminate() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    console.log('SessionStore terminated, cleanup completed');
  }
}
