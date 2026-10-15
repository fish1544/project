const POSITIVE_EMOTIONS = [
  '开心',
  '高兴',
  '愉快',
  '兴奋',
  '满足',
  '平静',
  '放松',
  '充实',
  '有成就感',
  '精力充沛',
];

const NEGATIVE_EMOTIONS = [
  '焦虑',
  '压力',
  '疲惫',
  '烦躁',
  '沮丧',
  '难过',
  '生气',
  '无聊',
  '孤独',
  '担心',
];

const EVENT_KEYWORDS = [
  '工作',
  '学习',
  '写作',
  '会议',
  '阅读',
  '运动',
  '健身',
  '做饭',
  '吃饭',
  '睡觉',
  '社交',
  '见朋友',
  '旅行',
  '出门',
  '在家',
  '追剧',
  '打游戏',
  '手工',
  '画画',
  '弹琴',
];

const TIME_KEYWORDS = [
  '早上',
  '上午',
  '中午',
  '下午',
  '傍晚',
  '晚上',
  '深夜',
  '凌晨',
  '今天',
  '昨天',
  '明天',
  '周一',
  '周二',
  '周三',
  '周四',
  '周五',
  '周六',
  '周日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
  '星期日',
];

const TIME_REGEX = /\d{1,2}点(?:\d{1,2}分)?/g;

/**
 * 从文本中提取情绪标签（积极/消极）
 */
export function extractEmotionTags(transcript: string): string[] {
  if (!transcript) return [];
  const hits: string[] = [];
  for (const word of [...POSITIVE_EMOTIONS, ...NEGATIVE_EMOTIONS]) {
    if (transcript.includes(word) && !hits.includes(word)) {
      hits.push(word);
    }
  }
  return hits;
}

/**
 * 判断情绪类型：positive / negative / neutral
 */
export function classifyEmotion(tags: string[]): 'positive' | 'negative' | 'neutral' {
  const positiveCount = tags.filter((t: string) => POSITIVE_EMOTIONS.includes(t)).length;
  const negativeCount = tags.filter((t: string) => NEGATIVE_EMOTIONS.includes(t)).length;
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * 从文本中提取事件标签
 */
export function extractEventTags(transcript: string): string[] {
  if (!transcript) return [];
  const hits: string[] = [];
  for (const word of EVENT_KEYWORDS) {
    if (transcript.includes(word) && !hits.includes(word)) {
      hits.push(word);
    }
  }
  return hits;
}

/**
 * 从文本中提取时间提及（关键词 + 几点钟正则）
 */
export function extractTimeMentions(transcript: string): string[] {
  if (!transcript) return [];
  const hits: string[] = [];
  for (const word of TIME_KEYWORDS) {
    if (transcript.includes(word) && !hits.includes(word)) {
      hits.push(word);
    }
  }
  const matches = transcript.match(TIME_REGEX);
  if (matches) {
    for (const m of matches) {
      if (!hits.includes(m)) hits.push(m);
    }
  }
  return hits;
}
