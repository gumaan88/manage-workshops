PRAGMA foreign_keys = ON;

-- Authentication tables. Keep aligned with the installed Better Auth version.
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0 CHECK (emailVerified IN (0, 1)),
  image TEXT,
  locale TEXT NOT NULL DEFAULT 'ar',
  platform_role TEXT NOT NULL DEFAULT 'user' CHECK (platform_role IN ('user', 'platform_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY NOT NULL,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_user ON "session"(userId);
CREATE INDEX IF NOT EXISTS idx_session_expires ON "session"(expiresAt);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  password TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(providerId, accountId)
);

CREATE INDEX IF NOT EXISTS idx_account_user ON "account"(userId);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"(identifier);

-- Tenancy and memberships.
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  logo_file_id TEXT,
  primary_color TEXT NOT NULL DEFAULT '#17324D',
  accent_color TEXT NOT NULL DEFAULT '#D6A84B',
  default_locale TEXT NOT NULL DEFAULT 'ar' CHECK (default_locale IN ('ar', 'en')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Aden',
  retention_days INTEGER NOT NULL DEFAULT 730 CHECK (retention_days >= 30),
  anonymous_report_threshold INTEGER NOT NULL DEFAULT 5 CHECK (anonymous_report_threshold >= 3),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_deletion')),
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('workspace_owner', 'workspace_admin', 'program_manager')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'ended')),
  joined_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user ON workspace_memberships(user_id, status);

-- Organizations and people representation.
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  short_name TEXT,
  region TEXT,
  city TEXT,
  primary_field TEXT,
  secondary_fields_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(secondary_fields_json)),
  description TEXT,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  internal_notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'merged')),
  merged_into_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_organizations_workspace_name ON organizations(workspace_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_organizations_workspace_field ON organizations(workspace_id, primary_field);

CREATE TABLE IF NOT EXISTS organization_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON organization_memberships(workspace_id, user_id);

-- Programs and workshops.
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  owner_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  goals_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(goals_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_programs_workspace_status ON programs(workspace_id, status);

CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  cover_file_id TEXT,
  delivery_mode TEXT NOT NULL DEFAULT 'in_person' CHECK (delivery_mode IN ('in_person', 'online', 'hybrid')),
  venue_name TEXT,
  venue_address TEXT,
  meeting_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Aden',
  start_at TEXT,
  end_at TEXT,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  registration_mode TEXT NOT NULL DEFAULT 'invite_only' CHECK (registration_mode IN ('closed', 'invite_only', 'public')),
  registration_approval TEXT NOT NULL DEFAULT 'manual' CHECK (registration_approval IN ('automatic', 'manual')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'registration_open', 'scheduled', 'live', 'paused', 'completed', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
  participant_directory_enabled INTEGER NOT NULL DEFAULT 0 CHECK (participant_directory_enabled IN (0, 1)),
  completion_rule_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(completion_rule_json)),
  settings_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(settings_json)),
  source_template_id TEXT,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  archived_at TEXT,
  UNIQUE(workspace_id, slug),
  CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_workshops_workspace_status ON workshops(workspace_id, status, start_at);
CREATE INDEX IF NOT EXISTS idx_workshops_program ON workshops(workspace_id, program_id);

CREATE TABLE IF NOT EXISTS workshop_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('workshop_designer', 'facilitator', 'co_facilitator', 'coordinator', 'observer', 'participant')),
  registration_status TEXT NOT NULL DEFAULT 'approved' CHECK (registration_status IN ('invited', 'pending', 'approved', 'waitlisted', 'rejected', 'cancelled')),
  display_title TEXT,
  joined_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workshop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workshop_memberships_workshop_role ON workshop_memberships(workspace_id, workshop_id, role, registration_status);
CREATE INDEX IF NOT EXISTS idx_workshop_memberships_user ON workshop_memberships(user_id, registration_status);

