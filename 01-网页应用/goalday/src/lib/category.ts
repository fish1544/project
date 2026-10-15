// 清单分类的视觉元数据：颜色与图标
// EXPORTS: getCategoryMeta
import {
  BookOpen,
  Briefcase,
  CircleCheck,
  Dumbbell,
  HeartPulse,
  PiggyBank,
  Sparkles,
  Sun,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ICategoryMeta {
  color: string;
  icon: LucideIcon;
}

/** 与主题 chart-1..5 完全一致的色板（按分组顺序循环使用） */
const CATEGORY_COLORS = [
  'hsl(151 25% 38%)',
  'hsl(33 52% 56%)',
  'hsl(64 32% 52%)',
  'hsl(10 48% 58%)',
  'hsl(205 22% 58%)',
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  健康: HeartPulse,
  学习: BookOpen,
  工作: Briefcase,
  生活: Wallet,
  理财: PiggyBank,
  // 兼容旧分类
  成长: BookOpen,
  作息: Sun,
  运动: Dumbbell,
  冥想: Sparkles,
  学习成长: BookOpen,
};

export function getCategoryMeta(category: string, index: number): ICategoryMeta {
  const icon = CATEGORY_ICONS[category] ?? CircleCheck;
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  return { color, icon };
}
