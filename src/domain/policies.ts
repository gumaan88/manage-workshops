import { WorkspaceRole, WorkshopRole, PlatformRole } from '../shared/types';

export interface UserContext {
  userId: string;
  platformRole: PlatformRole;
  workspaceMemberships?: Array<{ workspaceId: string; role: WorkspaceRole }>;
  workshopMemberships?: Array<{ workshopId: string; role: WorkshopRole }>;
}

export class PolicyEngine {
  /**
   * AC-001: Workspace Isolation check.
   * Ensures the user has authorization for the specified workspace.
   */
  static canAccessWorkspace(user: UserContext, workspaceId: string): boolean {
    if (user.platformRole === 'platform_admin') return true;
    return user.workspaceMemberships?.some(m => m.workspaceId === workspaceId) ?? false;
  }

  static canManageWorkspace(user: UserContext, workspaceId: string): boolean {
    if (user.platformRole === 'platform_admin') return true;
    const membership = user.workspaceMemberships?.find(m => m.workspaceId === workspaceId);
    return membership?.role === 'owner' || membership?.role === 'admin';
  }

  static canManageWorkshop(user: UserContext, workspaceId: string, workshopId: string): boolean {
    if (this.canManageWorkspace(user, workspaceId)) return true;
    const membership = user.workshopMemberships?.find(m => m.workshopId === workshopId);
    return membership?.role === 'lead_facilitator' || membership?.role === 'facilitator' || membership?.role === 'coordinator';
  }

  static canViewSubmission(
    user: UserContext,
    submission: { userId: string | null; isAnonymous: boolean; groupId?: string | null },
    userGroupIds: string[],
    isFacilitator: boolean
  ): boolean {
    // Facilitators can view submissions
    if (isFacilitator) return true;

    // Group submissions
    if (submission.groupId) {
      return userGroupIds.includes(submission.groupId);
    }

    // Individual submissions
    return submission.userId === user.userId;
  }
}
