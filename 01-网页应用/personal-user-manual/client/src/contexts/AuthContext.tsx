import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { AppUser } from '@shared/api.interface';
import { authApi } from '@client/src/api';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AppUser>;
  register: (
    username: string,
    password: string,
    displayName?: string,
  ) => Promise<AppUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const res = await authApi.getCurrentUser();
      setUser(res.user);
    } catch (error) {
      logger.error('获取当前用户失败', error);
      setUser(null);
    }
  }, []);

  // 应用启动时检查登录态
  useEffect(() => {
    let mounted = true;
    (async () => {
      await refreshUser();
      if (mounted) {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  // 设置 axios 401 拦截器
  useEffect(() => {
    const interceptor = axiosForBackend.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401 && user) {
          // 已登录用户收到 401，说明 session 失效，清除状态并跳转登录页
          setUser(null);
          const currentPath = location.pathname;
          if (!['/login', '/register'].includes(currentPath)) {
            navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axiosForBackend.interceptors.response.eject(interceptor);
    };
  }, [user, navigate, location.pathname]);

  const login = useCallback(
    async (username: string, password: string): Promise<AppUser> => {
      const res = await authApi.login({ username, password });
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const register = useCallback(
    async (
      username: string,
      password: string,
      displayName?: string,
    ): Promise<AppUser> => {
      const res = await authApi.register({ username, password, displayName });
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      logger.error('登出请求失败', error);
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
