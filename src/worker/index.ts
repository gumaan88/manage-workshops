import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, Env } from './middleware/auth';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { workspacesRouter } from './routes/workspaces';
import { organizationsRouter } from './routes/organizations';
import { workshopsRouter } from './routes/workshops';
import { activitiesRouter } from './routes/activities';
import { submissionsRouter } from './routes/submissions';
import { liveRouter } from './routes/live';
import { attendanceRouter } from './routes/attendance';
import { reportsRouter } from './routes/reports';
import { certificatesRouter } from './routes/certificates';

const app = new Hono<{ Bindings: Env }>();

// Global Middlewares
app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-dev-user-email', 'Idempotency-Key']
}));

app.use('/api/*', authMiddleware);

// API v1 Routes
const api = new Hono<{ Bindings: Env }>();
api.route('/health', healthRouter);
api.route('/auth', authRouter);
api.route('/me', authRouter);
api.route('/workspaces', workspacesRouter);
api.route('/organizations', organizationsRouter);
api.route('/workshops', workshopsRouter);
api.route('/activities', activitiesRouter);
api.route('/submissions', submissionsRouter);
api.route('/live', liveRouter);
api.route('/attendance', attendanceRouter);
api.route('/reports', reportsRouter);
api.route('/certificates', certificatesRouter);

app.route('/api/v1', api);

// Export Cloudflare Worker Fetch handler with SPA Fallback
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // API Routes handled directly by Hono
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }

    // Static Assets & SPA Routing fallback (Cloudflare Workers Static Assets)
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      // SPA Fallback: serve index.html for client-side navigation
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return await env.ASSETS.fetch(indexRequest);
    }

    return app.fetch(request, env, ctx);
  }
};
