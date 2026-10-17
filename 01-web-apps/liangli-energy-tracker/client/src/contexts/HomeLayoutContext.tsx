import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type HomeLayoutId =
  | 'forest-dawn'
  | 'warm-sunset'
  | 'ocean-breeze'
  | 'sakura-dream'
  | 'starry-night'
  | 'minimal-ink';

export interface HomeLayoutInfo {
  id: HomeLayoutId;
  name: string;
  description: string;
  cover: {
    from: string;
    via: string;
    to: string;
  };
  accentIcon: string;
  layoutStyle: 'classic' | 'card' | 'float' | 'minimal';
}

interface HomeLayoutContextValue {
  layout: HomeLayoutId;
  setLayout: (layout: HomeLayoutId) => void;
  layouts: HomeLayoutInfo[];
  currentLayout: HomeLayoutInfo;
}

const HomeLayoutContext = createContext<HomeLayoutContextValue | undefined>(undefined);

const LAYOUT_KEY = 'liangli-home-layout';

export const homeLayouts: HomeLayoutInfo[] = [
  {
    id: 'forest-dawn',
    name: '林间晨光',
    description: '柔和的绿色渐变 + 光斑装饰，宁静自然',
    cover: {
      from: 'hsl(152, 52%, 94%)',
      via: 'hsl(153, 40%, 92%)',
      to: 'hsl(160, 45%, 88%)',
    },
    accentIcon: 'leaf',
    layoutStyle: 'classic',
  },
  {
    id: 'warm-sunset',
    name: '晚霞余晖',
    description: '暖橘渐变 + 金色装饰，温暖活力',
    cover: {
      from: 'hsl(36, 80%, 92%)',
      via: 'hsl(24, 75%, 88%)',
      to: 'hsl(12, 70%, 82%)',
    },
    accentIcon: 'sun',
    layoutStyle: 'classic',
  },
  {
    id: 'ocean-breeze',
    name: '海风轻拂',
    description: '清爽蓝色渐变 + 波纹装饰，冷静专注',
    cover: {
      from: 'hsl(200, 60%, 92%)',
      via: 'hsl(210, 55%, 88%)',
      to: 'hsl(220, 50%, 84%)',
    },
    accentIcon: 'wave',
    layoutStyle: 'card',
  },
  {
    id: 'sakura-dream',
    name: '樱花梦境',
    description: '柔粉渐变 + 花瓣装饰，柔美浪漫',
    cover: {
      from: 'hsl(340, 50%, 94%)',
      via: 'hsl(345, 55%, 90%)',
      to: 'hsl(350, 50%, 86%)',
    },
    accentIcon: 'flower',
    layoutStyle: 'float',
  },
  {
    id: 'starry-night',
    name: '星辰夜语',
    description: '深紫渐变 + 星光装饰，沉静梦幻',
    cover: {
      from: 'hsl(255, 35%, 25%)',
      via: 'hsl(265, 40%, 20%)',
      to: 'hsl(270, 45%, 15%)',
    },
    accentIcon: 'star',
    layoutStyle: 'card',
  },
  {
    id: 'minimal-ink',
    name: '素墨白笺',
    description: '极简灰白 + 墨线装饰，克制专注',
    cover: {
      from: 'hsl(40, 10%, 94%)',
      via: 'hsl(40, 8%, 90%)',
      to: 'hsl(40, 5%, 85%)',
    },
    accentIcon: 'feather',
    layoutStyle: 'minimal',
  },
];

export function HomeLayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayoutState] = useState<HomeLayoutId>('forest-dawn');

  useEffect(() => {
    const stored: string | null = localStorage.getItem(LAYOUT_KEY);
    if (stored && homeLayouts.some((l: HomeLayoutInfo) => l.id === stored)) {
      setLayoutState(stored as HomeLayoutId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, layout);
  }, [layout]);

  const setLayout = (newLayout: HomeLayoutId) => {
    setLayoutState(newLayout);
  };

  const currentLayout = homeLayouts.find((l: HomeLayoutInfo) => l.id === layout) ?? homeLayouts[0];

  const value = useMemo<HomeLayoutContextValue>(
    () => ({ layout, setLayout, layouts: homeLayouts, currentLayout }),
    [layout, currentLayout],
  );

  return <HomeLayoutContext.Provider value={value}>{children}</HomeLayoutContext.Provider>;
}

export function useHomeLayout(): HomeLayoutContextValue {
  const ctx = useContext(HomeLayoutContext);
  if (!ctx) {
    throw new Error('useHomeLayout must be used within HomeLayoutProvider');
  }
  return ctx;
}