CREATE TABLE IF NOT EXISTS workshop_objectives (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  success_indicator TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_objectives_workshop ON workshop_objectives(workspace_id, workshop_id, position);

CREATE TABLE IF NOT EXISTS workshop_axes (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_axes_workshop ON workshop_axes(workspace_id, workshop_id, position);

CREATE TABLE IF NOT EXISTS workshop_requirements (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('before', 'after')),
  title TEXT NOT NULL,
  description TEXT,
  due_at TEXT,
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0, 1)),
  activity_id TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requirements_workshop ON workshop_requirements(workspace_id, workshop_id, phase, position);

CREATE TABLE IF NOT EXISTS workshop_days (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  day_date TEXT NOT NULL,
  title TEXT,
  start_time TEXT,
  end_time TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workshop_id, day_date)
);

CREATE INDEX IF NOT EXISTS idx_workshop_days_order ON workshop_days(workspace_id, workshop_id, position);

CREATE TABLE IF NOT EXISTS agenda_items (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  workshop_day_id TEXT NOT NULL REFERENCES workshop_days(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('opening', 'presentation', 'discussion', 'activity', 'break', 'group_presentations', 'closing', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  facilitator_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  activity_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'participants' CHECK (visibility IN ('team', 'participants', 'public')),
  position INTEGER NOT NULL DEFAULT 0,
  actual_started_at TEXT,
  actual_ended_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_agenda_workshop_order ON agenda_items(workspace_id, workshop_id, workshop_day_id, position);

-- Invitations and registration.
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT REFERENCES workshops(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT,
  intended_role TEXT NOT NULL DEFAULT 'participant' CHECK (intended_role IN ('workspace_admin', 'program_manager', 'workshop_designer', 'facilitator', 'co_facilitator', 'coordinator', 'observer', 'participant')),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'revoked', 'expired')),
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TEXT NOT NULL,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  accepted_at TEXT,
  CHECK (used_count <= max_uses)
);

CREATE INDEX IF NOT EXISTS idx_invitations_scope ON invitations(workspace_id, workshop_id, status, expires_at);

CREATE TABLE IF NOT EXISTS registration_fields (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('short_text', 'long_text', 'email', 'phone', 'single_choice', 'multi_choice', 'consent')),
  label TEXT NOT NULL,
  description TEXT,
  required INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1)),
  sensitive INTEGER NOT NULL DEFAULT 0 CHECK (sensitive IN (0, 1)),
  options_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(options_json)),
  validation_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(validation_json)),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workshop_id, field_key)
);

CREATE TABLE IF NOT EXISTS registration_responses (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  invitation_id TEXT REFERENCES invitations(id) ON DELETE SET NULL,
  answers_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(answers_json)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'waitlisted', 'rejected', 'cancelled')),
  consented_at TEXT,
  reviewed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  review_note TEXT,
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workshop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_status ON registration_responses(workspace_id, workshop_id, status);

-- Files and materials.
CREATE TABLE IF NOT EXISTS file_assets (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  sha256 TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('workspace_brand', 'workshop_cover', 'material', 'submission', 'certificate_asset', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'quarantined', 'deleted')),
  uploaded_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_file_assets_workspace_status ON file_assets(workspace_id, status, created_at);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  agenda_item_id TEXT REFERENCES agenda_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('file', 'link', 'text')),
  file_asset_id TEXT REFERENCES file_assets(id) ON DELETE SET NULL,
  external_url TEXT,
  body TEXT,
  visibility TEXT NOT NULL DEFAULT 'participants' CHECK (visibility IN ('team', 'participants', 'public')),
  available_from TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_materials_workshop ON materials(workspace_id, workshop_id, position);

-- Groups.
CREATE TABLE IF NOT EXISTS workshop_groups (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  activity_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  group_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workshop_id, activity_id, group_key)
);

