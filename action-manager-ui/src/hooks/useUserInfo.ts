import { useState, useEffect } from 'react';

export interface UserInfo {
  username: string | null;
  email: string | null;
  name: string | null;
  roles: string[];
  authenticated: boolean;
}

const GATEWAY_BASE_URL = process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL?.replace('/api/action-manager', '') || 'http://localhost:6081';

/**
 * React hook to fetch and manage authenticated user information
 * Retrieves user details from Gateway's /api/userinfo endpoint
 * 
 * @returns {Object} Object containing user info, loading state, and error
 */
export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: null,
    email: null,
    name: null,
    roles: [],
    authenticated: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${GATEWAY_BASE_URL}/api/userinfo`, {
          method: 'GET',
          credentials: 'include', // Important: include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user info: ${response.status}`);
        }

        const data: UserInfo = await response.json();
        setUserInfo(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUserInfo({
          username: null,
          email: null,
          name: null,
          roles: [],
          authenticated: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    return userInfo.roles.includes(role) || userInfo.roles.includes(`ROLE_${role}`);
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  /**
   * Get display name (name or fallback to username)
   */
  const getDisplayName = (): string => {
    return userInfo.name || userInfo.username || 'User';
  };

  return {
    userInfo,
    loading,
    error,
    hasRole,
    hasAnyRole,
    getDisplayName,
  };
};
