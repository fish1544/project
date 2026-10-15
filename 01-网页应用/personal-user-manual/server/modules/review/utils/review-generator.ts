import type { ReviewType } from '@shared/api.interface';

interface VoiceRecordInput {
  id: string;
  emotionTags: string[];
  eventTags: string[];
  timeMentions: string[];
  recordDate: string;
  createdAt: Date;
}

interface TimerRecordInput {
  id: string;
  taskName: string;
  category: string;
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date;
}

interface GeneratedReview {
  achievements: string[];
  stressSources: string[];
  triggerPoints: string[];
  behaviorPatterns: string[];
  summary: string;
}

const POSITIVE_EMOTIONS = ['开心', '积极', '满足', '平静', '感恩', '愉快', '兴奋', '幸福', '自豪', '轻松'];
const NEGATIVE_EMOTIONS = ['焦虑', '压力', '疲惫', '烦躁', '沮丧', '生气', '难过', '紧张', '担忧', '疲惫不堪'];
const STRESS_KEYWORDS = ['工作', '加班', '会议', 'deadline', '考试', '面试', '冲突', '吵架', '失眠', '头疼'];

const CATEGORY_NAMES: Record<string, string> = {
  work: '工作',
  study: '学习',
  creative: '创意',
  rest: '休息',
  exercise: '运动',
  social: '社交',
  outdoor: '户外',
  other: '其他',
};

function countEmotions(records: VoiceRecordInput[], targetList: string[]): number {
  let count = 0;
  for (const rec of records) {
    for (const tag of rec.emotionTags) {
      if (targetList.some((t) => tag.includes(t) || t.includes(tag))) {
        count += 1;
        break;
      }
    }
  }
  return count;
}

function getTimerTotalsByCategory(records: TimerRecordInput[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const rec of records) {
    totals[rec.category] = (totals[rec.category] || 0) + rec.durationSeconds;
  }
  return totals;
}

