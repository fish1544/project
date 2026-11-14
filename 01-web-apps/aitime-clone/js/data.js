/* 数据层：状态、持久化、时间计算 */
const DB_KEY = "aitime_clone_v1";

const pad2 = (n) => String(n).padStart(2, "0");

const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const fromKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const todayKey = () => dateKey(new Date());

const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const fmtDur = (min) => {
  min = Math.max(0, Math.round(min));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}小时${m}分钟`;
  if (h) return `${h}小时`;
  return `${m}分钟`;
};

const fmtClock = (min) => {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
};

const uid = () => Math.random().toString(36).slice(2, 9);

const CATS = [
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

const HABIT_ICON_POOL = ["🍅", "🏸", "⚽", "💇", "💄", "👕", "💆", "🧴", "🏀", "🏋️", "✂️", "🎁", "💇‍♀️", "🤸", "🧪", "🚶", "📖", "🍵"];

const HABIT_COLOR_POOL = [
  "#e0a1b4", "#f2dfa0", "#9fc0e0", "#b3b6bd", "#d97b7b", "#6ad9c2", "#7e7a9c", "#b78e9c", "#e0c26a", "#72b7d2",
  "#f49274", "#8ed3c8", "#ab98ee", "#c59ab0", "#f0c9a0", "#8f9bb0", "#8bbeb9", "#c05a5a", "#9bd3a8", "#6f8fc4",
];

const defaultState = () => ({
  theme: "#72b7d2",
  categories: CATS.map((c) => ({ ...c, archived: false })),
  records: [],
  goals: [],
  habits: [],
  schedules: [],
  timer: null,
  viewDate: todayKey(),
  statsTab: "day",
  chartMode: "环形",
  settings: {
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
  },
});

let STATE = defaultState();

function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      STATE = Object.assign(defaultState(), s);
      STATE.settings = Object.assign(defaultState().settings, s.settings || {});
      if (!STATE.categories || !STATE.categories.length) STATE.categories = CATS.map((c) => ({ ...c, archived: false }));
    }
  } catch (e) {
    STATE = defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(STATE));
  } catch (e) {
    /* 忽略写入失败（隐私模式等） */
  }
}

/* ---------- 查询 ---------- */
function catOf(id) {
  return STATE.categories.find((c) => c.id === id) || STATE.categories[0];
}

function recordsOf(dateK) {
  return STATE.records.filter((r) => r.date === dateK);
}

function normRange(r) {
  // 支持跨零点：end < start 视为次日
  let start = r.start;
  let end = r.end;
  if (end <= start) end += 1440;
  return { start, end, len: end - start };
}

function recordedMinutes(dateK) {
  return recordsOf(dateK).reduce((sum, r) => sum + normRange(r).len, 0);
}

function daySummary(dateK) {
  const isToday = dateK === todayKey();
  const isPast = dateK < todayKey();
  const rec = recordedMinutes(dateK);
  const elapsed = isToday ? nowMinutes() : isPast ? 1440 : 0;
  const unrec = Math.max(0, elapsed - rec);
  const remain = isToday ? Math.max(0, 1440 - nowMinutes()) : isPast ? Math.max(0, 1440 - rec) : 0;
  return {
    rec,
    unrec,
    remain,
    elapsed,
    isToday,
    pctUnrec: (unrec / 1440) * 100,
    pctRemain: (remain / 1440) * 100,
    pctRec: (rec / 1440) * 100,
  };
}

function fmtDayLabel(dateK) {
  if (dateK === todayKey()) return "今天";
  const d = fromKey(dateK);
  const t = new Date();
  const y = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
  if (dateKey(y) === dateK) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function shiftDate(dateK, delta) {
  const d = fromKey(dateK);
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

/* 统计区间聚合 */
const WEEK_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function periodRecords(tab, anchorDate) {
  const base = fromKey(anchorDate);
  let from, to;
  if (tab === "day") {
    from = to = anchorDate;
    return { from, to, list: recordsOf(anchorDate), days: 1 };
  }
  if (tab === "week") {
    const day = base.getDay();
    const start = new Date(base);
    start.setDate(base.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    from = dateKey(start);
    to = dateKey(end);
  } else if (tab === "month") {
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    from = dateKey(start);
    to = dateKey(end);
  } else if (tab === "year") {
    from = `${base.getFullYear()}-01-01`;
    to = `${base.getFullYear()}-12-31`;
  } else {
    from = to = anchorDate;
  }
  const days = Math.round((fromKey(to) - fromKey(from)) / 86400000) + 1;
  const list = STATE.records.filter((r) => r.date >= from && r.date <= to);
  return { from, to, list, days };
}

function periodStats(tab, anchorDate) {
  const p = periodRecords(tab, anchorDate);
  const total = p.list.reduce((s, r) => s + normRange(r).len, 0);
  const daySet = new Set(p.list.map((r) => r.date));
  const days = tab === "day" ? (total > 0 ? 1 : 0) : daySet.size;
  const byCat = {};
  p.list.forEach((r) => {
    byCat[r.cat] = (byCat[r.cat] || 0) + normRange(r).len;
  });
  return {
    ...p,
    total,
    days,
    avg: days ? total / days : 0,
    times: p.list.length,
    byCat,
  };
}

window.AITIME = {
  DB_KEY, pad2, dateKey, fromKey, todayKey, nowMinutes, fmtDur, fmtClock, uid,
  CATS, THEMES, HABIT_GROUPS, HABIT_ICON_POOL, HABIT_COLOR_POOL, WEEK_CN,
  defaultState, loadState, saveState, catOf, recordsOf, normRange,
  recordedMinutes, daySummary, fmtDayLabel, shiftDate, periodRecords, periodStats,
  get STATE() { return STATE; },
  set STATE(v) { STATE = v; },
};
