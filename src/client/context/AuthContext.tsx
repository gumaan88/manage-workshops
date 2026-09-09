import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  platformRole: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  switchDevUser: (email: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem('active_workspace_id');
  });

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/me');
      setUser(data);
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleSetActiveWorkspace = (id: string | null) => {
    setActiveWorkspaceId(id);
    if (id) {
      localStorage.setItem('active_workspace_id', id);
    } else {
      localStorage.removeItem('active_workspace_id');
    }
  };

  const switchDevUser = (email: string) => {
    localStorage.setItem('dev_user_email', email);
    refreshUser();
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (_) {}
    setUser(null);
    localStorage.removeItem('dev_user_email');
    localStorage.removeItem('active_workspace_id');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      activeWorkspaceId,
      setActiveWorkspaceId: handleSetActiveWorkspace,
      switchDevUser,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
