import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';

// Better Auth tables
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified').notNull().default(0),
  image: text('image'),
  locale: text('locale').notNull().default('ar'),
  platform_role: text('platform_role').notNull().default('user'),
  status: text('status').notNull().default('active'),
  must_change_password: integer('must_change_password').notNull().default(0),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
  deleted_at: text('deleted_at'),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: text('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: text('accessTokenExpiresAt'),
  refreshTokenExpiresAt: text('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expiresAt').notNull(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// Workspaces
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  owner_id: text('owner_id').notNull().references(() => user.id),
  status: text('status').notNull().default('active'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const workspace_memberships = sqliteTable('workspace_memberships', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Organizations
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull(),
  type: text('type'),
  contact_email: text('contact_email'),
  contact_phone: text('contact_phone'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const organization_memberships = sqliteTable('organization_memberships', {
  id: text('id').primaryKey(),
  organization_id: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Programs
export const programs = sqliteTable('programs', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// Workshops
export const workshops = sqliteTable('workshops', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  program_id: text('program_id').references(() => programs.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  format: text('format').notNull().default('in_person'),
  location_name: text('location_name'),
  meeting_url: text('meeting_url'),
  start_date: text('start_date').notNull(),
  end_date: text('end_date').notNull(),
  max_participants: integer('max_participants').notNull().default(50),
  participant_approval_policy: text('participant_approval_policy').notNull().default('automatic'),
  attendance_tracking_method: text('attendance_tracking_method').notNull().default('qr_scan'),
  status: text('status').notNull().default('draft'),
  is_template: integer('is_template').notNull().default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const workshop_memberships = sqliteTable('workshop_memberships', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  organization_id: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  role: text('role').notNull().default('participant'),
  status: text('status').notNull().default('registered'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const agenda_items = sqliteTable('agenda_items', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  day_number: integer('day_number').notNull().default(1),
  title: text('title').notNull(),
  start_time: text('start_time').notNull(),
  end_time: text('end_time').notNull(),
  order_index: integer('order_index').notNull().default(0),
  description: text('description'),
  created_at: text('created_at').notNull(),
});

export const workshop_groups = sqliteTable('workshop_groups', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order_index: integer('order_index').notNull().default(0),
  created_at: text('created_at').notNull(),
});

export const group_memberships = sqliteTable('group_memberships', {
  id: text('id').primaryKey(),
  group_id: text('group_id').notNull().references(() => workshop_groups.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  created_at: text('created_at').notNull(),
});

export const invitations = sqliteTable('invitations', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  email: text('email'),
  role: text('role').notNull().default('participant'),
  max_uses: integer('max_uses').notNull().default(1),
  uses_count: integer('uses_count').notNull().default(0),
  expires_at: text('expires_at'),
  created_at: text('created_at').notNull(),
});

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  activity_type: text('activity_type').notNull(),
  target_audience: text('target_audience').notNull().default('all'),
  is_anonymous: integer('is_anonymous').notNull().default(0),
  time_limit_minutes: integer('time_limit_minutes'),
  status: text('status').notNull().default('draft'),
  fields_json: text('fields_json').notNull().default('[]'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  activity_id: text('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  user_id: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  group_id: text('group_id').references(() => workshop_groups.id, { onDelete: 'set null' }),
  is_draft: integer('is_draft').notNull().default(0),
  answers_json: text('answers_json').notNull().default('{}'),
  idempotency_key: text('idempotency_key'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const attendance_records = sqliteTable('attendance_records', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  day_number: integer('day_number').notNull().default(1),
  user_id: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('present'),
  check_in_time: text('check_in_time').notNull(),
  reason: text('reason'),
  created_at: text('created_at').notNull(),
});

export const live_states = sqliteTable('live_states', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id').notNull().unique().references(() => workshops.id, { onDelete: 'cascade' }),
  active_activity_id: text('active_activity_id').references(() => activities.id, { onDelete: 'set null' }),
  is_active: integer('is_active').notNull().default(0),
  version: integer('version').notNull().default(1),
  updated_at: text('updated_at').notNull(),
});

export const certificates = sqliteTable('certificates', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  workshop_id: text('workshop_id').notNull().references(() => workshops.id, { onDelete: 'cascade' }),
  workshop_membership_id: text('workshop_membership_id').notNull(),
  template_id: text('template_id').notNull(),
  public_code: text('public_code').notNull().unique(),
  recipient_name: text('recipient_name').notNull(),
  workshop_title: text('workshop_title').notNull(),
  issued_at: text('issued_at').notNull(),
  issued_by: text('issued_by').references(() => user.id),
  status: text('status').notNull().default('valid'),
  revoked_at: text('revoked_at'),
  revoked_by: text('revoked_by').references(() => user.id),
  revoke_reason: text('revoke_reason'),
});

export const audit_logs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  workspace_id: text('workspace_id').references(() => workspaces.id, { onDelete: 'set null' }),
  user_id: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: text('entity_id'),
  metadata_json: text('metadata_json'),
  created_at: text('created_at').notNull(),
});
