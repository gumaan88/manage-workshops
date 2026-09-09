export type PlatformRole = 'user' | 'platform_admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type OrganizationRole = 'manager' | 'representative' | 'member';
export type WorkshopRole = 'lead_facilitator' | 'facilitator' | 'coordinator' | 'evaluator' | 'participant' | 'observer';

export type WorkshopFormat = 'in_person' | 'remote' | 'hybrid';
export type WorkshopStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'archived' | 'cancelled';
export type ParticipantApprovalPolicy = 'automatic' | 'manual_approval';
export type AttendanceTrackingMethod = 'qr_scan' | 'manual' | 'both';

export type ActivityType = 
  | 'pre_assessment' 
  | 'post_assessment' 
  | 'survey' 
  | 'quiz' 
  | 'poll' 
  | 'individual_exercise' 
  | 'group_exercise' 
  | 'action_plan' 
  | 'commitment';

export type TargetAudience = 'all' | 'organization' | 'group' | 'individual';
export type ActivityStatus = 'draft' | 'published' | 'closed';
export type FieldType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'rating_scale' | 'matrix' | 'ranking' | 'file_upload';

export interface UserSession {
  id: string;
  userId: string;
  email: string;
  name: string;
  platformRole: PlatformRole;
  image?: string | null;
}

export interface ApiResponse<T = any> {
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}
