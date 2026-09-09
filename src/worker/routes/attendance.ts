import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { attendance_records, user } from '../../data/schema';
import { markAttendanceSchema, scanQrAttendanceSchema } from '../../contracts';
import { requireAuth } from '../middleware/auth';
import { AppContext } from '../types';

export const attendanceRouter = new Hono<AppContext>();

// Mark attendance manually (AC-005)
attendanceRouter.post('/mark', requireAuth, zValidator('json', markAttendanceSchema), async (c) => {
  const db = c.get('db' as any);
  const body = c.req.valid('json');

  const existing = await db.query.attendance_records.findFirst({
    where: and(
      eq(attendance_records.workshop_id, body.workshopId),
      eq(attendance_records.day_number, body.dayNumber),
      eq(attendance_records.user_id, body.participantId)
    )
  });

  const now = new Date().toISOString();

  if (existing) {
    await db.update(attendance_records)
      .set({
        status: body.status,
        reason: body.reason || null
      })
      .where(eq(attendance_records.id, existing.id));

    return c.json({ data: { ...existing, status: body.status } });
  }

  const id = 'att_' + crypto.randomUUID().slice(0, 8);
  await db.insert(attendance_records).values({
    id,
    workshop_id: body.workshopId,
    day_number: body.dayNumber,
    user_id: body.participantId,
    status: body.status,
    check_in_time: now,
    reason: body.reason || null,
    created_at: now
  });

  return c.json({ data: { id, ...body, checkInTime: now } }, 201);
});

// Scan QR token attendance (AC-005)
attendanceRouter.post('/scan', requireAuth, zValidator('json', scanQrAttendanceSchema), async (c) => {
  const db = c.get('db' as any);
  const { token } = c.req.valid('json');

  // Token format: workshopId:dayNumber:userId
  const parts = token.split(':');
  if (parts.length < 3) {
    return c.json({ error: { code: 'INVALID_TOKEN', message: 'رمز الحضور غير صالح' } }, 400);
  }

  const [workshopId, dayStr, participantId] = parts;
  const dayNumber = parseInt(dayStr, 10) || 1;

  const existing = await db.query.attendance_records.findFirst({
    where: and(
      eq(attendance_records.workshop_id, workshopId),
      eq(attendance_records.day_number, dayNumber),
      eq(attendance_records.user_id, participantId)
    )
  });

  if (existing) {
    return c.json({
      data: {
        isAlreadyRecorded: true,
        record: existing,
        message: 'تم تسجيل الحضور مسبقاً'
      }
    });
  }

  const now = new Date().toISOString();
  const id = 'att_' + crypto.randomUUID().slice(0, 8);

  await db.insert(attendance_records).values({
    id,
    workshop_id: workshopId,
    day_number: dayNumber,
    user_id: participantId,
    status: 'present',
    check_in_time: now,
    reason: 'QR Scan',
    created_at: now
  });

  return c.json({
    data: {
      isAlreadyRecorded: false,
      id,
      workshopId,
      dayNumber,
      participantId,
      checkInTime: now
    }
  }, 201);
});

// List attendance records
attendanceRouter.get('/', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const workshopId = c.req.query('workshopId');
  const day = c.req.query('day');

  if (!workshopId) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'معرف الورشة مطلوب' } }, 400);
  }

  const conditions = [eq(attendance_records.workshop_id, workshopId)];
  if (day) {
    conditions.push(eq(attendance_records.day_number, parseInt(day, 10)));
  }

  const list = await db.query.attendance_records.findMany({
    where: and(...conditions)
  });

  return c.json({ data: list });
});
