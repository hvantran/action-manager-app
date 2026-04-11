import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserInfo {
  username: string | null;
  email: string | null;
  name: string | null;
  roles: string[];
  authenticated: boolean;
}

interface UserInfoContextValue {
  userInfo: UserInfo;
  loading: boolean;
  error: string | null;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getDisplayName: () => string;
}

const defaultUserInfo: UserInfo = {
  username: null,
  email: null,
  name: null,
  roles: [],
  authenticated: false,
};

const UserInfoContext = createContext<UserInfoContextValue | undefined>(undefined);

// Get Gateway base URL from runtime environment or fallback to localhost
const getGatewayBaseUrl = (): string => {
  const actionManagerUrl =
    (window as any)._env_?.REACT_APP_ACTION_MANAGER_BACKEND_URL ||
    process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL ||
    'http://localhost:6081/api/action-manager';
  return actionManagerUrl.replace('/api/action-manager', '');
};

const GATEWAY_BASE_URL = getGatewayBaseUrl();

export const UserInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(defaultUserInfo);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${GATEWAY_BASE_URL}/api/userinfo`, {
          method: 'GET',
          credentials: 'include',
          redirect: 'manual',
          headers: {
            'Accept': 'application/json',
          },
        });

        // Keep auth flow in the top-level browser redirect to avoid
        // cross-origin CORS noise when gateway redirects to Keycloak.
        if (response.type === 'opaqueredirect' || response.status === 302 || response.status === 401) {
          setUserInfo(defaultUserInfo);
          setError(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch user info: ${response.status}`);
        }

        const data: UserInfo = await response.json();
        setUserInfo(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUserInfo(defaultUserInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const hasRole = (role: string): boolean => {
    return userInfo.roles.includes(role) || userInfo.roles.includes(`ROLE_${role}`);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const getDisplayName = (): string => {
    return userInfo.name || userInfo.username || 'User';
  };

  return (
    <UserInfoContext.Provider value={{ userInfo, loading, error, hasRole, hasAnyRole, getDisplayName }}>
      {children}
    </UserInfoContext.Provider>
  );
};

export const useUserInfoContext = (): UserInfoContextValue => {
  const context = useContext(UserInfoContext);
  if (context === undefined) {
    throw new Error('useUserInfoContext must be used within a UserInfoProvider');
  }
  return context;
};
