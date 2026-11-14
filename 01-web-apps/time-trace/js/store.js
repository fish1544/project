/* 状态层 store.js —— 唯一的数据源：常量、校验、持久化、派生查询、变更动作。
   设计要点：
   1. 一切写入必须走 action，写入后 revision+1，订阅者与记忆化缓存同步失效；
   2. 从 localStorage 读入的数据一律先规范化，脏数据不会进入运行态；
   3. 持久化走防抖 + 页面隐藏时强制刷盘，写入失败（隐私模式/配额）不崩。 */
(function (root) {
  "use strict";

  const C = root.TJCore;
  const SCHEMA_VERSION = 2;
  const STORAGE_KEY = "time-trace:v2";
  const DEFAULT_THEME = "#72b7d2";

  /* ---------- 常量 ---------- */
  const CATEGORIES = [
    { id: "sleep", name: "睡觉", color: "#72b7d2" },
    { id: "work", name: "工作", color: "#f29374" },
    { id: "study", name: "学习", color: "#f7d77c" },
    { id: "eat", name: "吃饭", color: "#69dac2" },
    { id: "sport", name: "运动", color: "#ec7c88" },
    { id: "rest", name: "休息", color: "#83aadd" },
    { id: "other", name: "其他", color: "#c3c3c4" },
  ];

  const THEMES = [
    "#22afd2", "#eba874", "#e2606e", "#5ec383",
    "#ab98ee", "#808080", "#e0a1b4", "#725148",
    "#72b7d2", "#f49274", "#e86a98", "#869ee8",
    "#829dbb", "#8bbeb9", "#b78e9c", "#7e7a9c",
  ];

  const HABIT_GROUPS = [
    {
      name: "生活",
      items: [
        { n: "醒来喝水", bg: "#f7d77c", e: "💧" },
        { n: "吃早餐", bg: "#f0a45e", e: "🍳" },
        { n: "睡前刷牙", bg: "#8fb3e0", e: "🪥" },
        { n: "吃药", bg: "#f29374", e: "💊" },
        { n: "跑步", bg: "#8bd07a", e: "🏃" },
        { n: "早睡", bg: "#9b8eee", e: "🌙" },
      ],
    },
    {
      name: "学习",
      items: [
        { n: "阅读", bg: "#c9a87c", e: "📚" },
        { n: "背单词", bg: "#ec7c88", e: "📖" },
        { n: "练习新技能", bg: "#8f7fe0", e: "📊" },
        { n: "休息一下", bg: "#f7d77c", e: "💬" },
        { n: "转眼运动", bg: "#69dac2", e: "👀" },
        { n: "弹乐器", bg: "#d38ac0", e: "🎸" },
      ],
    },
    {
      name: "工作",
      items: [
        { n: "站立", bg: "#5aa9e0", e: "🧍" },
        { n: "清查邮件", bg: "#5b6a72", e: "🖥" },
        { n: "休息一下", bg: "#8bd07a", e: "☕" },
        { n: "打卡", bg: "#f0a45e", e: "⏰" },
        { n: "写待办事项", bg: "#8f8fe0", e: "✏️" },
        { n: "使用番茄钟", bg: "#e2606e", e: "🍅" },
      ],
    },
  ];

  const HABIT_ICONS = ["🍅", "🏸", "⚽", "💇", "💄", "👕", "💆", "🧴", "🏀", "🏋️", "✂️", "🎁", "💇‍♀️", "🤸", "🧪", "🚶", "📖", "🍵"];

  const HABIT_COLORS = [
    "#e0a1b4", "#f2dfa0", "#9fc0e0", "#b3b6bd", "#d97b7b", "#6ad9c2", "#7e7a9c", "#b78e9c", "#e0c26a", "#72b7d2",
    "#f49274", "#8ed3c8", "#ab98ee", "#c59ab0", "#f0c9a0", "#8f9bb0", "#8bbeb9", "#c05a5a", "#9bd3a8", "#6f8fc4",
  ];

  const WEEK_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const TAB_NAMES = { home: "时间", goals: "目标", schedule: "日程", habits: "习惯", mine: "我的" };

  const DEFAULT_SETTINGS = {
    showBottomButtons: true,
    chartList: true,
    chartGraph: true,
    chartSelectedRest: false,
    chartReverse: false,
    chartHideUnrec: false,
    autoBackup: true,
    modules: ["时间", "目标", "日程", "习惯"],
    hiddenModules: ["待办", "计划", "成长", "奖赏"],
    earlyCheck: false,
  };

  const defaultState = () => ({
    schema: SCHEMA_VERSION,
    theme: DEFAULT_THEME,
    categories: CATEGORIES.map((c) => ({ ...c, archived: false })),
    records: [],
    goals: [],
    habits: [],
    schedules: [],
    timer: null,
    viewDate: C.todayKey(),
    statsTab: "day",
    chartMode: "环形",
    customFrom: null,
    customTo: null,
    settings: { ...DEFAULT_SETTINGS, modules: [...DEFAULT_SETTINGS.modules], hiddenModules: [...DEFAULT_SETTINGS.hiddenModules] },
  });

  /* ---------- 运行态 ---------- */
  let state = defaultState();
  let revision = 0;
  const subscribers = new Set();

  const bump = () => {
    revision += 1;
    subscribers.forEach((fn) => {
      try {
        fn(revision);
      } catch (err) {
        /* 单个订阅者异常不应影响其它订阅者 */
      }
    });
  };

  const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  /* ---------- 规范化 ---------- */
  const asString = (v, max = 200) => (typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max));
  const asBool = (v, fallback) => (typeof v === "boolean" ? v : fallback);
  const asColor = (v, fallback) => {
    const s = asString(v, 16);
    return /^#[0-9a-f]{3,8}$/i.test(s) ? s.toLowerCase() : fallback;
  };

  const normalizeRecord = (raw, validCatIds, seenIds) => {
    if (!raw || typeof raw !== "object") return null;
    const date = C.isValidKey(raw.date) ? raw.date : null;
    if (!date) return null;
    const range = C.normalizeRange(raw);
    let id = asString(raw.id, 40);
    if (!id || seenIds.has(id)) id = C.uid("r");
    seenIds.add(id);
    return {
      id,
      date,
      cat: validCatIds.has(raw.cat) ? raw.cat : "other",
      start: range.start,
      end: range.end,
      note: asString(raw.note),
      important: asBool(raw.important, false),
    };
  };

  /** 把任意来源的对象洗成可信状态；字段缺失走默认值，类型不符直接纠正 */
  function normalize(raw) {
    const base = defaultState();
    if (!raw || typeof raw !== "object") return base;

    const theme = asColor(raw.theme, base.theme);

    /* 分类：保证 7 个基础分类存在，且 id 唯一 */
    const seenCatIds = new Set();
    const categories = [];
    (Array.isArray(raw.categories) ? raw.categories : []).forEach((c) => {
      if (!c || typeof c !== "object") return;
      const id = asString(c.id, 30) || C.uid("c");
      if (seenCatIds.has(id)) return;
      seenCatIds.add(id);
      categories.push({
        id,
        name: asString(c.name, 30) || "未命名",
        color: asColor(c.color, DEFAULT_THEME),
        archived: asBool(c.archived, false),
      });
    });
    CATEGORIES.forEach((c) => {
      if (!seenCatIds.has(c.id)) {
        seenCatIds.add(c.id);
        categories.unshift({ ...c, archived: false });
      }
    });
    if (!categories.length) base.categories.forEach((c) => categories.push(c));

    const validCatIds = new Set(categories.map((c) => c.id));
    const seenIds = new Set();
    const records = (Array.isArray(raw.records) ? raw.records : [])
      .map((r) => normalizeRecord(r, validCatIds, seenIds))
      .filter(Boolean)
      .sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1));

    const goals = (Array.isArray(raw.goals) ? raw.goals : [])
      .filter((g) => g && typeof g === "object")
      .map((g) => ({
        id: asString(g.id, 40) || C.uid("g"),
        cat: validCatIds.has(g.cat) ? g.cat : "other",
        name: asString(g.name, 30) || "目标",
        cycleText: asString(g.cycleText, 80),
        todayText: asString(g.todayText, 40) || "今日0分钟",
        progress: C.clamp(C.toInt(g.progress), 0, 100),
      }));

    const habits = (Array.isArray(raw.habits) ? raw.habits : [])
      .filter((h) => h && typeof h === "object")
      .map((h) => ({
        id: asString(h.id, 40) || C.uid("h"),
        name: asString(h.name, 30) || "习惯",
        emoji: asString(h.emoji, 8) || "🍅",
        color: asColor(h.color, "#e0a1b4"),
        days: (Array.isArray(h.days) ? h.days : []).filter((d) => WEEK_CN.includes(d)),
        word: asString(h.word, 60),
        checks: h.checks && typeof h.checks === "object" ? h.checks : {},
      }));

    const timerStartAt = Number(raw.timer && raw.timer.startAt);
    const timer = Number.isFinite(timerStartAt) && timerStartAt > 0
      ? { cat: validCatIds.has(raw.timer.cat) ? raw.timer.cat : "work", startAt: timerStartAt }
      : null;

    const settings = { ...DEFAULT_SETTINGS };
    const incoming = raw.settings && typeof raw.settings === "object" ? raw.settings : {};
    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      const fallback = DEFAULT_SETTINGS[key];
      if (typeof fallback === "boolean") settings[key] = asBool(incoming[key], fallback);
      else if (Array.isArray(fallback)) settings[key] = Array.isArray(incoming[key]) ? incoming[key].filter((v) => typeof v === "string").slice(0, 30) : [...fallback];
    });

    return {
      ...base,
      theme,
      categories,
      records,
      goals,
      habits,
      schedules: Array.isArray(raw.schedules) ? raw.schedules.filter((s) => s && typeof s === "object").slice(0, 200) : [],
      timer,
      viewDate: C.isValidKey(raw.viewDate) ? raw.viewDate : base.viewDate,
      statsTab: ["year", "month", "week", "day", "custom"].includes(raw.statsTab) ? raw.statsTab : "day",
      chartMode: ["环形", "门形", "双环"].includes(raw.chartMode) ? raw.chartMode : "环形",
      customFrom: C.isValidKey(raw.customFrom) ? raw.customFrom : null,
      customTo: C.isValidKey(raw.customTo) ? raw.customTo : null,
      settings,
    };
  }

  /* ---------- 持久化 ---------- */
  let persistenceAvailable = true;
  const warnOnce = () => {
    if (persistenceAvailable) {
      persistenceAvailable = false;
      bump();
    }
  };

  const writeNow = () => {
    try {
      const payload = { schema: SCHEMA_VERSION, savedAt: Date.now(), data: state };
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      if (!persistenceAvailable) {
        persistenceAvailable = true;
        bump();
      }
    } catch (err) {
      warnOnce();
    }
  };

  const writeLater = C.debounce(writeNow, 120);

  const load = () => {
    try {
      const raw = root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const payload = parsed && typeof parsed === "object" && parsed.data ? parsed.data : parsed;
      state = normalize(payload);
    } catch (err) {
      state = defaultState();
    }
    bump();
    return true;
  };

  const reset = () => {
    try {
      root.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* 隐私模式下可能失败，忽略 */
    }
    state = defaultState();
    bump();
    writeNow();
  };

  /* 页面隐藏 / 关闭时强制落盘，避免防抖窗口内丢数据 */
  root.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") writeLater.flush();
  });
  root.addEventListener("pagehide", () => writeLater.flush());

  /* ---------- 派生查询（按 revision 记忆化） ---------- */
  let indexRev = -1;
  let recordsByDate = new Map();
  const dateIndex = () => {
    if (indexRev !== revision) {
      recordsByDate = new Map();
      state.records.forEach((r) => {
        const bucket = recordsByDate.get(r.date);
        if (bucket) bucket.push(r);
        else recordsByDate.set(r.date, [r]);
      });
      indexRev = revision;
    }
    return recordsByDate;
  };

  const EMPTY = Object.freeze([]);
  const recordsOf = (key) => dateIndex().get(key) || EMPTY;

  const catOf = (id) => state.categories.find((c) => c.id === id) || state.categories[0] || CATEGORIES[0];

  const recordedMinutes = (key) => recordsOf(key).reduce((sum, r) => sum + C.normalizeRange(r).len, 0);

  const summaryCache = C.memoizeByRevision((stamp) => {
    /* stamp = "YYYY-MM-DD|分钟"：分钟只进缓存键，不参与计算 */
    const key = stamp.slice(0, 10);
    const isToday = key === C.todayKey();
    const isPast = key < C.todayKey();
    const rec = recordedMinutes(key);
    const elapsed = isToday ? C.minuteOfDay() : isPast ? C.MINUTES_PER_DAY : 0;
    const unrec = Math.max(0, elapsed - rec);
    const remain = isToday ? Math.max(0, C.MINUTES_PER_DAY - C.minuteOfDay()) : isPast ? Math.max(0, C.MINUTES_PER_DAY - rec) : 0;
    return {
      rec,
      unrec,
      remain,
      elapsed,
      isToday,
      pctRec: (rec / C.MINUTES_PER_DAY) * 100,
      pctUnrec: (unrec / C.MINUTES_PER_DAY) * 100,
      pctRemain: (remain / C.MINUTES_PER_DAY) * 100,
    };
  }, 16);

  /** 今天的数据每分钟都会变：缓存键带上当前分钟，避免拿到过期快照 */
  const daySummary = (key) => summaryCache(`${key}|${key === C.todayKey() ? C.minuteOfDay() : "-"}`, revision);

  const periodRecords = (tab, anchorKey) => {
    const anchor = C.keyToDate(anchorKey) || new Date();
    if (tab === "day") return { from: anchorKey, to: anchorKey, list: recordsOf(anchorKey).slice(), days: 1 };

    let fromDate;
    let toDate;
    if (tab === "week") {
      fromDate = new Date(anchor);
      fromDate.setDate(anchor.getDate() - anchor.getDay());
      toDate = new Date(fromDate);
      toDate.setDate(fromDate.getDate() + 6);
    } else if (tab === "month") {
      fromDate = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      toDate = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    } else if (tab === "year") {
      fromDate = new Date(anchor.getFullYear(), 0, 1);
      toDate = new Date(anchor.getFullYear(), 11, 31);
    } else {
      return { from: anchorKey, to: anchorKey, list: recordsOf(anchorKey).slice(), days: 1 };
    }

    const from = C.dayKey(fromDate);
    const to = C.dayKey(toDate);
    const list = state.records.filter((r) => r.date >= from && r.date <= to);
    const days = Math.round((C.keyToDate(to) - C.keyToDate(from)) / 86400000) + 1;
    return { from, to, list, days };
  };

  const statsCache = C.memoizeByRevision((payload) => {
    const [tab, anchor] = payload.split("|");
    const period = periodRecords(tab, anchor);
    const total = period.list.reduce((sum, r) => sum + C.normalizeRange(r).len, 0);
    const daySet = new Set(period.list.map((r) => r.date));
    const days = tab === "day" ? (total > 0 ? 1 : 0) : daySet.size;
    const byCat = {};
    period.list.forEach((r) => {
      byCat[r.cat] = (byCat[r.cat] || 0) + C.normalizeRange(r).len;
    });
    return { ...period, total, days, avg: days ? total / days : 0, times: period.list.length, byCat };
  }, 24);

  const periodStats = (tab, anchorKey) => statsCache(`${tab}|${anchorKey}`, revision);

  /* ---------- 变更动作 ---------- */
  const commit = () => {
    bump();
    writeLater();
  };

  const store = {
    /* 视图 / 设置 */
    setViewDate(key) {
      if (!C.isValidKey(key)) return false;
      state.viewDate = key;
      commit();
      return true;
    },
    shiftView(delta) {
      state.viewDate = C.shiftKey(state.viewDate, delta);
      commit();
    },
    setStatsTab(tab) {
      state.statsTab = tab;
      commit();
    },
    setChartMode(mode) {
      state.chartMode = mode;
      commit();
    },
    setTheme(color) {
      state.theme = asColor(color, DEFAULT_THEME);
      commit();
    },
    setSetting(key, value) {
      if (!(key in DEFAULT_SETTINGS)) return;
      state.settings[key] = value;
      commit();
    },
    toggleSetting(key) {
      if (typeof state.settings[key] !== "boolean") return;
      state.settings[key] = !state.settings[key];
      commit();
    },

    /* 记录 */
    addRecord({ date, cat, start, end, note, important = false }) {
      const record = normalizeRecord({ date, cat, start, end, note, important, id: C.uid("r") }, new Set(state.categories.map((c) => c.id)), new Set());
      if (!record) return null;
      state.records.push(record);
      state.records.sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1));
      commit();
      return record;
    },
    updateRecord(id, patch) {
      const index = state.records.findIndex((r) => r.id === id);
      if (index < 0) return false;
      const merged = { ...state.records[index], ...patch, id };
      const clean = normalizeRecord(merged, new Set(state.categories.map((c) => c.id)), new Set());
      if (!clean) return false;
      state.records[index] = clean;
      commit();
      return true;
    },

    /* 目标 / 习惯 */
    addGoal(goal) {
      const next = {
        id: C.uid("g"),
        cat: goal.cat,
        name: asString(goal.name, 30) || catOf(goal.cat).name,
        cycleText: asString(goal.cycleText, 80),
        todayText: "今日0分钟",
        progress: 0,
      };
      state.goals.push(next);
      commit();
      return next;
    },
    addHabit(habit) {
      const next = {
        id: C.uid("h"),
        name: asString(habit.name, 30) || "习惯",
        emoji: asString(habit.emoji, 8) || "🍅",
        color: asColor(habit.color, "#e0a1b4"),
        days: (habit.days || []).filter((d) => WEEK_CN.includes(d)),
        word: asString(habit.word, 60),
        checks: {},
      };
      state.habits.push(next);
      commit();
      return next;
    },
    addCategory({ name, color }) {
      const clean = asString(name, 30).trim();
      if (!clean) return null;
      const next = { id: C.uid("c"), name: clean, color: asColor(color, THEMES[state.categories.length % THEMES.length]), archived: false };
      state.categories.push(next);
      commit();
      return next;
    },

    /* 计时器 */
    startTimer(cat) {
      state.timer = { cat: cat || "work", startAt: Date.now() };
      commit();
    },
    clearTimer() {
      state.timer = null;
      commit();
    },
    elapsedMinutes() {
      if (!state.timer) return 0;
      return Math.max(0, Math.floor((Date.now() - state.timer.startAt) / 60000));
    },
    timerStartClock() {
      if (!state.timer) return "00:00";
      const d = new Date(state.timer.startAt);
      return C.clockText(d.getHours() * 60 + d.getMinutes());
    },

    /* 自定义区间 */
    setCustomRange(from, to) {
      state.customFrom = C.isValidKey(from) ? from : null;
      state.customTo = C.isValidKey(to) ? to : null;
      commit();
    },

    /* 生命周期 */
    load,
    reset,
    flush: writeNow,
    subscribe,
    get revision() {
      return revision;
    },
    get persistenceAvailable() {
      return persistenceAvailable;
    },
    get state() {
      return state;
    },
  };

  /* ---------- 对外门面：视图层只需要读，写入统一走 store ---------- */
  root.TJ = {
    SCHEMA_VERSION,
    STORAGE_KEY,
    DEFAULT_THEME,
    CATS: CATEGORIES,
    THEMES,
    HABIT_GROUPS,
    HABIT_ICON_POOL: HABIT_ICONS,
    HABIT_COLOR_POOL: HABIT_COLORS,
    WEEK_CN,
    TAB_NAMES,
    /* 纯函数直通（历史视图层沿用这些名字） */
    pad2: C.pad2,
    dateKey: C.dayKey,
    fromKey: C.keyToDate,
    todayKey: C.todayKey,
    nowMinutes: C.minuteOfDay,
    fmtDur: C.durationText,
    fmtClock: C.clockText,
    fmtDayLabel: C.dayLabel,
    shiftDate: C.shiftKey,
    normRange: C.normalizeRange,
    uid: C.uid,
    escapeHtml: C.escapeHtml,
    defaultState,
    /* 只读状态与选择器 */
    catOf,
    recordsOf,
    recordedMinutes,
    daySummary,
    periodRecords,
    periodStats,
    store,
    get STATE() {
      return state;
    },
    get revision() {
      return revision;
    },
  };
})(window);
