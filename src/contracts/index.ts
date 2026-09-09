import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن لا يقل عن حرفين'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن لا تقل عن 8 أحرف')
});

// Workspace
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'اسم مساحة العمل مطلوب'),
  slug: z.string().min(2, 'المعرف اللطيف slug مطلوب').regex(/^[a-z0-9-]+$/, 'يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط'),
  description: z.string().optional()
});

// Organization
export const createOrganizationSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(2, 'اسم المنظمة مطلوب'),
  code: z.string().min(2, 'رمز المنظمة مطلوب'),
  type: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional()
});

// Program
export const createProgramSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(2, 'اسم البرنامج مطلوب'),
  code: z.string().min(2, 'رمز البرنامج مطلوب'),
  description: z.string().optional()
});

// Workshop
export const createWorkshopSchema = z.object({
  workspaceId: z.string(),
  programId: z.string().optional(),
  title: z.string().min(3, 'عنوان الورشة مطلوب'),
  code: z.string().min(2, 'رمز الورشة مطلوب'),
  description: z.string().optional(),
  format: z.enum(['in_person', 'remote', 'hybrid']).default('in_person'),
  locationName: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string(),
  endDate: z.string(),
  maxParticipants: z.number().int().positive().default(50),
  participantApprovalPolicy: z.enum(['automatic', 'manual_approval']).default('automatic')
});

// Agenda Item
export const createAgendaItemSchema = z.object({
  workshopId: z.string(),
  dayNumber: z.number().int().default(1),
  title: z.string().min(2, 'عنوان الفقرة مطلوب'),
  startTime: z.string(),
  endTime: z.string(),
  orderIndex: z.number().int().default(0),
  description: z.string().optional()
});

// Activity
export const createActivitySchema = z.object({
  workshopId: z.string(),
  title: z.string().min(2, 'عنوان النشاط مطلوب'),
  activityType: z.enum([
    'pre_assessment',
    'post_assessment',
    'survey',
    'quiz',
    'poll',
    'individual_exercise',
    'group_exercise',
    'action_plan',
    'commitment'
  ]),
  targetAudience: z.enum(['all', 'organization', 'group', 'individual']).default('all'),
  isAnonymous: z.boolean().default(false),
  timeLimitMinutes: z.number().int().optional(),
  fields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    fieldType: z.enum(['short_text', 'long_text', 'single_choice', 'multiple_choice', 'rating_scale', 'matrix', 'ranking', 'file_upload']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
    comparisonKey: z.string().optional()
  })).default([])
});

// Submission
export const submitActivitySchema = z.object({
  activityId: z.string(),
  answers: z.record(z.any()),
  isDraft: z.boolean().default(false),
  idempotencyKey: z.string().optional()
});

// Attendance
export const markAttendanceSchema = z.object({
  workshopId: z.string(),
  dayNumber: z.number().int().default(1),
  participantId: z.string(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  reason: z.string().optional()
});

export const scanQrAttendanceSchema = z.object({
  token: z.string()
});

// Certificates
export const issueCertificateSchema = z.object({
  workshopId: z.string(),
  participantId: z.string(),
  templateId: z.string().optional()
});
