/* 基础层 core.js —— 与 DOM 无关的纯函数：时间运算、格式化、转义、记忆化。
   约定：本文件不读写全局状态，不触碰 DOM，任何函数都可单独测试。 */
(function (root) {
  "use strict";

  const MINUTES_PER_DAY = 1440;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  const pad2 = (n) => (n < 10 ? "0" + String(n) : String(n));
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const toInt = (v, fallback = 0) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? n : fallback;
  };

  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  /** 统一出口转义：文本与属性上下文都安全 */
  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

  /** 生成短 id：优先用 crypto，退回时间戳 + 随机串 */
  let idSeed = 0;
  const uid = (prefix = "r") => {
    idSeed += 1;
    const rnd = root.crypto && root.crypto.getRandomValues
      ? root.crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
      : Math.floor(Math.random() * 1e9).toString(36);
    return `${prefix}${Date.now().toString(36)}${idSeed.toString(36)}${rnd.slice(0, 4)}`;
  };

  /* ---------- 日期 ---------- */
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  /** 解析 YYYY-MM-DD 为本地日期；非法返回 null */
  const keyToDate = (key) => {
    if (typeof key !== "string" || !DATE_RE.test(key)) return null;
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  };

  const isValidKey = (key) => keyToDate(key) !== null;
  const todayKey = () => dayKey();
  const minuteOfDay = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
  const weekdayOf = (key) => {
    const date = keyToDate(key);
    return date ? date.getDay() : 0;
  };

  const shiftKey = (key, delta) => {
    const date = keyToDate(key) || new Date();
    date.setDate(date.getDate() + delta);
    return dayKey(date);
  };

  /* ---------- 格式化 ---------- */
  const durationText = (minutes) => {
    const total = Math.max(0, Math.round(toInt(minutes)));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h && m) return `${h}小时${m}分钟`;
    if (h) return `${h}小时`;
    return `${m}分钟`;
  };

  const clockText = (minutes) => {
    const total = ((Math.round(toInt(minutes)) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
  };

  const dayLabel = (key, refKey = todayKey()) => {
    if (!isValidKey(key)) return "今天";
    if (key === refKey) return "今天";
    if (key === shiftKey(refKey, -1)) return "昨天";
    const date = keyToDate(key);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  /**
   * 记录区间规范化：0 ≤ start < 1440，跨零点（end ≤ start）自动补一天。
   * 返回 { start, end, len }，与视图层约定一致。
   */
  const normalizeRange = (record) => {
    const start = clamp(toInt(record && record.start), 0, MINUTES_PER_DAY - 1);
    let end = toInt(record && record.end, start);
    while (end <= start) end += MINUTES_PER_DAY;
    if (end - start > MINUTES_PER_DAY) end = start + MINUTES_PER_DAY;
    return { start, end, len: end - start };
  };

  /* ---------- 缓存 / 节流 ---------- */
  /** 以“修订号”为失效依据的记忆化：数据一变，整批缓存作废 */
  const memoizeByRevision = (compute, limit = 48) => {
    let cachedRev = -1;
    const cache = new Map();
    return (key, rev) => {
      if (cachedRev !== rev) {
        cachedRev = rev;
        cache.clear();
      }
      if (cache.has(key)) return cache.get(key);
      if (cache.size >= limit) cache.clear();
      const value = compute(key);
      cache.set(key, value);
      return value;
    };
  };

  const debounce = (fn, wait = 80) => {
    let handle = null;
    const wrapped = (...args) => {
      if (handle) clearTimeout(handle);
      handle = setTimeout(() => {
        handle = null;
        fn(...args);
      }, wait);
    };
    wrapped.flush = (...args) => {
      if (handle) clearTimeout(handle);
      handle = null;
      fn(...args);
    };
    return wrapped;
  };

  root.TJCore = {
    MINUTES_PER_DAY,
    pad2,
    clamp,
    toInt,
    escapeHtml,
    uid,
    dayKey,
    keyToDate,
    isValidKey,
    todayKey,
    minuteOfDay,
    weekdayOf,
    shiftKey,
    durationText,
    clockText,
    dayLabel,
    normalizeRange,
    memoizeByRevision,
    debounce,
  };
})(window);
