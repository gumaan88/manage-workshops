import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { organizations } from '../../data/schema';
import { createOrganizationSchema } from '../../contracts';
import { requireAuth } from '../middleware/auth';
import { PolicyEngine } from '../../domain/policies';
import { AppContext } from '../types';

export const organizationsRouter = new Hono<AppContext>();

// List organizations by workspace
organizationsRouter.get('/', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);
  const workspaceId = c.req.query('workspaceId');

  if (!workspaceId || !PolicyEngine.canAccessWorkspace(user, workspaceId)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'مساحة العمل غير مصرح بها' } }, 403);
  }

  const list = await db.query.organizations.findMany({
    where: eq(organizations.workspace_id, workspaceId)
  });

  return c.json({ data: list });
});

// Create organization
organizationsRouter.post('/', requireAuth, zValidator('json', createOrganizationSchema), async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);
  const body = c.req.valid('json');

  if (!PolicyEngine.canManageWorkspace(user, body.workspaceId)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'ليس لديك صلاحية إضافة منظمة' } }, 403);
  }

  const now = new Date().toISOString();
  const id = 'org_' + crypto.randomUUID().slice(0, 8);

  await db.insert(organizations).values({
    id,
    workspace_id: body.workspaceId,
    name: body.name,
    code: body.code,
    type: body.type || 'standard',
    contact_email: body.contactEmail || null,
    contact_phone: body.contactPhone || null,
    created_at: now,
    updated_at: now
  });

  return c.json({ data: { id, ...body } }, 201);
});
