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
  const db = c.get('db');
  const body = c.req.valid('json');

  const ws = await db.query.workshops.findFirst({
    where: eq(workshops.id, body.workshopId)
  });

  const recipient = await db.query.user.findFirst({
    where: eq(user.id, body.participantId)
  });

  const now = new Date().toISOString();
  const id = 'cert_' + crypto.randomUUID().slice(0, 8);
  const code = 'CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  await db.insert(certificates).values({
    id,
    workspace_id: ws?.workspace_id || 'ws_default',
    workshop_id: body.workshopId,
    workshop_membership_id: 'wsm_' + body.participantId,
    template_id: body.templateId || 'cert_template_seed',
    public_code: code,
    recipient_name: recipient?.name || 'مشارك معتمد',
    workshop_title: ws?.title || 'ورشة عمل',
    issued_at: now,
    status: 'valid'
  });

  return c.json({
    data: {
      id,
      certificateCode: code,
      issuedAt: now,
      status: 'valid'
    }
  }, 201);
});

// Public verify certificate (AC-012: does not reveal email or sensitive PII)
certificatesRouter.get('/verify/:code', async (c) => {
  const db = c.get('db');
  const code = c.req.param('code');

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.public_code, code)
  });

  if (!cert) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'رمز الشهادة غير صالح أو غير موجود'
      }
    }, 404);
  }

  return c.json({
    data: {
      certificateCode: cert.public_code,
      issuedAt: cert.issued_at,
      status: cert.status,
      workshopTitle: cert.workshop_title,
      recipientName: cert.recipient_name
      // Note: email and other private details omitted deliberately for privacy (AC-012)
    }
  });
});
