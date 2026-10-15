// 工作台常量与工具函数
import { Mic, Clock, FileText, BookOpen } from 'lucide-react';
import type { QuickAction } from './types';

export const MOTIVATIONAL_QUOTES = [
  '今天也是了解自己的一天',
  '记录，是为了更好地出发',
  '看见自己，是改变的开始',
  '每一次记录，都在塑造你',
  '慢慢来，你已经在进步了',
];

export const WEEKDAY_MAP = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function getGreeting(hour: number): string {
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}

export function formatShortDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}分`;
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export const quickActions: QuickAction[] = [
  {
    title: '开始语音记录',
    description: '说出此刻的想法',
    path: '/voice',
    gradient: 'from-indigo-500 to-purple-500',
    icon: <Mic className="w-8 h-8 text-white" />,
  },
  {
    title: '开始计时',
    description: '专注当下的任务',
    path: '/timer',
    gradient: 'from-emerald-500 to-teal-500',
    icon: <Clock className="w-8 h-8 text-white" />,
  },
  {
    title: '生成今日复盘',
    description: 'AI 帮你梳理一天',
    path: '/review',
    gradient: 'from-amber-500 to-orange-500',
    icon: <FileText className="w-8 h-8 text-white" />,
  },
  {
    title: '使用说明书',
    description: '了解你自己的模式',
    path: '/manual',
    gradient: 'from-rose-500 to-pink-500',
    icon: <BookOpen className="w-8 h-8 text-white" />,
  },
];
