import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextType = {
  // resolved applied theme (never 'system')
  theme: ResolvedTheme;
  // user's preference (may be 'system')
  themeMode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'repeto-theme-v2';

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // ignore
  }
  return 'light';
}

function applyThemeToDom(theme: ResolvedTheme) {
  if (typeof document === 'undefined') {
    return;
  }

  const isDark = theme === 'dark';
  const html = document.documentElement;
  const body = document.body;

  html.setAttribute('data-theme', theme);
  body?.setAttribute('data-theme', theme);

  html.classList.toggle('dark', isDark);
  body?.classList.toggle('dark', isDark);
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => readStoredMode());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(readStoredMode()));

  useEffect(() => {
    applyThemeToDom(resolved);
  }, [resolved]);

  // Listen to OS preference changes when mode is 'system'
  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setResolved(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    setResolved(resolveTheme(mode));
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: resolved,
      themeMode,
      setTheme,
      toggleTheme: () => setTheme(resolved === 'light' ? 'dark' : 'light'),
    }),
    [resolved, themeMode, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return ctx;
}