CREATE INDEX IF NOT EXISTS idx_groups_workshop ON workshop_groups(workspace_id, workshop_id, activity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_general_key_unique
  ON workshop_groups(workshop_id, group_key)
  WHERE activity_id IS NULL;

CREATE TABLE IF NOT EXISTS group_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES workshop_groups(id) ON DELETE CASCADE,
  workshop_membership_id TEXT NOT NULL REFERENCES workshop_memberships(id) ON DELETE CASCADE,
  group_role TEXT NOT NULL DEFAULT 'member' CHECK (group_role IN ('member', 'leader', 'recorder')),
  joined_at TEXT NOT NULL,
  left_at TEXT,
  UNIQUE(group_id, workshop_membership_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_active ON group_memberships(workspace_id, group_id, left_at);

-- Activities and versions.
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('survey', 'quiz', 'poll', 'individual_exercise', 'group_exercise', 'self_assessment', 'facilitator_assessment', 'commitment', 'form')),
  title TEXT NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'open', 'paused', 'closed', 'archived')),
  ownership_mode TEXT NOT NULL DEFAULT 'individual' CHECK (ownership_mode IN ('individual', 'organization', 'group', 'facilitator')),
  identity_mode TEXT NOT NULL DEFAULT 'named' CHECK (identity_mode IN ('named', 'facilitator_hidden', 'anonymous')),
  current_version_id TEXT,
  opens_at TEXT,
  closes_at TEXT,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  attempt_policy TEXT NOT NULL DEFAULT 'editable_until_close' CHECK (attempt_policy IN ('single', 'multiple', 'editable_until_close')),
  max_attempts INTEGER CHECK (max_attempts IS NULL OR max_attempts > 0),
  show_results_policy TEXT NOT NULL DEFAULT 'after_close' CHECK (show_results_policy IN ('never', 'after_submit', 'after_close', 'facilitator_controlled')),
  comparison_phase TEXT CHECK (comparison_phase IS NULL OR comparison_phase IN ('pre', 'post')),
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_activities_workshop_status ON activities(workspace_id, workshop_id, status);

