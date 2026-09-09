import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { workshops, attendance_records, submissions, activities } from '../../data/schema';
import { ActivityEngine } from '../../domain/activityEngine';
import { requireAuth } from '../middleware/auth';
import { AppContext } from '../types';

export const reportsRouter = new Hono<AppContext>();

// Workshop comprehensive report (AC-010, AC-011)
reportsRouter.get('/:workshopId', requireAuth, async (c) => {
  const db = c.get('db' as any);
  const workshopId = c.req.param('workshopId');

  const ws = await db.query.workshops.findFirst({
    where: eq(workshops.id, workshopId)
  });

  if (!ws) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'الورشة غير موجودة' } }, 404);
  }

  // Attendance stats
  const attendanceList = await db.query.attendance_records.findMany({
    where: eq(attendance_records.workshop_id, workshopId)
  });

  const presentCount = attendanceList.filter((a: any) => a.status === 'present').length;
  const attendanceRate = ws.max_participants > 0 ? (presentCount / ws.max_participants) * 100 : 0;

  // Submissions stats
  const allSubmissions = await db.query.submissions.findMany({
    where: and(
      eq(submissions.workshop_id, workshopId),
      eq(submissions.is_draft, 0)
    )
  });

  // Pre vs Post Analysis (AC-010)
  const allActivities = await db.query.activities.findMany({
    where: eq(activities.workshop_id, workshopId)
  });

  const preAct = allActivities.find((a: any) => a.activity_type === 'pre_assessment');
  const postAct = allActivities.find((a: any) => a.activity_type === 'post_assessment');

  let prePostComparison = null;
  if (preAct && postAct) {
    const preSubs = allSubmissions.filter((s: any) => s.activity_id === preAct.id);
    const postSubs = allSubmissions.filter((s: any) => s.activity_id === postAct.id);

    const preFields = JSON.parse(preAct.fields_json || '[]');
    const postFields = JSON.parse(postAct.fields_json || '[]');

    const comparisons: any[] = [];
    for (const pf of preFields) {
      if (pf.comparisonKey) {
        const matchingPost = postFields.find((f: any) => f.comparisonKey === pf.comparisonKey);
        if (matchingPost) {
          const preAnswers = preSubs.map((s: any) => {
            const ans = JSON.parse(s.answers_json || '{}');
            return { userId: s.user_id, value: ans[pf.key] };
          }).filter((a: any) => a.value !== undefined);

          const postAnswers = postSubs.map((s: any) => {
            const ans = JSON.parse(s.answers_json || '{}');
            return { userId: s.user_id, value: ans[matchingPost.key] };
          }).filter((a: any) => a.value !== undefined);

          comparisons.push(ActivityEngine.comparePrePost(preAnswers, postAnswers, pf.comparisonKey));
        }
      }
    }
    prePostComparison = comparisons;
  }

  return c.json({
    data: {
      workshop: ws,
      metrics: {
        totalRegistered: ws.max_participants,
        presentAttendees: presentCount,
        attendanceRate: Number(attendanceRate.toFixed(1)),
        totalSubmissions: allSubmissions.length
      },
      prePostComparison,
      generatedAt: new Date().toISOString()
    }
  });
});
