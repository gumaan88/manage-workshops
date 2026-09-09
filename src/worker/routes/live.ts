import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { live_states, activities } from '../../data/schema';
import { requireAuth } from '../middleware/auth';
import { AppContext } from '../types';

export const liveRouter = new Hono<AppContext>();

// Get current live state (AC-008)
liveRouter.get('/:workshopId', async (c) => {
  const db = c.get('db' as any);
  const workshopId = c.req.param('workshopId');

  let state = await db.query.live_states.findFirst({
    where: eq(live_states.workshop_id, workshopId)
  });

  if (!state) {
    const now = new Date().toISOString();
    state = {
      id: 'ls_' + crypto.randomUUID().slice(0, 8),
      workshop_id: workshopId,
      active_activity_id: null,
      is_active: 0,
      version: 1,
      updated_at: now
    };
    await db.insert(live_states).values(state);
  }

  let activeActivity = null;
  if (state.active_activity_id) {
    const act = await db.query.activities.findFirst({
      where: eq(activities.id, state.active_activity_id)
    });
    if (act) {
      activeActivity = {
        ...act,
        fields: JSON.parse(act.fields_json || '[]')
      };
    }
  }

  return c.json({
    data: {
      ...state,
      activeActivity
    }
  });
});

// Update live activity (Facilitator control)
liveRouter.post('/:workshopId/activity', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const workshopId = c.req.param('workshopId');
  const body = await c.req.json();
  const { activityId, isActive } = body;

  const existing = await db.query.live_states.findFirst({
    where: eq(live_states.workshop_id, workshopId)
  });

  const now = new Date().toISOString();
  const nextVersion = (existing?.version || 0) + 1;

  if (existing) {
    await db.update(live_states)
      .set({
        active_activity_id: activityId || null,
        is_active: isActive ? 1 : 0,
        version: nextVersion,
        updated_at: now
      })
      .where(eq(live_states.id, existing.id));
  } else {
    await db.insert(live_states).values({
      id: 'ls_' + crypto.randomUUID().slice(0, 8),
      workshop_id: workshopId,
      active_activity_id: activityId || null,
      is_active: isActive ? 1 : 0,
      version: nextVersion,
      updated_at: now
    });
  }

  return c.json({
    data: {
      workshopId,
      activeActivityId: activityId,
      isActive,
      version: nextVersion
    }
  });
});
