// 首次使用时的示例数据：仅在 localStorage 无任何数据时写入一次
// EXPORTS: seedDb
import { storeSet, NS } from '@/data/store';
import { todayKey, nowTime, toDateKey } from '@/lib/date';
import { addDays } from 'date-fns';

import type { ITask, ITodoItem, IHabit, IJournalEntry } from '@/data/types';

const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];
const MWF = [1, 3, 5];

function buildSeed() {
  const today = todayKey();
  const d = (offset: number) => toDateKey(addDays(new Date(), offset));
  const t = nowTime();

  const tasks: ITask[] = [
    { id: 'seed-task-1', title: '整理本周 OKR 复盘', date: d(0), time: '10:00', done: false, createdAt: Date.now() },
    { id: 'seed-task-2', title: '健身 40 分钟', date: d(0), time: '19:30', done: false, createdAt: Date.now() - 1 },
    { id: 'seed-task-3', title: '产品评审会', date: d(1), time: '14:00', done: false, createdAt: Date.now() - 2 },
    { id: 'seed-task-4', title: '给爸妈打电话', date: null, time: null, done: false, createdAt: Date.now() - 3 },
    { id: 'seed-task-5', title: '读完《思考，快与慢》30 页', date: null, time: null, done: false, createdAt: Date.now() - 4 },
  ];

  const todos: ITodoItem[] = [
    {
      id: 'seed-todo-1', name: '喝水 8 杯', category: '健康', repeat: ALL_WEEK,
      checkins: [{ date: today, doneAt: t }], createdAt: Date.now() - 10,
    },
    {
      id: 'seed-todo-2', name: '阅读 30 分钟', category: '成长', repeat: ALL_WEEK,
      checkins: [{ date: today, doneAt: t }], createdAt: Date.now() - 11,
    },
    { id: 'seed-todo-3', name: '早起打卡', category: '作息', repeat: ALL_WEEK, checkins: [], createdAt: Date.now() - 12 },
    { id: 'seed-todo-4', name: '背单词 20 个', category: '学习', repeat: ALL_WEEK, checkins: [], createdAt: Date.now() - 13 },
    { id: 'seed-todo-5', name: '记账', category: '生活', repeat: ALL_WEEK, checkins: [], createdAt: Date.now() - 14 },
    { id: 'seed-todo-6', name: '午后散步 15 分钟', category: '健康', repeat: MWF, checkins: [], createdAt: Date.now() - 15 },
  ];

  const habits: IHabit[] = [
    { id: 'seed-habit-1', name: '晨间拉伸 10 分钟', weekDays: ALL_WEEK, records: { [d(0)]: false, [d(-1)]: true, [d(-2)]: true }, createdAt: Date.now() - 20 },
    { id: 'seed-habit-2', name: '23 点前睡觉', weekDays: ALL_WEEK, records: { [d(0)]: false, [d(-1)]: true }, createdAt: Date.now() - 21 },
    { id: 'seed-habit-3', name: '跑步 5 公里', weekDays: MWF, records: { [d(-2)]: true }, createdAt: Date.now() - 22 },
  ];

  const journal: Record<string, IJournalEntry> = {
    [today]: {
      date: today,
      text: '新的一页开始了。今天把本周的目标拆成可执行的小任务，从清单打卡开始养成规律。',
      mood: 'good',
      updatedAt: Date.now(),
    },
  };

  return { tasks, todos, habits, journal };
}

/** 应用启动时调用一次：无数据则写入示例数据 */
export function initDb(): void {
  try {
    if (localStorage.getItem(`${NS}:seeded`)) return;
    const seed = buildSeed();
    storeSet('tasks', seed.tasks);
    storeSet('todos', seed.todos);
    storeSet('habits', seed.habits);
    storeSet('journal', seed.journal);
    localStorage.setItem(`${NS}:seeded`, '1');
  } catch {
    /* 隐私模式静默降级 */
  }
}
