import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { workshops, workshop_memberships, agenda_items, workshop_groups, live_states } from '../../data/schema';
import { createWorkshopSchema, createAgendaItemSchema } from '../../contracts';
import { requireAuth } from '../middleware/auth';
import { PolicyEngine } from '../../domain/policies';
import { AppContext } from '../types';

export const workshopsRouter = new Hono<AppContext>();

// List workshops
workshopsRouter.get('/', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);
  const workspaceId = c.req.query('workspaceId');

  if (workspaceId) {
    if (!PolicyEngine.canAccessWorkspace(user, workspaceId)) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'غير مصرح' } }, 403);
    }
    const list = await db.query.workshops.findMany({
      where: eq(workshops.workspace_id, workspaceId)
    });
    return c.json({ data: list });
  }

  const all = await db.select().from(workshops);
  return c.json({ data: all });
});

// Create workshop (AC-002)
workshopsRouter.post('/', requireAuth, zValidator('json', createWorkshopSchema), async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);
  const body = c.req.valid('json');

  if (!PolicyEngine.canManageWorkspace(user, body.workspaceId)) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'ليس لديك صلاحية إنشاء ورشة' } }, 403);
  }

  const now = new Date().toISOString();
  const id = 'ws_run_' + crypto.randomUUID().slice(0, 8);

  await db.insert(workshops).values({
    id,
    workspace_id: body.workspaceId,
    program_id: body.programId || null,
    title: body.title,
    code: body.code,
    description: body.description || null,
    format: body.format,
    location_name: body.locationName || null,
    meeting_url: body.meetingUrl || null,
    start_date: body.startDate,
    end_date: body.endDate,
    max_participants: body.maxParticipants,
    participant_approval_policy: body.participantApprovalPolicy,
    status: 'draft',
    is_template: 0,
    created_at: now,
    updated_at: now
  });

  // Assign creator as lead facilitator
  await db.insert(workshop_memberships).values({
    id: 'wsm_' + crypto.randomUUID().slice(0, 8),
    workshop_id: id,
    user_id: user.userId,
    role: 'lead_facilitator',
    status: 'active',
    created_at: now,
    updated_at: now
  });

  // Initialize live state
  await db.insert(live_states).values({
    id: 'ls_' + crypto.randomUUID().slice(0, 8),
    workshop_id: id,
    active_activity_id: null,
    is_active: 0,
    version: 1,
    updated_at: now
  });

  return c.json({ data: { id, ...body, status: 'draft' } }, 201);
});

// Get workshop details
workshopsRouter.get('/:id', async (c) => {
  const db = c.get('db' as any);
  const id = c.req.param('id');

  const ws = await db.query.workshops.findFirst({
    where: eq(workshops.id, id)
  });

  if (!ws) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'الورشة غير موجودة' } }, 404);
  }

  const agenda = await db.query.agenda_items.findMany({
    where: eq(agenda_items.workshop_id, id),
    orderBy: (items: any, { asc }: any) => [asc(items.day_number), asc(items.order_index)]
  });

  const groups = await db.query.workshop_groups.findMany({
    where: eq(workshop_groups.workshop_id, id),
    orderBy: (g: any, { asc }: any) => [asc(g.order_index)]
  });

  return c.json({ data: { ...ws, agenda, groups } });
});

// Add Agenda Item
workshopsRouter.post('/:id/agenda', requireAuth, zValidator('json', createAgendaItemSchema), async (c) => {
  const db = c.get('db' as any);
  const workshopId = c.req.param('id');
  const body = c.req.valid('json');

  const now = new Date().toISOString();
  const id = 'agenda_' + crypto.randomUUID().slice(0, 8);

  await db.insert(agenda_items).values({
    id,
    workshop_id: workshopId,
    day_number: body.dayNumber,
    title: body.title,
    start_time: body.startTime,
    end_time: body.endTime,
    order_index: body.orderIndex,
    description: body.description || null,
    created_at: now
  });

  return c.json({ data: { id, ...body } }, 201);
});

// Clone Template to new Workshop (AC-003)
workshopsRouter.post('/:id/clone', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);
  const sourceId = c.req.param('id');

  const source = await db.query.workshops.findFirst({
    where: eq(workshops.id, sourceId)
  });

  if (!source) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'الورشة المصدر غير موجودة' } }, 404);
  }

  const now = new Date().toISOString();
  const newId = 'ws_run_' + crypto.randomUUID().slice(0, 8);

  // Clone workshop metadata (without participants or attendance per AC-003)
  await db.insert(workshops).values({
    id: newId,
    workspace_id: source.workspace_id,
    program_id: source.program_id,
    title: `${source.title} (نسخة)`,
    code: `${source.code}-CLONE`,
    description: source.description,
    format: source.format,
    location_name: source.location_name,
    meeting_url: source.meeting_url,
    start_date: now,
    end_date: now,
    max_participants: source.max_participants,
    participant_approval_policy: source.participant_approval_policy,
    status: 'draft',
    is_template: 0,
    created_at: now,
    updated_at: now
  });

  // Clone agenda items
  const sourceAgenda = await db.query.agenda_items.findMany({
    where: eq(agenda_items.workshop_id, sourceId)
  });

  for (const item of sourceAgenda) {
    await db.insert(agenda_items).values({
      id: 'agenda_' + crypto.randomUUID().slice(0, 8),
      workshop_id: newId,
      day_number: item.day_number,
      title: item.title,
      start_time: item.start_time,
      end_time: item.end_time,
      order_index: item.order_index,
      description: item.description,
      created_at: now
    });
  }

  // Clone groups
  const sourceGroups = await db.query.workshop_groups.findMany({
    where: eq(workshop_groups.workshop_id, sourceId)
  });

  for (const g of sourceGroups) {
    await db.insert(workshop_groups).values({
      id: 'grp_' + crypto.randomUUID().slice(0, 8),
      workshop_id: newId,
      name: g.name,
      order_index: g.order_index,
      created_at: now
    });
  }

  // Assign user as lead facilitator
  await db.insert(workshop_memberships).values({
    id: 'wsm_' + crypto.randomUUID().slice(0, 8),
    workshop_id: newId,
    user_id: user.userId,
    role: 'lead_facilitator',
    status: 'active',
    created_at: now,
    updated_at: now
  });

  return c.json({ data: { id: newId, title: `${source.title} (نسخة)` } }, 201);
});
