import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { certificates, workshops, user } from '../../data/schema';
import { issueCertificateSchema } from '../../contracts';
import { requireAuth } from '../middleware/auth';
import { AppContext } from '../types';

export const certificatesRouter = new Hono<AppContext>();

// Issue certificate (AC-012)
certificatesRouter.post('/issue', requireAuth, zValidator('json', issueCertificateSchema), async (c) => {
  const db = c.get('db' as any);
  const body = c.req.valid('json');

  // Check if participant already has a certificate for this workshop (AC-012)
  const existing = await db.query.certificates.findFirst({
    where: (cert: any, { and, eq }: any) => and(
      eq(cert.workshop_id, body.workshopId),
      eq(cert.user_id, body.participantId)
    )
  });

  if (existing) {
    return c.json({ data: existing });
  }

  const now = new Date().toISOString();
  const id = 'cert_' + crypto.randomUUID().slice(0, 8);
  const code = 'CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  await db.insert(certificates).values({
    id,
    workshop_id: body.workshopId,
    user_id: body.participantId,
    certificate_code: code,
    issued_at: now,
    status: 'active',
    created_at: now
  });

  return c.json({
    data: {
      id,
      certificateCode: code,
      issuedAt: now,
      status: 'active'
    }
  }, 201);
});

// Public verify certificate (AC-012: does not reveal email or sensitive PII)
certificatesRouter.get('/verify/:code', async (c) => {
  const db = c.get('db' as any);
  const code = c.req.param('code');

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.certificate_code, code)
  });

  if (!cert) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'رمز الشهادة غير صالح أو غير موجود'
      }
    }, 404);
  }

  const ws = await db.query.workshops.findFirst({
    where: eq(workshops.id, cert.workshop_id)
  });

  const participant = await db.query.user.findFirst({
    where: eq(user.id, cert.user_id)
  });

  return c.json({
    data: {
      certificateCode: cert.certificate_code,
      issuedAt: cert.issued_at,
      status: cert.status,
      workshopTitle: ws?.title || 'ورشة عمل',
      recipientName: participant?.name || 'مشارك معتمد'
      // Note: email and other private details omitted deliberately for privacy (AC-012)
    }
  });
});
