import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  api,
  API_BASE,
  setAccessToken,
  getAccessToken,
  resolveApiAssetUrl,
} from '@/lib/api';
import { useRouter } from 'next/router';

type User = {
  id: string;
  email: string;
  name: string;
  slug: string;
  phone?: string;
  whatsapp?: string;
  subjects: string[];
  avatar?: string;
  about?: string;
  role: string;
};

type RegisterData = {
  email: string;
  password: string;
  name: string;
  phone?: string;
};

type RequestRegistrationCodeResult = {
  message: string;
  email: string;
  expiresInMinutes: number;
};

function mapUser(raw: any): User {
  return {
    ...raw,
    avatar: resolveApiAssetUrl(raw.avatarUrl),
    about: raw.aboutText ?? raw.about,
  };
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestRegistrationCode: (data: RegisterData) => Promise<RequestRegistrationCodeResult>;
  verifyRegistrationCode: (data: { email: string; code: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_ROUTE_PREFIXES = ['/registration', '/t'];
const PUBLIC_ROUTE_EXACT = ['/'];

let refreshInFlight: Promise<void> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isPublicRoute =
    PUBLIC_ROUTE_EXACT.includes(router.pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((r) => router.pathname.startsWith(r));

  const refreshUser = useCallback(async () => {
    // Deduplicate concurrent calls (React StrictMode double-invokes effects)
    if (refreshInFlight) {
      await refreshInFlight;
      return;
    }
    const doRefresh = async () => {
      try {
        if (!getAccessToken()) {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setAccessToken(data.accessToken);
          } else {
            setLoading(false);
            return;
          }
        }
        const me = await api<any>('/auth/me');
        setUser(mapUser(me));
      } catch (err) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };
    refreshInFlight = doRefresh();
    try {
      await refreshInFlight;
    } finally {
      refreshInFlight = null;
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.replace('/registration');
    }
  }, [loading, user, isPublicRoute, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setAccessToken(res.accessToken);
      setUser(mapUser(res.user));
      router.push('/dashboard');
    },
    [router]
  );

  const requestRegistrationCode = useCallback(
    async (data: RegisterData) => {
      return api<RequestRegistrationCodeResult>('/auth/register', {
        method: 'POST',
        body: data,
      });
    },
    []
  );

  const verifyRegistrationCode = useCallback(
    async (data: { email: string; code: string }) => {
      const res = await api<{ user: any; accessToken: string }>('/auth/register/verify-code', {
        method: 'POST',
        body: data,
      });
      setAccessToken(res.accessToken);
      setUser(mapUser(res.user));
      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
    router.push('/registration');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        requestRegistrationCode,
        verifyRegistrationCode,
        logout,
        refreshUser,
      }}
    >
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
