import { format } from 'date-fns';
import { startOfWeek, addDays } from 'date-fns';

export const DATE_FMT = 'yyyy-MM-dd';

/** Date -> YYYY-MM-DD */
export function toDateKey(d: Date): string {
  return format(d, DATE_FMT);
}

/** YYYY-MM-DD -> Date */
export function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 今天的日期键 */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** 以 base 所在周（周一为一周开始）返回 7 天 */
export function getWeekDays(base: Date): Date[] {
  const start = startOfWeek(base, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 周一 ~ 周日 */
export const WEEKDAY_CN = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/** 0=周日…6=周六 -> 中文 */
export function weekdayCn(day: number): string {
  return '日一二三四五六'[day];
}

/** M/d */
export function shortDate(d: Date): string {
  return format(d, 'M/d');
}

/** 当前 HH:mm */
export function nowTime(): string {
  return format(new Date(), 'HH:mm');
}

/** 从日期键取星期（0=周日） */
export function dayOfKey(key: string): number {
  return parseKey(key).getDay();
}
