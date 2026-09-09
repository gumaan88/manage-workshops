import { describe, it, expect } from 'vitest';
import { PolicyEngine, UserContext } from '../../src/domain/policies';

describe('AC-001: Workspace Isolation & PolicyEngine', () => {
  const adminUser: UserContext = {
    userId: 'usr_admin',
    platformRole: 'platform_admin',
    workspaceMemberships: [{ workspaceId: 'ws_alpha', role: 'owner' }]
  };

  const alphaUser: UserContext = {
    userId: 'usr_alpha',
    platformRole: 'user',
    workspaceMemberships: [{ workspaceId: 'ws_alpha', role: 'member' }]
  };

  const betaUser: UserContext = {
    userId: 'usr_beta',
    platformRole: 'user',
    workspaceMemberships: [{ workspaceId: 'ws_beta', role: 'owner' }]
  };

  it('allows user to access their own workspace', () => {
    expect(PolicyEngine.canAccessWorkspace(alphaUser, 'ws_alpha')).toBe(true);
    expect(PolicyEngine.canAccessWorkspace(betaUser, 'ws_beta')).toBe(true);
  });

  it('strictly blocks user from accessing another workspace (AC-001 Isolation)', () => {
    // User Beta attempts to access Workspace Alpha -> must be blocked!
    expect(PolicyEngine.canAccessWorkspace(betaUser, 'ws_alpha')).toBe(false);
    expect(PolicyEngine.canAccessWorkspace(alphaUser, 'ws_beta')).toBe(false);
  });

  it('allows platform_admin to access all workspaces', () => {
    expect(PolicyEngine.canAccessWorkspace(adminUser, 'ws_alpha')).toBe(true);
    expect(PolicyEngine.canAccessWorkspace(adminUser, 'ws_beta')).toBe(true);
    expect(PolicyEngine.canAccessWorkspace(adminUser, 'ws_unknown')).toBe(true);
  });

  it('enforces manage permissions only for owner/admin', () => {
    expect(PolicyEngine.canManageWorkspace(alphaUser, 'ws_alpha')).toBe(false);
    expect(PolicyEngine.canManageWorkspace(betaUser, 'ws_beta')).toBe(true);
  });
});
