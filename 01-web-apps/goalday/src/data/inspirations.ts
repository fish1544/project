// 灵感中心模板库
// EXPORTS: INSPIRATIONS, IInspiration, repeatLabel, INSPIRATION_CATEGORIES

export interface IInspiration {
  name: string;
  category: string;
  repeat: number[]; // 0=周日 … 6=周六
  desc: string;
}

const EVERYDAY = [0, 1, 2, 3, 4, 5, 6];
const WORKDAY = [1, 2, 3, 4, 5];

export const INSPIRATIONS: IInspiration[] = [
  // 健康
  { name: '喝水 8 杯', category: '健康', repeat: EVERYDAY, desc: '定时补水，保持精力充沛' },
  { name: '23 点前睡觉', category: '健康', repeat: EVERYDAY, desc: '保证 7 小时以上睡眠' },
  { name: '运动 30 分钟', category: '健康', repeat: [1, 3, 5], desc: '有氧或力量，每周至少三次' },
  { name: '晨间拉伸 5 分钟', category: '健康', repeat: EVERYDAY, desc: '唤醒身体，活动筋骨' },
  { name: '冥想 10 分钟', category: '健康', repeat: EVERYDAY, desc: '清空杂念，专注当下' },
  { name: '步行 8000 步', category: '健康', repeat: EVERYDAY, desc: '碎片时间也能积累健康' },
  { name: '吃水果', category: '健康', repeat: EVERYDAY, desc: '补充维生素和膳食纤维' },
  // 学习
  { name: '阅读 30 分钟', category: '学习', repeat: EVERYDAY, desc: '每天读一点，积少成多' },
  { name: '背单词 20 个', category: '学习', repeat: EVERYDAY, desc: '词汇量稳步增长' },
  { name: '学习新技能 1 小时', category: '学习', repeat: EVERYDAY, desc: '投资自己，长期复利' },
  { name: '写作 500 字', category: '学习', repeat: EVERYDAY, desc: '梳理思考，锻炼表达' },
  { name: '听一集播客 / 课程', category: '学习', repeat: EVERYDAY, desc: '通勤时间也能输入' },
  { name: '每日复盘', category: '学习', repeat: EVERYDAY, desc: '总结今天，规划明天' },
  // 工作
  { name: '列出今日待办', category: '工作', repeat: WORKDAY, desc: '先计划，再行动' },
  { name: '深度工作 2 小时', category: '工作', repeat: WORKDAY, desc: '远离干扰的专注时段' },
  { name: '清理邮件 / 消息', category: '工作', repeat: WORKDAY, desc: '保持信息畅通不积压' },
  { name: '提前规划明日', category: '工作', repeat: EVERYDAY, desc: '睡前定好明天的重点' },
  // 生活
  { name: '整理房间 10 分钟', category: '生活', repeat: EVERYDAY, desc: '环境清爽，心情清爽' },
  { name: '给家人打电话', category: '生活', repeat: [0], desc: '常联系，感情更近' },
  { name: '断舍离一件物品', category: '生活', repeat: [6], desc: '少而精的生活' },
  { name: '出门晒太阳 15 分钟', category: '生活', repeat: EVERYDAY, desc: '补充维生素 D，调节心情' },
  { name: '写一篇日记', category: '生活', repeat: EVERYDAY, desc: '记录今天，留住回忆' },
  // 理财
  { name: '记账', category: '理财', repeat: EVERYDAY, desc: '清楚每一笔花销' },
  { name: '储蓄打卡', category: '理财', repeat: EVERYDAY, desc: '先存后花，积少成多' },
  { name: '复盘每日支出', category: '理财', repeat: EVERYDAY, desc: '看清钱花在了哪里' },
];

export const INSPIRATION_CATEGORIES = [...new Set(INSPIRATIONS.map((i) => i.category))];

/** 把重复日数组转成中文频率文案 */
export function repeatLabel(repeat: number[]): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  if (repeat.length === 7) return '每天';
  if (repeat.length === 5 && WORKDAY.every((d) => repeat.includes(d))) return '工作日';
  if (repeat.length === 2 && repeat.includes(0) && repeat.includes(6)) return '每周末';
  if (repeat.length === 1) return `每周${days[repeat[0]]}`;
  return repeat.map((d) => days[d]).join('/');
}