function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  if (hours >= 1) {
    return hours >= 10 ? `${Math.floor(hours)}` : `${hours.toFixed(1)}`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes} 分钟`;
}

function countUniqueDays(records: TimerRecordInput[]): number {
  const days = new Set<string>();
  for (const rec of records) {
    days.add(rec.startedAt.toISOString().slice(0, 10));
  }
  return days.size;
}

function getHourDistribution(records: TimerRecordInput[], categories: string[]): number[] {
  const hours = new Array(24).fill(0);
  for (const rec of records) {
    if (!categories.includes(rec.category)) continue;
    const startHour = rec.startedAt.getHours();
    hours[startHour] += rec.durationSeconds;
  }
  return hours;
}

function findPeakHour(hourDist: number[]): number {
  let maxIdx = 9;
  for (let i = 0; i < 24; i++) {
    if (hourDist[i] > hourDist[maxIdx]) maxIdx = i;
  }
  return maxIdx;
}

function analyzeNegativeEmotionTimePattern(voiceRecords: VoiceRecordInput[]): { byHour: number[]; byDayOfWeek: number[] } {
  const byHour = new Array(24).fill(0);
  const byDayOfWeek = new Array(7).fill(0);
  for (const rec of voiceRecords) {
    const hasNeg = rec.emotionTags.some((tag) =>
      NEGATIVE_EMOTIONS.some((n) => tag.includes(n) || n.includes(tag)),
    );
    if (!hasNeg) continue;
    const h = rec.createdAt.getHours();
    const d = rec.createdAt.getDay();
    byHour[h] += 1;
    byDayOfWeek[d] += 1;
  }
  return { byHour, byDayOfWeek };
}

export function generateReview(
  voiceRecords: VoiceRecordInput[],
  timerRecords: TimerRecordInput[],
  reviewType: ReviewType,
  periodStart: string,
  periodEnd: string,
): GeneratedReview {
  const totalVoice = voiceRecords.length;
  const totalTimer = timerRecords.length;
  const totalSeconds = timerRecords.reduce((sum, r) => sum + r.durationSeconds, 0);
  const categoryTotals = getTimerTotalsByCategory(timerRecords);
  const positiveCount = countEmotions(voiceRecords, POSITIVE_EMOTIONS);
  const negativeCount = countEmotions(voiceRecords, NEGATIVE_EMOTIONS);
  const dataSparse = totalVoice < 2 && totalTimer < 3;

  // ========== 成就 ==========
  const achievements: string[] = [];

  if (categoryTotals.work && categoryTotals.work > 0) {
    const hours = formatHours(categoryTotals.work);
    achievements.push(`累计专注工作 ${hours} 小时`);
  }
  if (categoryTotals.exercise && categoryTotals.exercise > 0) {
    const exerciseDays = countUniqueDays(timerRecords.filter((r) => r.category === 'exercise'));
    const mins = Math.floor(categoryTotals.exercise / 60);
    achievements.push(`坚持运动 ${exerciseDays} 次，共 ${mins} 分钟`);
  }
  if (categoryTotals.study && categoryTotals.study > 0) {
    achievements.push(`投入学习 ${formatHours(categoryTotals.study)} 小时，持续成长`);
  }
  if (categoryTotals.creative && categoryTotals.creative > 0) {
    achievements.push(`创意产出 ${formatHours(categoryTotals.creative)} 小时，灵感满满`);
  }
  if (totalVoice > 0) {
    achievements.push(`主动记录了 ${totalVoice} 条语音笔记，认真对待自己的感受`);
  }
  if (positiveCount > 0) {
    const ratio = totalVoice > 0 ? Math.round((positiveCount / totalVoice) * 100) : 0;
    if (ratio >= 60) {
      achievements.push(`积极情绪占比 ${ratio}%，整体状态非常不错`);
    } else if (ratio >= 30) {
      achievements.push(`有 ${positiveCount} 个值得记住的开心时刻`);
    }
  }
  if (categoryTotals.rest && categoryTotals.rest > 0) {
    achievements.push(`安排了 ${formatHours(categoryTotals.rest)} 的休息时间，懂得张弛有度`);
  }

  if (achievements.length === 0) {
    achievements.push('记录数据还不够多，继续坚持记录哦');
  }

  // ========== 压力来源 ==========
  const stressSources: string[] = [];

  if (negativeCount > 0) {
    const stressRelatedEvents: string[] = [];
    for (const rec of voiceRecords) {
      const hasNeg = rec.emotionTags.some((tag) =>
        NEGATIVE_EMOTIONS.some((n) => tag.includes(n) || n.includes(tag)),
      );
      if (hasNeg) {
        stressRelatedEvents.push(...rec.eventTags);
      }
    }
    const freq = new Map<string, number>();
    for (const ev of stressRelatedEvents) {
      freq.set(ev, (freq.get(ev) || 0) + 1);
    }
    const topEvents = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (topEvents.length > 0) {
      stressSources.push(`"${topEvents[0][0]}" 相关事件引发的情绪波动最频繁`);
    }
  }

  if (categoryTotals.work && categoryTotals.work > 8 * 3600 * (reviewType === 'daily' ? 1 : reviewType === 'weekly' ? 5 : 20)) {
    stressSources.push('工作时长偏长，注意留出恢复时间');
  }

  const lateNightWork = timerRecords.filter((r) => {
    const h = r.startedAt.getHours();
    return r.category === 'work' && (h >= 22 || h < 5);
  });
  if (lateNightWork.length > 0) {
    stressSources.push('深夜仍在进行高强度脑力活动，影响恢复质量');
  }

  if (negativeCount > 0 && categoryTotals.rest && categoryTotals.rest < totalSeconds * 0.1) {
    stressSources.push('休息时间占比偏低，身心恢复可能不足');
  }

  if (negativeCount > 2) {
    stressSources.push(`期间出现 ${negativeCount} 次负面情绪记录，值得关注和调节`);
  }

  if (stressSources.length === 0 && !dataSparse) {
    stressSources.push('压力源不明显，继续保持良好的节奏');
  }
  if (stressSources.length === 0 && dataSparse) {
    stressSources.push('记录数据有限，暂时无法准确判断压力来源');
  }

  // ========== 触发点 ==========
  const triggerPoints: string[] = [];

  const { byHour: negByHour, byDayOfWeek: negByDow } = analyzeNegativeEmotionTimePattern(voiceRecords);

  if (negativeCount > 0) {
    const peakNegHour = findPeakHour(negByHour);
    if (peakNegHour >= 9 && peakNegHour < 12) {
      triggerPoints.push('上午时段负面情绪较多，可能与任务启动压力有关');
    } else if (peakNegHour >= 13 && peakNegHour < 17) {
      triggerPoints.push('周中下午是情绪低谷期，建议安排轻量任务');
    } else if (peakNegHour >= 20 || peakNegHour < 2) {
      triggerPoints.push('深夜容易陷入情绪内耗，尝试睡前放松仪式');
    } else {
      triggerPoints.push(`${peakNegHour}:00 前后情绪波动较大，可以留意触发场景`);
    }

    const peakDow = negByDow.indexOf(Math.max(...negByDow));
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    if (peakDow === 1) {
      triggerPoints.push('周一是情绪最低落的一天，可以试着降低周一的任务强度');
    } else if (peakDow === 5) {
      triggerPoints.push('周五容易感到疲惫，适当安排收尾性工作即可');
    } else if (negByDow[peakDow] > 0) {
      triggerPoints.push(`${dayNames[peakDow]} 负面情绪相对集中，注意调节节奏`);
    }
  }

  // 分析连续工作时长
  const workRecords = timerRecords.filter((r) => r.category === 'work');
  if (workRecords.length > 0) {
    const avgWorkSession = workRecords.reduce((s, r) => s + r.durationSeconds, 0) / workRecords.length;
    if (avgWorkSession > 2 * 3600) {
      triggerPoints.push('单次专注时长偏长，连续工作超过 2 小时后效率可能下降');
    }
    if (avgWorkSession > 3 * 3600) {
      triggerPoints.push('连续工作超过 3 小时后注意力明显下降，建议中间穿插休息');
    }
  }

  // 咖啡/睡眠相关触发点（从事件标签判断）
  const caffeineEvents = voiceRecords.filter((r) =>
    r.eventTags.some((t) => t.includes('咖啡') || t.includes('咖啡因')),
  );
  if (caffeineEvents.length > 2) {
    triggerPoints.push('咖啡因摄入较多的日子，晚上睡眠质量可能下降');
  }

  const sleepEvents = voiceRecords.filter((r) =>
    r.eventTags.some((t) => t.includes('失眠') || t.includes('睡不好') || t.includes('熬夜')),
  );
  if (sleepEvents.length > 0) {
    triggerPoints.push('睡眠不足时次日情绪敏感度上升，优先保证睡眠质量');
  }

  if (triggerPoints.length === 0 && !dataSparse) {
    triggerPoints.push('暂未发现明显的情绪触发模式，继续积累数据中');
  }
  if (triggerPoints.length === 0 && dataSparse) {
    triggerPoints.push('数据量不足，多记录几次才能发现触发规律');
  }

  // ========== 行为规律 ==========
  const behaviorPatterns: string[] = [];

  // 高效时段分析
  const workHourDist = getHourDistribution(timerRecords, ['work', 'study', 'creative']);
  const workHourTotal = workHourDist.reduce((s, v) => s + v, 0);
  if (workHourTotal > 0) {
    const peakHour = findPeakHour(workHourDist);
    if (peakHour >= 6 && peakHour < 12) {
      behaviorPatterns.push(`高效时段集中在上午 ${peakHour}:00-${peakHour + 2}:00，适合安排深度工作`);
    } else if (peakHour >= 12 && peakHour < 18) {
      behaviorPatterns.push(`下午 ${peakHour}:00-${peakHour + 2}:00 状态最佳，可安排重要任务`);
    } else if (peakHour >= 18 && peakHour < 24) {
      behaviorPatterns.push(`晚上 ${peakHour}:00-${peakHour + 2}:00 是你的黄金时段`);
    } else {
      behaviorPatterns.push(`凌晨 ${peakHour}:00 仍在高效产出，注意作息平衡`);
    }
  }

  // 分类占比
  const categoriesSorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (categoriesSorted.length >= 2) {
    const topCat = CATEGORY_NAMES[categoriesSorted[0][0]] || categoriesSorted[0][0];
    const secondCat = CATEGORY_NAMES[categoriesSorted[1][0]] || categoriesSorted[1][0];
    const topPct = Math.round((categoriesSorted[0][1] / totalSeconds) * 100);
    behaviorPatterns.push(`时间主要分配给${topCat}（${topPct}%），其次是${secondCat}`);
  }

  // 创意时段
  const creativeHourDist = getHourDistribution(timerRecords, ['creative']);
  const creativeTotal = creativeHourDist.reduce((s, v) => s + v, 0);
  if (creativeTotal > 0) {
    const creativePeak = findPeakHour(creativeHourDist);
    if (creativePeak >= 20 || creativePeak < 2) {
      behaviorPatterns.push('创意类任务在深夜产出最高，灵感更容易涌现');
    } else {
      behaviorPatterns.push(`创意工作在 ${creativePeak}:00 前后效率最高`);
    }
  }

  // 运动与效率的关系
  const exerciseDays = new Set(
    timerRecords.filter((r) => r.category === 'exercise').map((r) => r.startedAt.toISOString().slice(0, 10)),
  );
  const restDays = new Set(
    timerRecords.filter((r) => r.category === 'rest').map((r) => r.startedAt.toISOString().slice(0, 10)),
  );
  const totalActiveDays = countUniqueDays(timerRecords.filter((r) => r.category === 'work' || r.category === 'study'));
  if (exerciseDays.size > 0 && totalActiveDays > 0) {
    const ratio = Math.round((exerciseDays.size / totalActiveDays) * 100);
    if (ratio >= 50) {
      behaviorPatterns.push('运动频率不错，运动日的工作效率通常更稳定');
    } else {
      behaviorPatterns.push('运动日占比偏低，增加运动可能提升整体效率');
    }
  }

  if (restDays.size === 0 && totalSeconds > 0) {
    behaviorPatterns.push('专注记录较多但休息记录偏少，注意劳逸结合');
  }

  if (behaviorPatterns.length === 0) {
    behaviorPatterns.push('数据量还不够，坚持记录才能发现你的行为规律');
  }

  // ========== 总结 ==========
  let summary = '';

  const periodLabel =
    reviewType === 'daily' ? '今天' : reviewType === 'weekly' ? '这一周' : '这一个月';

  if (dataSparse) {
    summary = `${periodLabel}的记录数据还比较少，这很正常——刚开始记录总是不完整的。重要的是你已经开始关注自己的状态了。继续坚持语音记录和计时，积累越多数据，复盘就越能帮你看清自己的模式。每一次记录都是在更了解自己一点，慢慢来，不用急。`;
  } else {
    const highlights: string[] = [];
    if (achievements.length > 0 && achievements[0] !== '记录数据还不够多，继续坚持记录哦') {
      highlights.push(achievements[0]);
    }
    if (categoryTotals.exercise) highlights.push('保持了运动习惯');
    if (positiveCount > negativeCount) highlights.push('积极情绪多于消极情绪');

    const improvements: string[] = [];
    if (stressSources.length > 0 && stressSources[0].includes('工作时长')) {
      improvements.push('控制工作时长、增加休息');
    }
    if (negativeCount > positiveCount) {
      improvements.push('关注情绪调节、增加积极体验');
    }
    if (lateNightWork.length > 0) {
      improvements.push('减少深夜工作');
    }

    const highlightStr = highlights.length > 0 ? highlights.join('、') : '有不少值得肯定的地方';
    const improveStr = improvements.length > 0 ? improvements.join('、') : '继续保持当前的节奏就好';

    summary = `${periodLabel}，你在${totalTimer > 0 ? `计时记录了 ${formatHours(totalSeconds)} 时间` : '多件事情'}上投入了精力，${highlightStr}。整体来看，${improveStr}。下一期可以试着在保持优势的同时，更细致地觉察自己的情绪变化，找到适合自己的节奏。记住，复盘不是为了评判，而是为了更了解自己、更好地照顾自己。`;
  }

  return {
    achievements: achievements.slice(0, 6),
    stressSources: stressSources.slice(0, 5),
    triggerPoints: triggerPoints.slice(0, 4),
    behaviorPatterns: behaviorPatterns.slice(0, 5),
    summary,
  };
}
