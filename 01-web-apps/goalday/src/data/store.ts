// 本地存储封装：带项目命名空间，读写均 try/catch 兜底
// EXPORTS: NS, storeGet, storeSet, initDb, useStored

import { useState } from 'react';
import type { ITask, ITodoItem, IHabit, IJournalEntry } from '@/data/types';

export const NS = 'goalday';

export const STORE_KEYS = {
  tasks: 'tasks',
  todos: 'todos',
  habits: 'habits',
  journal: 'journal',
} as const;

export type StoreShape = {
  tasks: ITask[];
  todos: ITodoItem[];
  habits: IHabit[];
  journal: Record<string, IJournalEntry>;
};

export function storeGet<K extends keyof StoreShape>(key: K): StoreShape[K] | null {
  try {
    const raw = localStorage.getItem(`${NS}:${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as StoreShape[K];
  } catch {
    return null;
  }
}

export function storeSet<K extends keyof StoreShape>(key: K, value: StoreShape[K]): void {
  try {
    localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
  } catch {
    /* 隐私模式静默降级 */
  }
}

/** 通用本地状态 hook：首次从 localStorage 读取，写入时同步持久化 */
export function useStored<K extends keyof StoreShape>(key: K, fallback: StoreShape[K]) {
  const [state, setState] = useState<StoreShape[K]>(() => storeGet(key) ?? fallback);
  const set = (value: StoreShape[K] | ((prev: StoreShape[K]) => StoreShape[K])) => {
    setState((prev) => {
      const next = typeof value === 'function' ? (value as (p: StoreShape[K]) => StoreShape[K])(prev) : value;
      storeSet(key, next);
      return next;
    });
  };
  return [state, set] as const;
}
