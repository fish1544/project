// ============================================================
// 自律工具箱 - 数据模型
// 整合自律舱核心功能：习惯/专注/农场/睡眠/日记/考试
// ============================================================

var tbData = {
  // ===== 习惯打卡 =====
  habits: [
    { id: 'h1', name: '早起7:00', icon: '', done: {} },
    { id: 'h2', name: '算法刷题', icon: '', done: {} },
    { id: 'h3', name: '阅读30min', icon: '', done: {} },
    { id: 'h4', name: '运动30min', icon: '', done: {} },
    { id: 'h5', name: '日复盘', icon: '', done: {} },
    { id: 'h6', name: '23:30前睡', icon: '', done: {} }
  ],

  // ===== 待办任务 =====
  todos: [],

  // ===== 专注计时器 =====
  focusSessions: [],
  focusState: { running: false, startTime: 0, taskName: '', timer: null },

  // ===== 自律农场 =====
  farm: {
    plots: [
      { id: 'p1', crop: null, plantedAt: null, wateredAt: [], matureAt: null, status: 'empty' },
      { id: 'p2', crop: null, plantedAt: null, wateredAt: [], matureAt: null, status: 'empty' },
      { id: 'p3', crop: null, plantedAt: null, wateredAt: [], matureAt: null, status: 'empty' },
      { id: 'p4', crop: null, plantedAt: null, wateredAt: [], matureAt: null, status: 'empty' }
    ],
    waterCount: 0,
    harvestCount: 0
  },

  // 农作物配置
  crops: {
    '1h':  { name: '速成作物', emoji: '', baseTime: 60,   wateredTime: 44,   maxWater: 4, waterBonuses: [5,5,4,2] },
    '4h':  { name: '常规作物', emoji: '', baseTime: 240,  wateredTime: 176,  maxWater: 4, waterBonuses: [20,20,16,8] },
    '8h':  { name: '深度作物', emoji: '', baseTime: 480,  wateredTime: 352,  maxWater: 4, waterBonuses: [40,40,32,16] },
    '24h': { name: '长效作物', emoji: '', baseTime: 1440, wateredTime: 1056, maxWater: 4, waterBonuses: [120,120,96,48] }
  },

  // ===== R90 睡眠追踪 =====
  sleepRecords: [],
  pendingSleep: null,

  // ===== 心情日记 =====
  diary: [],
  currentMood: '',

  // ===== 考试倒数 =====
  exams: [
    { id: 'e1', name: '数据结构期末', date: '2027-01-05', remindDays: 14 },
    { id: 'e2', name: 'Spark大数据处理', date: '2027-01-08', remindDays: 14 },
    { id: 'e3', name: '微服务技术期末', date: '2027-01-10', remindDays: 14 }
  ],

  // ===== 学习时间轴 =====
  studyTimeline: [],
  studyCategories: ['学习', '专注', '编码', '阅读']
};

// ===== 主题配置 =====
var tbThemes = [
  { id: 'default',  name: '鼠尾草雾', desc: 'Sage Mist',  preview: 'linear-gradient(135deg,#5d9b6e,#7fb88e)' },
  { id: 'forest',   name: '薄荷清风', desc: 'Forest',     preview: 'linear-gradient(135deg,#4ea96e,#6dc088)' },
  { id: 'ocean',    name: '晴空浅蓝', desc: 'Ocean',      preview: 'linear-gradient(135deg,#4a88c8,#6aa8e0)' },
  { id: 'sunset',   name: '樱花浅粉', desc: 'Sakura',     preview: 'linear-gradient(135deg,#d87098,#e898b8)' },
  { id: 'lavender', name: '丁香浅紫', desc: 'Lavender',   preview: 'linear-gradient(135deg,#8868c8,#a888e0)' },
  { id: 'light',    name: '暖沙浅金', desc: 'Sand',       preview: 'linear-gradient(135deg,#b89868,#d8b888)' }
];

// ===== 工具函数 =====
var tbUtils = {
  genId: function() { return 'tb' + Date.now() + Math.random().toString(36).substr(2, 5); },
  today: function() { return new Date().toISOString().slice(0, 10); },
  formatDate: function(d) {
    var dt = new Date(d);
    return dt.getMonth()+1 + '/' + dt.getDate() + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0');
  },
  minsToHHMM: function(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return h + 'h' + (m > 0 ? m + 'm' : '');
  },
  calcStreak: function(doneObj) {
    var streak = 0;
    var d = new Date();
    while (true) {
      var key = d.toISOString().slice(0, 10);
      if (doneObj[key]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  },
  getWeekDates: function() {
    var d = new Date();
    var day = d.getDay() || 7; // Sunday = 7
    var monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var wd = new Date(monday);
      wd.setDate(monday.getDate() + i);
      dates.push(wd.toISOString().slice(0, 10));
    }
    return dates;
  }
};
