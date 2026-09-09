import { MiddlewareHandler } from 'hono';
import { eq } from 'drizzle-orm';
import { createDbClient } from '../../data/db';
import { user as userTable, session as sessionTable, workspace_memberships, workshop_memberships } from '../../data/schema';
import { UserContext } from '../../domain/policies';

export interface Env {
  DB: D1Database;
  FILES?: R2Bucket;
  ASSETS?: Fetcher;
  APP_ENV?: string;
  APP_BASE_URL?: string;
}

export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { user: UserContext; db: ReturnType<typeof createDbClient> } }> = async (c, next) => {
  const db = createDbClient(c.env.DB);
  c.set('db', db);

  const isDev = c.env.APP_ENV === 'development' || !c.env.APP_ENV;
  const devEmail = c.req.header('x-dev-user-email');
  const authHeader = c.req.header('Authorization');
  const cookieHeader = c.req.header('Cookie');

  let targetUserId: string | null = null;
  let targetUserRole: any = 'user';

  if (isDev && devEmail) {
    // Local development bypass
    const foundUser = await db.query.user.findFirst({
      where: eq(userTable.email, devEmail)
    });
    if (foundUser) {
      targetUserId = foundUser.id;
      targetUserRole = foundUser.platform_role;
    }
  } else if (cookieHeader || authHeader) {
    // Extract session token from cookie or Authorization Bearer
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (token) {
      const sess = await db.query.session.findFirst({
        where: eq(sessionTable.token, token)
      });
      if (sess && new Date(sess.expiresAt) > new Date()) {
        const u = await db.query.user.findFirst({
          where: eq(userTable.id, sess.userId)
        });
        if (u && u.status === 'active') {
          targetUserId = u.id;
          targetUserRole = u.platform_role;
        }
      }
    }
  }

  if (targetUserId) {
    // Fetch user workspace memberships
    const wsMembers = await db.query.workspace_memberships.findMany({
      where: eq(workspace_memberships.user_id, targetUserId)
    });

    const wMembers = await db.query.workshop_memberships.findMany({
      where: eq(workshop_memberships.user_id, targetUserId)
    });

    c.set('user', {
      userId: targetUserId,
      platformRole: targetUserRole,
      workspaceMemberships: wsMembers.map(m => ({ workspaceId: m.workspace_id, role: m.role as any })),
      workshopMemberships: wMembers.map(m => ({ workshopId: m.workshop_id, role: m.role as any }))
    });
  }

  await next();
};

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: { user?: UserContext } }> = async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'يرجى تسجيل الدخول للوصول إلى هذا المورد'
      }
    }, 401);
  }
  await next();
};
