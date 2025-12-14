import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
export type UserRole = 'Owner' | 'Manager' | 'Operator' | 'Driver' | 'HR Admin';
export const ROLES: Record<UserRole, { name: UserRole; permissions: string[] }> = {
  Owner: { name: 'Owner', permissions: ['/', '/pos', '/finance', '/hr', '/logistics', '/compliance', '/marketplace', '/chat', '/settings', '/portal'] },
  Manager: { name: 'Manager', permissions: ['/', '/pos', '/finance', '/hr', '/logistics', '/chat', '/settings'] },
  Operator: { name: 'Operator', permissions: ['/pos', '/hr', '/chat', '/settings'] },
  Driver: { name: 'Driver', permissions: ['/logistics', '/chat', '/settings'] },
  'HR Admin': { name: 'HR Admin', permissions: ['/hr', '/chat', '/settings'] },
};
export const useAuth = () => {
  const [jwt, setJwt] = useState<string | null>(localStorage.getItem('jwt'));
  const [role, setRole] = useState<UserRole | null>(localStorage.getItem('userRole') as UserRole | null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userRole');
    setJwt(null);
    setRole(null);
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);
  useEffect(() => {
    const validateToken = async () => {
      if (!jwt) {
        setIsAuthenticated(false);
        return;
      }
      try {
        const response = await fetch('/api/auth/validate', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setIsAuthenticated(true);
            setRole(data.role);
            localStorage.setItem('userRole', data.role);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (error) {
        console.error('Validation error:', error);
        setIsAuthenticated(false); // Assume invalid on network error
      }
    };
    validateToken();
  }, [jwt, logout]);
  const login = async (email: string, password: string):Promise<boolean> => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.token && data.user.role) {
                localStorage.setItem('jwt', data.token);
                localStorage.setItem('userRole', data.user.role);
                setJwt(data.token);
                setRole(data.user.role);
                setIsAuthenticated(true);
                return true;
            }
        }
    } catch (error) {
        console.error('Login API call failed:', error);
    }
    return false;
  };
  const canAccess = useCallback((path: string) => {
    if (!isAuthenticated || !role || !ROLES[role]) {
      return false;
    }
    return ROLES[role].permissions.includes(path);
  }, [isAuthenticated, role]);
  return {
    isAuthenticated,
    jwt,
    role,
    login,
    logout,
    canAccess,
    roles: Object.keys(ROLES) as UserRole[],
  };
};