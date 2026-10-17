import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeId = 'forest' | 'sunset' | 'dusk' | 'midnight' | 'ink' | 'ocean' | 'sakura' | 'mint' | 'ocean-deep' | 'cocoa' | 'lilac' | 'graphite';

interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
  colors: [string, string, string];
}

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeInfo[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = 'liangli-theme';

const themes: ThemeInfo[] = [
  {
    id: 'forest',
    name: '林间纸面',
    description: '奶油米白 + 森林绿，宁静成长',
    colors: ['#2D6A4F', '#F7F5EF', '#52B788'],
  },
  {
    id: 'sunset',
    name: '暖阳橘',
    description: '暖橘色 + 奶油暖白，温暖活力',
    colors: ['hsl(24, 85%, 55%)', 'hsl(36, 45%, 96%)', 'hsl(42, 85%, 60%)'],
  },
  {
    id: 'dusk',
    name: '暮色紫',
    description: '紫调 + 灰紫底，沉静高级',
    colors: ['hsl(265, 40%, 45%)', 'hsl(270, 25%, 96%)', 'hsl(270, 60%, 75%)'],
  },
  {
    id: 'midnight',
    name: '夜森林',
    description: '深绿深色系，暗雅沉浸',
    colors: ['hsl(150, 50%, 55%)', 'hsl(155, 30%, 12%)', 'hsl(148, 20%, 85%)'],
  },
  {
    id: 'ink',
    name: '纸墨',
    description: '黑白极简，克制专注',
    colors: ['hsl(0, 0%, 12%)', 'hsl(40, 15%, 97%)', 'hsl(0, 0%, 45%)'],
  },
  {
    id: 'ocean',
    name: '海洋蓝',
    description: '清爽蓝色系，清新冷静',
    colors: ['hsl(210, 70%, 45%)', 'hsl(210, 40%, 96%)', 'hsl(200, 60%, 70%)'],
  },
  {
    id: 'sakura',
    name: '樱花粉',
    description: '柔和粉色系，柔美温柔',
    colors: ['hsl(340, 55%, 55%)', 'hsl(340, 40%, 97%)', 'hsl(340, 65%, 75%)'],
  },
  {
    id: 'mint',
    name: '薄荷绿',
    description: '清新薄荷绿，清爽活力',
    colors: ['hsl(165, 55%, 38%)', 'hsl(160, 35%, 96%)', 'hsl(160, 50%, 70%)'],
  },
  {
    id: 'ocean-deep',
    name: '深海夜',
    description: '深蓝暗色主题，沉静深邃',
    colors: ['hsl(200, 70%, 60%)', 'hsl(220, 40%, 10%)', 'hsl(210, 50%, 75%)'],
  },
  {
    id: 'cocoa',
    name: '奶茶棕',
    description: '温暖棕褐色系，温暖复古',
    colors: ['hsl(25, 50%, 38%)', 'hsl(30, 35%, 94%)', 'hsl(30, 45%, 65%)'],
  },
  {
    id: 'lilac',
    name: '星光紫',
    description: '梦幻紫色系，梦幻浪漫',
    colors: ['hsl(255, 50%, 50%)', 'hsl(255, 45%, 97%)', 'hsl(260, 60%, 75%)'],
  },
  {
    id: 'graphite',
    name: '石墨灰',
    description: '深灰黑色，极简高级',
    colors: ['hsl(220, 8%, 85%)', 'hsl(220, 10%, 12%)', 'hsl(220, 8%, 55%)'],
  },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('forest');

  useEffect(() => {
    const stored: string | null = localStorage.getItem(THEME_KEY);
    if (stored && themes.some((t: ThemeInfo) => t.id === stored)) {
      setThemeState(stored as ThemeId);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, themes }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