CREATE TABLE IF NOT EXISTS activity_versions (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL CHECK (version_no > 0),
  instructions TEXT,
  expected_output TEXT,
  settings_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(settings_json)),
  schema_hash TEXT NOT NULL,
  is_locked INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  UNIQUE(activity_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_activity_versions_activity ON activity_versions(workspace_id, activity_id, version_no);

CREATE TABLE IF NOT EXISTS activity_fields (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  activity_version_id TEXT NOT NULL REFERENCES activity_versions(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('short_text', 'long_text', 'number', 'scale', 'single_choice', 'multi_choice', 'boolean', 'ranking', 'matrix', 'date', 'time', 'url', 'file')),
  label TEXT NOT NULL,
  description TEXT,
  placeholder TEXT,
  required INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1)),
  sensitive INTEGER NOT NULL DEFAULT 0 CHECK (sensitive IN (0, 1)),
  comparison_key TEXT,
  validation_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(validation_json)),
  visibility_rule_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(visibility_rule_json)),
  scoring_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(scoring_json)),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(activity_version_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_activity_fields_version ON activity_fields(workspace_id, activity_version_id, position);
CREATE INDEX IF NOT EXISTS idx_activity_fields_comparison ON activity_fields(workspace_id, comparison_key);

CREATE TABLE IF NOT EXISTS activity_options (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  activity_field_id TEXT NOT NULL REFERENCES activity_fields(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL,
  label TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT 'null' CHECK (json_valid(value_json)),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(activity_field_id, option_key)
);

CREATE INDEX IF NOT EXISTS idx_activity_options_field ON activity_options(workspace_id, activity_field_id, position);

CREATE TABLE IF NOT EXISTS activity_targets (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('all_participants', 'organization', 'group', 'user')),
  target_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_targets ON activity_targets(workspace_id, activity_id, target_type, target_id);

CREATE TABLE IF NOT EXISTS rubrics (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  activity_version_id TEXT NOT NULL UNIQUE REFERENCES activity_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  max_score REAL NOT NULL DEFAULT 100 CHECK (max_score > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rubric_criteria (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rubric_id TEXT NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  weight REAL NOT NULL CHECK (weight > 0),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rubric_criteria ON rubric_criteria(workspace_id, rubric_id, position);

CREATE TABLE IF NOT EXISTS rubric_levels (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  criterion_id TEXT NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  numeric_value REAL NOT NULL CHECK (numeric_value >= 0),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rubric_levels ON rubric_levels(workspace_id, criterion_id, position);

-- Submissions and evaluation.
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  activity_version_id TEXT NOT NULL REFERENCES activity_versions(id) ON DELETE RESTRICT,
  owner_key TEXT NOT NULL,
  owner_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  owner_organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  owner_group_id TEXT REFERENCES workshop_groups(id) ON DELETE SET NULL,
  attempt_no INTEGER NOT NULL DEFAULT 1 CHECK (attempt_no > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'returned', 'resubmitted', 'evaluated')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  auto_score REAL,
  score_max REAL,
  submitted_at TEXT,
  last_edited_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(activity_id, activity_version_id, owner_key, attempt_no)
);

CREATE INDEX IF NOT EXISTS idx_submissions_activity_status ON submissions(workspace_id, workshop_id, activity_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_owner_user ON submissions(workspace_id, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_owner_org ON submissions(workspace_id, owner_organization_id);
CREATE INDEX IF NOT EXISTS idx_submissions_owner_group ON submissions(workspace_id, owner_group_id);

CREATE TABLE IF NOT EXISTS submission_answers (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  activity_field_id TEXT NOT NULL REFERENCES activity_fields(id) ON DELETE RESTRICT,
  value_json TEXT NOT NULL DEFAULT 'null' CHECK (json_valid(value_json)),
  text_search_value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(submission_id, activity_field_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_submission ON submission_answers(workspace_id, submission_id);

CREATE TABLE IF NOT EXISTS submission_files (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  activity_field_id TEXT NOT NULL REFERENCES activity_fields(id) ON DELETE RESTRICT,
  file_asset_id TEXT NOT NULL REFERENCES file_assets(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  UNIQUE(submission_id, activity_field_id, file_asset_id)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  rubric_id TEXT REFERENCES rubrics(id) ON DELETE SET NULL,
  evaluator_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  revision_no INTEGER NOT NULL DEFAULT 1 CHECK (revision_no > 0),
  total_score REAL,
  participant_feedback TEXT,
  internal_note TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'superseded')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(submission_id, evaluator_user_id, revision_no)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_submission ON evaluations(workspace_id, submission_id, status);

CREATE TABLE IF NOT EXISTS evaluation_scores (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  criterion_id TEXT NOT NULL REFERENCES rubric_criteria(id) ON DELETE RESTRICT,
  rubric_level_id TEXT REFERENCES rubric_levels(id) ON DELETE SET NULL,
  numeric_value REAL NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(evaluation_id, criterion_id)
);

-- Attendance.
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  workshop_day_id TEXT NOT NULL REFERENCES workshop_days(id) ON DELETE CASCADE,
  agenda_item_id TEXT REFERENCES agenda_items(id) ON DELETE SET NULL,
  workshop_membership_id TEXT NOT NULL REFERENCES workshop_memberships(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'excused', 'absent')),
  check_in_at TEXT,
  check_out_at TEXT,
  method TEXT NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'qr', 'code', 'import')),
  recorded_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  correction_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workshop_day_id, agenda_item_id, workshop_membership_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_workshop_day ON attendance_records(workspace_id, workshop_id, workshop_day_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_daily_unique
  ON attendance_records(workshop_day_id, workshop_membership_id)
  WHERE agenda_item_id IS NULL;

-- Live runtime state and events.
CREATE TABLE IF NOT EXISTS live_states (
  workshop_id TEXT PRIMARY KEY NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  current_agenda_item_id TEXT REFERENCES agenda_items(id) ON DELETE SET NULL,
  current_activity_id TEXT REFERENCES activities(id) ON DELETE SET NULL,
  runtime_status TEXT NOT NULL DEFAULT 'not_started' CHECK (runtime_status IN ('not_started', 'live', 'paused', 'ended')),
  timer_ends_at TEXT,
  announcement TEXT,
  state_version INTEGER NOT NULL DEFAULT 1 CHECK (state_version > 0),
  updated_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_states_workspace ON live_states(workspace_id, runtime_status);

CREATE TABLE IF NOT EXISTS live_events (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('workshop_started', 'workshop_paused', 'workshop_ended', 'agenda_changed', 'activity_opened', 'activity_paused', 'activity_closed', 'timer_extended', 'announcement_sent', 'result_visibility_changed')),
  payload_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload_json)),
  actor_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_events_workshop ON live_events(workspace_id, workshop_id, created_at);

-- Notifications and scheduled work.
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  workshop_id TEXT REFERENCES workshops(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('invitation', 'registration', 'reminder', 'live', 'activity', 'certificate', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, created_at);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider_message_id TEXT,
  last_error_code TEXT,
  next_attempt_at TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(notification_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_retry ON notification_deliveries(status, next_attempt_at);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload_json)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  run_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  locked_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_due ON scheduled_jobs(status, run_at);

-- Reports and certificates.
CREATE TABLE IF NOT EXISTS report_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  revision_no INTEGER NOT NULL CHECK (revision_no > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'superseded')),
  title TEXT NOT NULL,
  narrative_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(narrative_json)),
  metrics_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metrics_json)),
  generated_at TEXT NOT NULL,
  generated_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  approved_at TEXT,
  approved_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  UNIQUE(workshop_id, revision_no)
);

CREATE INDEX IF NOT EXISTS idx_reports_workshop ON report_snapshots(workspace_id, workshop_id, status);

CREATE TABLE IF NOT EXISTS certificate_templates (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  layout_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(layout_json)),
  background_file_id TEXT REFERENCES file_assets(id) ON DELETE SET NULL,
  signature_file_id TEXT REFERENCES file_assets(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  workshop_membership_id TEXT NOT NULL REFERENCES workshop_memberships(id) ON DELETE RESTRICT,
  template_id TEXT NOT NULL REFERENCES certificate_templates(id) ON DELETE RESTRICT,
  public_code TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  workshop_title TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  issued_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
  revoked_at TEXT,
  revoked_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  UNIQUE(workshop_id, workshop_membership_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_workshop ON certificates(workspace_id, workshop_id, status);

-- Reusable templates.
CREATE TABLE IF NOT EXISTS workshop_templates (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  version_no INTEGER NOT NULL DEFAULT 1 CHECK (version_no > 0),
  blueprint_json TEXT NOT NULL CHECK (json_valid(blueprint_json)),
  source_workshop_id TEXT REFERENCES workshops(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, name, version_no)
);

CREATE INDEX IF NOT EXISTS idx_templates_workspace ON workshop_templates(workspace_id, status, category);

-- Idempotency, support and audit.
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  key_hash TEXT NOT NULL,
  route TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_json TEXT CHECK (response_json IS NULL OR json_valid(response_json)),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(workspace_id, key_hash, route)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expiry ON idempotency_keys(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_global_unique
  ON idempotency_keys(key_hash, route)
  WHERE workspace_id IS NULL;

CREATE TABLE IF NOT EXISTS support_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform_admin_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT NOT NULL,
  CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_support_sessions_active ON support_sessions(workspace_id, expires_at, ended_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
  actor_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  support_session_id TEXT REFERENCES support_sessions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_summary TEXT,
  changes_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(changes_json)),
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_workspace_time ON audit_logs(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(workspace_id, resource_type, resource_id, created_at);

-- Add deferred foreign key relationships that are intentionally cyclic at the application layer.
-- SQLite cannot add FK constraints after table creation; the application must validate:
-- workshops.source_template_id -> workshop_templates.id
-- activities.current_version_id -> activity_versions.id
-- workshop_requirements.activity_id -> activities.id
-- agenda_items.activity_id -> activities.id
-- workshop_groups.activity_id -> activities.id
-- workspaces.logo_file_id and workshops.cover_file_id -> file_assets.id
