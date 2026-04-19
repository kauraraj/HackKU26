import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@theme_pref';

export const getColors = (isDark: boolean) => ({
  background: isDark ? '#0f172a' : '#ffffff',
  foreground: isDark ? '#f1f5f9' : '#1e293b',
  primary: isDark ? '#38bdf8' : '#3b82f6',
  primaryForeground: isDark ? '#0f172a' : '#ffffff',
  card: isDark ? '#1e293b' : '#ffffff',
  cardBorder: isDark ? '#334155' : '#e2e8f0',
  secondary: isDark ? '#334155' : '#f1f5f9',
  muted: isDark ? '#1e293b' : '#f8fafc',
  mutedForeground: isDark ? '#94a3b8' : '#64748b',
  accentBg: isDark ? '#164e63' : '#dbeafe',
  accentFg: isDark ? '#67e8f9' : '#1e40af',
  border: isDark ? '#334155' : '#e2e8f0',
  inputBg: isDark ? '#1e293b' : '#f8fafc',
  destructive: isDark ? '#f87171' : '#ef4444',
  ok: isDark ? '#34d399' : '#10b981',
  warn: isDark ? '#fbbf24' : '#f59e0b',
});

export type Colors = ReturnType<typeof getColors>;

interface ThemeCtx {
  isDark: boolean;
  toggleTheme: () => void;
  colors: Colors;
}

const ThemeContext = createContext<ThemeCtx>({
  isDark: true,
  toggleTheme: () => {},
  colors: getColors(true),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme !== 'light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val !== null) setIsDark(val === 'dark');
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: getColors(isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
