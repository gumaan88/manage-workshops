import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { submissions, activities } from '../../data/schema';
import { submitActivitySchema } from '../../contracts';
import { requireAuth } from '../middleware/auth';
import { AppContext } from '../types';

export const submissionsRouter = new Hono<AppContext>();

// Submit answers or save draft (AC-006, AC-007, AC-009)
submissionsRouter.post('/', requireAuth, zValidator('json', submitActivitySchema), async (c) => {
  const db = c.get('db' as any);
  const user = c.get('user' as any);
  const body = c.req.valid('json');

  const activity = await db.query.activities.findFirst({
    where: eq(activities.id, body.activityId)
  });

  if (!activity) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'النشاط غير موجود' } }, 404);
  }

  const now = new Date().toISOString();

  // AC-009: In anonymous activities, user_id is nullified
  const submissionUserId = activity.is_anonymous ? null : user.userId;

  // Idempotency check if idempotencyKey provided (AC-006)
  if (body.idempotencyKey) {
    const existing = await db.query.submissions.findFirst({
      where: eq(submissions.idempotency_key, body.idempotencyKey)
    });
    if (existing) {
      return c.json({ data: existing });
    }
  }

  // Check if draft exists for this user and activity
  let existingDraft: any = null;
  if (submissionUserId) {
    existingDraft = await db.query.submissions.findFirst({
      where: and(
        eq(submissions.activity_id, body.activityId),
        eq(submissions.user_id, submissionUserId)
      )
    });
  }

  if (existingDraft) {
    await db.update(submissions)
      .set({
        answers_json: JSON.stringify(body.answers),
        is_draft: body.isDraft ? 1 : 0,
        idempotency_key: body.idempotencyKey || existingDraft.idempotency_key,
        updated_at: now
      })
      .where(eq(submissions.id, existingDraft.id));

    return c.json({
      data: {
        id: existingDraft.id,
        activityId: body.activityId,
        isDraft: body.isDraft,
        updatedAt: now
      }
    });
  }

  const id = 'sub_' + crypto.randomUUID().slice(0, 8);
  await db.insert(submissions).values({
    id,
    workshop_id: activity.workshop_id,
    activity_id: body.activityId,
    user_id: submissionUserId,
    group_id: null,
    is_draft: body.isDraft ? 1 : 0,
    answers_json: JSON.stringify(body.answers),
    idempotency_key: body.idempotencyKey || null,
    created_at: now,
    updated_at: now
  });

  return c.json({
    data: {
      id,
      activityId: body.activityId,
      isDraft: body.isDraft,
      createdAt: now
    }
  }, 201);
});

// List submissions for an activity (facilitator review)
submissionsRouter.get('/', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const activityId = c.req.query('activityId');

  if (!activityId) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'معرف النشاط مطلوب' } }, 400);
  }

  const list = await db.query.submissions.findMany({
    where: and(
      eq(submissions.activity_id, activityId),
      eq(submissions.is_draft, 0)
    )
  });

  const parsed = list.map((s: any) => ({
    ...s,
    answers: JSON.parse(s.answers_json || '{}')
  }));

  return c.json({ data: parsed });
});
