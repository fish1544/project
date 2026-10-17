// 习惯相关的派生计算
// EXPORTS: calcStreak, weekProgress

import { addDays } from 'date-fns';
import { toDateKey } from '@/lib/date';
import type { IHabit } from '@/data/types';

/** 连续打卡天数：从今天往前数，应打卡日必须完成才算连续，非打卡日跳过；
 *  今天尚未打卡不视为中断（从昨天开始数） */
export function calcStreak(habit: IHabit, today: Date): number {
  let streak = 0;
  let d = today;
  const todayDue = habit.weekDays.includes(d.getDay());
  const todayDone = !!habit.records[toDateKey(d)];
  if (todayDue && todayDone) {
    streak += 1;
    d = addDays(d, -1);
  } else if (todayDue) {
    d = addDays(d, -1);
  }
  for (let i = 0; i < 366; i++) {
    const key = toDateKey(d);
    if (habit.weekDays.includes(d.getDay())) {
      if (habit.records[key]) {
        streak += 1;
        d = addDays(d, -1);
      } else {
        break;
      }
    } else {
      d = addDays(d, -1);
    }
  }
  return streak;
}

/** 本周（周一~周日）应打卡天数与已完成天数 */
export function weekProgress(habit: IHabit, weekKeys: string[]): { due: number; done: number } {
  let due = 0;
  let done = 0;
  for (const key of weekKeys) {
    const day = new Date(`${key}T00:00:00`).getDay();
    if (habit.weekDays.includes(day)) {
      due += 1;
      if (habit.records[key]) done += 1;
    }
  }
  return { due, done };
}
