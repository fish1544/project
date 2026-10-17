// 唯一 ID 生成（模块级，避免在组件渲染路径内调用 impure 函数）
// EXPORTS: makeId, nowTs
export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 当前时间戳（模块级封装，供事件处理器中使用） */
export function nowTs(): number {
  return Date.now();
}
