import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { workspaces, workspace_memberships } from '../../data/schema';
import { createWorkspaceSchema } from '../../contracts';
import { requireAuth } from '../middleware/auth';
import { PolicyEngine } from '../../domain/policies';
import { AppContext } from '../types';

export const workspacesRouter = new Hono<AppContext>();

// List workspaces
workspacesRouter.get('/', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);

  if (user.platformRole === 'platform_admin') {
    const all = await db.select().from(workspaces);
    return c.json({ data: all });
  }

  const myMemberships = await db.query.workspace_memberships.findMany({
    where: eq(workspace_memberships.user_id, user.userId)
  });

  const wsIds = myMemberships.map((m: any) => m.workspace_id);
  if (wsIds.length === 0) return c.json({ data: [] });

  const list = await db.query.workspaces.findMany({
    where: (ws: any, { inArray }: any) => inArray(ws.id, wsIds)
  });

  return c.json({ data: list });
});

// Create workspace
workspacesRouter.post('/', requireAuth, zValidator('json', createWorkspaceSchema), async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);
  const body = c.req.valid('json');

  const now = new Date().toISOString();
  const wsId = 'ws_' + crypto.randomUUID().slice(0, 8);

  await db.insert(workspaces).values({
    id: wsId,
    name: body.name,
    slug: body.slug,
    description: body.description || null,
    owner_id: user.userId,
    status: 'active',
    created_at: now,
    updated_at: now
  });

  await db.insert(workspace_memberships).values({
    id: 'wsm_' + crypto.randomUUID().slice(0, 8),
    workspace_id: wsId,
    user_id: user.userId,
    role: 'owner',
    created_at: now,
    updated_at: now
  });

  return c.json({ data: { id: wsId, ...body } }, 201);
});

// Get workspace by ID (Enforces AC-001 Isolation)
workspacesRouter.get('/:id', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);
  const id = c.req.param('id');

  if (!PolicyEngine.canAccessWorkspace(user, id)) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'مساحة العمل غير موجودة أو ليس لديك إذن بالوصول'
      }
    }, 404);
  }

  const found = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, id)
  });

  if (!found) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'مساحة العمل غير موجودة' } }, 404);
  }

  return c.json({ data: found });
});
