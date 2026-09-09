import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { activities } from '../../data/schema';
import { createActivitySchema } from '../../contracts';
import { requireAuth } from '../middleware/auth';
import { AppContext } from '../types';

export const activitiesRouter = new Hono<AppContext>();

// List activities by workshop
activitiesRouter.get('/', async (c) => {
  const db = c.get('db' as any);
  const workshopId = c.req.query('workshopId');

  if (!workshopId) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'معرف الورشة مطلوب' } }, 400);
  }

  const list = await db.query.activities.findMany({
    where: eq(activities.workshop_id, workshopId)
  });

  const parsed = list.map((a: any) => ({
    ...a,
    fields: JSON.parse(a.fields_json || '[]')
  }));

  return c.json({ data: parsed });
});

// Get single activity
activitiesRouter.get('/:id', async (c) => {
  const db = c.get('db' as any);
  const id = c.req.param('id');

  const item = await db.query.activities.findFirst({
    where: eq(activities.id, id)
  });

  if (!item) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'النشاط غير موجود' } }, 404);
  }

  return c.json({
    data: {
      ...item,
      fields: JSON.parse(item.fields_json || '[]')
    }
  });
});

// Create activity
activitiesRouter.post('/', requireAuth, zValidator('json', createActivitySchema), async (c) => {
  const db = c.get('db' as any);
  const body = c.req.valid('json');

  const now = new Date().toISOString();
  const id = 'act_' + crypto.randomUUID().slice(0, 8);

  await db.insert(activities).values({
    id,
    workshop_id: body.workshopId,
    title: body.title,
    activity_type: body.activityType,
    target_audience: body.targetAudience,
    is_anonymous: body.isAnonymous ? 1 : 0,
    time_limit_minutes: body.timeLimitMinutes || null,
    status: 'published',
    fields_json: JSON.stringify(body.fields || []),
    created_at: now,
    updated_at: now
  });

  return c.json({ data: { id, ...body, status: 'published' } }, 201);
});
