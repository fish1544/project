// 业务实体类型定义
// EXPORTS: ITask, ICheckIn, ITodoItem, IHabit, IJournalEntry, MOODS, IMood

/** 周计划任务：date 为 null 表示未安排（待办池），否则落在对应日期格子 */
export interface ITask {
  id: string;
  title: string;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:mm，可选
  done: boolean;
  createdAt: number;
}

/** 清单打卡记录 */
export interface ICheckIn {
  date: string; // YYYY-MM-DD
  doneAt: string; // HH:mm
}

/** 清单（打卡）项 */
export interface ITodoItem {
  id: string;
  name: string;
  category: string; // 分组名
  repeat: number[]; // 每周重复日，0=周日 … 6=周六
  checkins: ICheckIn[];
  createdAt: number;
}

/** 习惯 */
export interface IHabit {
  id: string;
  name: string;
  weekDays: number[]; // 每周重复日，0=周日 … 6=周六
  records: Record<string, boolean>; // date -> 是否完成
  createdAt: number;
}

/** 日记 */
export interface IJournalEntry {
  date: string; // YYYY-MM-DD
  text: string;
  mood: string; // mood id，空表示未选
  images?: string[]; // 图片 Data URL（可选，旧数据兼容）
  updatedAt: number;
}

export interface IMood {
  id: string;
  label: string;
}

export const MOODS: IMood[] = [
  { id: 'great', label: '元气满满' },
  { id: 'good', label: '还不错' },
  { id: 'calm', label: '平静' },
  { id: 'tired', label: '有点累' },
  { id: 'down', label: '低落' },
];
