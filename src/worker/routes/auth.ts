import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { user, session } from '../../data/schema';
import { loginSchema, registerSchema } from '../../contracts';
import { requireAuth } from '../middleware/auth';
import { AppContext } from '../types';

export const authRouter = new Hono<AppContext>();

// Current user profile
authRouter.get('/me', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const userCtx = c.get('user' as any);

  const u = await db.query.user.findFirst({
    where: eq(user.id, userCtx.userId)
  });

  if (!u) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'المستخدم غير موجود' } }, 404);
  }

  return c.json({
    data: {
      id: u.id,
      name: u.name,
      email: u.email,
      platformRole: u.platform_role,
      locale: u.locale,
      image: u.image,
      workspaceMemberships: userCtx.workspaceMemberships,
      workshopMemberships: userCtx.workshopMemberships
    }
  });
});

// Simple development / session login endpoint
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const db = c.get('db' as any);
  const { email, password } = c.req.valid('json');

  const u = await db.query.user.findFirst({
    where: eq(user.email, email)
  });

  if (!u) {
    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: 'البريد أو كلمة المرور غير صحيحة' } }, 401);
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const token = 'sess_' + crypto.randomUUID().replace(/-/g, '');

  await db.insert(session).values({
    id: 's_' + crypto.randomUUID().slice(0, 8),
    expiresAt,
    token,
    userId: u.id,
    createdAt: now,
    updatedAt: now
  });

  // Set secure cookie
  c.header('Set-Cookie', `better-auth.session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);

  return c.json({
    data: {
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        platformRole: u.platform_role
      },
      token
    }
  });
});

// Logout
authRouter.post('/logout', async (c) => {
  c.header('Set-Cookie', `better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return c.json({ data: { success: true } });
});
