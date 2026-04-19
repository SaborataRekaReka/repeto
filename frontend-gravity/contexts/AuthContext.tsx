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
  slug?: string | null;
  phone?: string;
  whatsapp?: string;
  subjects: string[];
  avatar?: string;
  about?: string;
  role?: string;
  platformAccess?: PlatformAccess | null;
  platformAccessState?: PlatformAccessState;
};

type PlanId = 'start' | 'profi' | 'center';
type BillingCycle = 'month' | 'year';
type PlatformAccessState = 'active' | 'expired' | 'missing';

type PlatformAccess = {
  status?: string | null;
  planId?: PlanId | null;
  billingCycle?: BillingCycle | null;
  activatedAt?: string | null;
  expiresAt?: string | null;
  amountRub?: number | null;
  paymentId?: string | null;
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

type VerifyRegistrationCodeResult = {
  verificationToken: string;
  email: string;
  expiresInMinutes: number;
};

type StartPlatformAccessPaymentResult = {
  requiresPayment: boolean;
  amountRub: number;
  planId: PlanId;
  billingCycle: BillingCycle;
  paymentId?: string;
  confirmationUrl?: string;
  user?: User;
};

type CompletePlatformAccessPaymentResult = {
  user: User;
  amountRub: number;
  planId: PlanId;
  billingCycle: BillingCycle;
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
  verifyRegistrationCode: (data: { email: string; code: string }) => Promise<VerifyRegistrationCodeResult>;
  startPlatformAccessPayment: (data?: {
    planId?: PlanId;
    billingCycle?: BillingCycle;
  }) => Promise<StartPlatformAccessPaymentResult>;
  completePlatformAccessPayment: (data: {
    paymentId: string;
  }) => Promise<CompletePlatformAccessPaymentResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_ROUTE_PREFIXES = ['/auth', '/registration', '/t', '/student'];
const PUBLIC_ROUTE_EXACT = ['/'];

let refreshInFlight: Promise<void> | null = null;

function isStandalonePwaMode() {
  if (typeof window === 'undefined') return false;

  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return iosStandalone || displayModeStandalone;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isPublicRoute =
    PUBLIC_ROUTE_EXACT.includes(router.pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((r) => router.pathname.startsWith(r));
  const isAuthEntryRoute =
    router.pathname === '/auth' ||
    router.pathname === '/registration' ||
    router.pathname === '/login';
  const isDashboardRoute = router.pathname === '/dashboard' || router.pathname.startsWith('/dashboard/');

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
      router.replace('/auth?view=signin');
    }
  }, [loading, user, isPublicRoute, router]);

  useEffect(() => {
    if (!loading && user && isAuthEntryRoute) {
      router.replace('/dashboard');
    }
  }, [loading, user, isAuthEntryRoute, router]);

  useEffect(() => {
    if (loading || router.pathname !== '/' || !isStandalonePwaMode()) {
      return;
    }

    if (user) {
      router.replace('/dashboard');
      return;
    }

    router.replace('/auth?view=signin');
  }, [loading, user, router]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      user.platformAccessState === 'expired' &&
      !isPublicRoute &&
      !isDashboardRoute
    ) {
      router.replace('/dashboard');
    }
  }, [loading, user, isPublicRoute, isDashboardRoute, router]);

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
      return api<VerifyRegistrationCodeResult>('/auth/register/verify-code', {
        method: 'POST',
        body: data,
      });
    },
    []
  );

  const startPlatformAccessPayment = useCallback(
    async (data?: { planId?: PlanId; billingCycle?: BillingCycle }) => {
      const result = await api<StartPlatformAccessPaymentResult>('/auth/platform-access/start-payment', {
        method: 'POST',
        body: data || {},
      });

      if (result.user) {
        setUser(mapUser(result.user));
      }

      return result;
    },
    []
  );

  const completePlatformAccessPayment = useCallback(
    async (data: { paymentId: string }) => {
      const result = await api<CompletePlatformAccessPaymentResult>('/auth/platform-access/complete', {
        method: 'POST',
        body: data,
      });

      setUser(mapUser(result.user));
      return result;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
    router.push('/auth?view=signin');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        requestRegistrationCode,
        verifyRegistrationCode,
        startPlatformAccessPayment,
        completePlatformAccessPayment,
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
