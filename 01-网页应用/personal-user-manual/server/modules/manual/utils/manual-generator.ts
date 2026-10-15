import type { StressThreshold, HabitSuggestion } from '@shared/api.interface';

interface VoiceRecordInput {
  id: string;
  emotionTags: string[];
  eventTags: string[];
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

interface GeneratedManual {
  energyRhythm: string[];
  stressThresholds: StressThreshold[];
  habitSuggestions: HabitSuggestion[];
  personalInsights: string;
}

const POSITIVE_EMOTIONS = ['开心', '积极', '满足', '平静', '感恩', '愉快', '兴奋', '幸福'];
const NEGATIVE_EMOTIONS = ['焦虑', '压力', '疲惫', '烦躁', '沮丧', '生气', '难过', '紧张'];

function getHourDistribution(records: TimerRecordInput[], categories: string[]): number[] {
  const hours = new Array(24).fill(0);
  for (const rec of records) {
    if (!categories.includes(rec.category)) continue;
    const h = rec.startedAt.getHours();
    hours[h] += rec.durationSeconds;
  }
  return hours;
}

function findTopHours(hourDist: number[], topN = 3): { hour: number; value: number }[] {
  return hourDist
    .map((value, hour) => ({ hour, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

function countNegativeEmotions(records: VoiceRecordInput[]): number {
  let count = 0;
  for (const rec of records) {
    if (rec.emotionTags.some((tag) => NEGATIVE_EMOTIONS.some((n) => tag.includes(n) || n.includes(tag)))) {
      count += 1;
    }
  }
  return count;
}

function getTotalByCategory(records: TimerRecordInput[], cat: string): number {
  return records.filter((r) => r.category === cat).reduce((s, r) => s + r.durationSeconds, 0);
}

function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  return hours >= 1 ? `${hours.toFixed(1)} 小时` : `${Math.floor(seconds / 60)} 分钟`;
}

export function generateManual(
  voiceRecords: VoiceRecordInput[],
  timerRecords: TimerRecordInput[],
): GeneratedManual {
  const totalVoice = voiceRecords.length;
  const totalTimer = timerRecords.length;
  const totalSeconds = timerRecords.reduce((s, r) => s + r.durationSeconds, 0);
  const negativeCount = countNegativeEmotions(voiceRecords);
  const dataSparse = totalVoice < 3 && totalTimer < 5;

  const workHourDist = getHourDistribution(timerRecords, ['work', 'study']);
  const creativeHourDist = getHourDistribution(timerRecords, ['creative']);
  const topWorkHours = findTopHours(workHourDist, 4);
  const totalWorkSeconds = workHourDist.reduce((s, v) => s + v, 0);

  // ========== 精力节律表 ==========
  const energyRhythm: string[] = [];

  if (!dataSparse && totalWorkSeconds > 0) {
    // 上午高效时段
    const morningHours = workHourDist.slice(6, 12);
    const morningTotal = morningHours.reduce((s, v) => s + v, 0);
    if (morningTotal > totalWorkSeconds * 0.3) {
      const peakMorning = 6 + morningHours.indexOf(Math.max(...morningHours));
      energyRhythm.push(`上午 ${peakMorning}:00-${peakMorning + 2}:00：黄金高效期，适合深度工作和复杂任务`);
    }

    // 下午状态
    const afternoonHours = workHourDist.slice(12, 18);
    const afternoonTotal = afternoonHours.reduce((s, v) => s + v, 0);
    if (afternoonTotal > totalWorkSeconds * 0.3) {
      const peakAfternoon = 12 + afternoonHours.indexOf(Math.max(...afternoonHours));
      energyRhythm.push(`下午 ${peakAfternoon}:00-${peakAfternoon + 2}:00：状态平稳期，适合处理常规事务和会议`);
    } else if (afternoonTotal > 0) {
      energyRhythm.push('下午 14:00-16:00：注意力回落期，适合轻量任务和邮件回复');
    }

    // 晚间创意
    const eveningHours = workHourDist.slice(18, 24);
    const eveningTotal = eveningHours.reduce((s, v) => s + v, 0);
    const creativeEvening = creativeHourDist.slice(18, 24).reduce((s, v) => s + v, 0);
    const creativeTotal = creativeHourDist.reduce((s, v) => s + v, 0);
    if (creativeTotal > 0 && creativeEvening > creativeTotal * 0.5) {
      energyRhythm.push('晚上 20:00-22:00：创意活跃期，适合 brainstorming 和创作型任务');
    } else if (eveningTotal > totalWorkSeconds * 0.2) {
      energyRhythm.push('晚间仍有不少工作投入，注意预留放松和过渡时间');
    }

    // 深夜提醒
    const lateNight = [...workHourDist.slice(22), ...workHourDist.slice(0, 2)].reduce((s, v) => s + v, 0);
    if (lateNight > totalWorkSeconds * 0.1) {
      energyRhythm.push('深夜 23:00 后：不适合高强度脑力劳动，建议安排轻松活动或休息');
    } else {
      energyRhythm.push('深夜 23:00 后：建议进入放松模式，为第二天储备精力');
    }

    // 午间休息判断
    const noon = workHourDist[12];
    const beforeNoon = workHourDist[11];
    if (noon < beforeNoon * 0.5 && beforeNoon > 0) {
      energyRhythm.push('中午 12:00-13:00：自然休息时段，记得按时吃饭和短暂放松');
    }
  } else {
    energyRhythm.push('上午 9:00-11:00：通常是大多数人的黄金高效期，尝试安排深度工作');
    energyRhythm.push('下午 14:00-16:00：注意力容易回落，适合处理轻量任务');
    energyRhythm.push('晚上 20:00-22:00：可以尝试创意类活动，看看是否适合自己');
    energyRhythm.push('深夜 23:00 后：建议进入放松状态，保证充足睡眠');
  }

  // 最多保留 5 条
  const finalRhythm = energyRhythm.slice(0, 5);

  // ========== 压力阈值清单 ==========
  const stressThresholds: StressThreshold[] = [];

  // 根据工作时长
  const workTotal = getTotalByCategory(timerRecords, 'work');
  const activeDays = new Set(timerRecords.filter((r) => r.category === 'work').map((r) => r.startedAt.toISOString().slice(0, 10))).size;
  const avgWorkPerDay = activeDays > 0 ? workTotal / activeDays : 0;

  if (avgWorkPerDay > 8 * 3600) {
    stressThresholds.push({
      threshold: '单日工作超过 8 小时',
      symptom: '注意力下降、决策变慢、情绪容易烦躁',
      solution: '每 90 分钟强制休息 15 分钟，离开屏幕远眺或走动',
    });
  } else if (avgWorkPerDay > 6 * 3600) {
    stressThresholds.push({
      threshold: '连续工作超过 3 小时',
      symptom: '注意力下降、烦躁感增加、效率开始走低',
      solution: '每 90 分钟强制休息 15 分钟，离开屏幕远眺',
    });
  } else {
    stressThresholds.push({
      threshold: '连续专注超过 2 小时',
      symptom: '注意力开始分散，眼睛疲劳',
      solution: '每小时起身活动 5 分钟，远眺放松眼睛',
    });
  }

  // 根据负面情绪频率
  if (negativeCount >= 5) {
    stressThresholds.push({
      threshold: '连续 2 天出现负面情绪',
      symptom: '情绪低落、动力不足、对事物提不起兴趣',
      solution: '主动安排一件让自己开心的小事，或和朋友聊聊天',
    });
  } else if (negativeCount >= 2) {
    stressThresholds.push({
      threshold: '负面情绪连续出现 3 次以上',
      symptom: '容易烦躁、耐心下降、睡眠受影响',
      solution: '做 10 分钟深呼吸或冥想，出门散步 15 分钟',
    });
  }

  // 睡眠不足
  const sleepRelated = voiceRecords.filter((r) =>
    r.eventTags.some((t) => t.includes('失眠') || t.includes('睡不好') || t.includes('熬夜')),
  );
  if (sleepRelated.length >= 2) {
    stressThresholds.push({
      threshold: '睡眠不足 6 小时',
      symptom: '次日判断力下降、情绪敏感、容易疲惫',
      solution: '优先保证睡眠，减少当日的高强度任务安排',
    });
  }

  // 社交后恢复
  const socialTotal = getTotalByCategory(timerRecords, 'social');
  if (socialTotal > 0 && negativeCount > 0) {
    stressThresholds.push({
      threshold: '高强度社交超过 3 小时',
      symptom: '社交后感到精疲力竭，需要独处恢复',
      solution: '社交日预留 1-2 小时独处时间，不安排其他任务',
    });
  }

  // 不出门
  const outdoorDays = new Set(
    timerRecords.filter((r) => r.category === 'outdoor' || r.category === 'exercise').map((r) => r.startedAt.toISOString().slice(0, 10)),
  );
  const totalDaysWithRecord = new Set(timerRecords.map((r) => r.startedAt.toISOString().slice(0, 10))).size;
  if (totalDaysWithRecord >= 5 && outdoorDays.size < totalDaysWithRecord * 0.3) {
    stressThresholds.push({
      threshold: '2 天不出门、不晒太阳',
      symptom: '情绪低落、动力不足、作息容易混乱',
      solution: '每天至少下楼 5 分钟，晒太阳或散步',
    });
  }

  // 如果数据太少，给出通用的
  if (stressThresholds.length < 3) {
    const defaults: StressThreshold[] = [
      {
        threshold: '连续工作超过 3 小时',
        symptom: '注意力下降、烦躁感增加',
        solution: '每 90 分钟强制休息 15 分钟，离开屏幕远眺',
      },
      {
        threshold: '睡眠不足 6 小时',
        symptom: '次日判断力下降、情绪敏感',
        solution: '优先保证睡眠，减少当日的高强度任务安排',
      },
      {
        threshold: '2 天不出门',
        symptom: '情绪低落、动力不足',
        solution: '每天至少下楼 5 分钟，晒太阳或散步',
      },
    ];
    for (const d of defaults) {
      if (!stressThresholds.some((t) => t.threshold === d.threshold)) {
        stressThresholds.push(d);
      }
      if (stressThresholds.length >= 5) break;
    }
  }

  // ========== 习惯优化建议 ==========
  const habitSuggestions: HabitSuggestion[] = [];

  // 工作类建议
  if (avgWorkPerDay > 6 * 3600) {
    habitSuggestions.push({
      category: '工作',
      suggestion: '拆分任务为 90 分钟专注单元',
      action: '用计时器设定 90 分钟专注块，每块之间强制休息 15 分钟',
    });
  } else if (workTotal > 0) {
    habitSuggestions.push({
      category: '工作',
      suggestion: '固定每天的深度工作时段',
      action: '把最重要的任务安排在你状态最好的 2-3 小时内完成',
    });
  }

  // 休息类建议
  const restTotal = getTotalByCategory(timerRecords, 'rest');
  if (restTotal < totalSeconds * 0.1 && totalSeconds > 0) {
    habitSuggestions.push({
      category: '休息',
      suggestion: '建立明确的工作结束仪式',
      action: '每天固定时间关闭工作软件，做 5 分钟拉伸或深呼吸',
    });
  } else {
    habitSuggestions.push({
      category: '休息',
      suggestion: '主动休息而非被动休息',
      action: '每小时安排 5 分钟主动休息，而不是等到累了才停',
    });
  }

  // 运动类建议
  const exerciseTotal = getTotalByCategory(timerRecords, 'exercise');
  if (exerciseTotal === 0) {
    habitSuggestions.push({
      category: '运动',
      suggestion: '从每天 10 分钟开始',
      action: '每天固定时间做 10 分钟简单运动，建立习惯后再增加',
    });
  } else if (exerciseTotal < 3 * 3600) {
    habitSuggestions.push({
      category: '运动',
      suggestion: '每周安排 3 次运动',
      action: '把运动时间写进日程，像对待工作会议一样认真对待',
    });
  } else {
    habitSuggestions.push({
      category: '运动',
      suggestion: '保持运动节奏的多样性',
      action: '交替安排有氧和力量训练，避免单一运动带来的倦怠',
    });
  }

  // 睡眠类建议
  if (sleepRelated.length >= 2) {
    habitSuggestions.push({
      category: '睡眠',
      suggestion: '建立睡前 30 分钟放松仪式',
      action: '睡前放下手机，可以读书、听轻音乐或做简单拉伸',
    });
  } else {
    habitSuggestions.push({
      category: '睡眠',
      suggestion: '保持规律的作息时间',
      action: '尽量每天同一时间睡觉和起床，包括周末',
    });
  }

  // 社交类建议
  const socialDays = new Set(
    timerRecords.filter((r) => r.category === 'social').map((r) => r.startedAt.toISOString().slice(0, 10)),
  );
  if (socialDays.size === 0 && totalDaysWithRecord >= 5) {
    habitSuggestions.push({
      category: '社交',
      suggestion: '每周安排一次社交活动',
      action: '主动约朋友见面或参加兴趣活动，维持社会连接',
    });
  } else if (socialTotal > 10 * 3600) {
    habitSuggestions.push({
      category: '社交',
      suggestion: '在社交后预留恢复时间',
      action: '每次长时间社交后，给自己留半天独处恢复的时间',
    });
  }

  // 自我觉察
  if (totalVoice < 5) {
    habitSuggestions.push({
      category: '自我觉察',
      suggestion: '每天一条语音记录',
      action: '睡前花 1 分钟录一条语音，说说今天最值得记录的一件事',
    });
  } else {
    habitSuggestions.push({
      category: '自我觉察',
      suggestion: '定期回看自己的记录',
      action: '每周日晚上花 10 分钟回顾本周的语音和计时记录',
    });
  }

  // 确保至少 4 条
  while (habitSuggestions.length < 4) {
    const fallback: HabitSuggestion[] = [
      {
        category: '工作',
        suggestion: '固定每天的深度工作时段',
        action: '把最重要的任务安排在你状态最好的 2-3 小时内完成',
      },
      {
        category: '休息',
        suggestion: '主动休息而非被动休息',
        action: '每小时安排 5 分钟主动休息，而不是等到累了才停',
      },
    ];
    for (const f of fallback) {
      if (!habitSuggestions.some((h) => h.suggestion === f.suggestion)) {
        habitSuggestions.push(f);
      }
      if (habitSuggestions.length >= 4) break;
    }
    if (habitSuggestions.length >= 4) break;
  }

  // ========== 个人洞察 ==========
  let personalInsights = '';

  const totalHours = totalSeconds / 3600;
  const positiveCount = voiceRecords.filter((r) =>
    r.emotionTags.some((tag) => POSITIVE_EMOTIONS.some((p) => tag.includes(p) || p.includes(tag))),
  ).length;

  if (dataSparse) {
    personalInsights =
      '你好呀，谢谢你愿意花时间了解自己。目前的数据还不多，但这没关系——重要的不是数据有多完美，而是你已经开始了这段探索之旅。\n\n你不需要成为别人眼中高效的样子，也不需要按照任何人的标准生活。你只需要更了解自己：什么时候状态最好？什么事让你开心？什么时候需要停下来休息？\n\n继续记录吧，不用追求完美。每一条语音、每一次计时，都是你和自己对话的方式。慢慢来，你的说明书会随着你的成长，一点一点变得清晰。';
  } else {
    const mainThing =
      totalWorkSeconds > totalSeconds * 0.5
        ? '你在工作上投入了很多精力'
        : getTotalByCategory(timerRecords, 'study') > totalSeconds * 0.3
          ? '你在持续学习和成长'
          : '你在生活的各个方面都保持着探索';

    const emotionNote =
      positiveCount > negativeCount
        ? '你有很多积极的时刻，这是很珍贵的能量'
        : negativeCount > 0
          ? '这段时间可能有些不容易，但你都坚持下来了'
          : '你的情绪状态比较平稳，这本身就是一种力量';

    personalInsights =
      `亲爱的你，从这 30 天的数据里，我看到了一个认真生活的人。\n\n` +
      `${mainThing}，累计投入了约 ${totalHours.toFixed(1)} 小时。${emotionNote}。\n\n` +
      `我想告诉你：你不需要成为别人，也不需要做到"完美"。你只需要更了解自己——了解你什么时候精力最充沛，了解你在什么情况下会感到压力，了解什么事能让你真正开心。这些了解，比任何效率法则都更有用。\n\n` +
      `这份说明书不是终点，而是一个起点。它会随着你的变化而变化，因为你一直在成长。对自己温柔一点，也对自己好奇一点。慢慢来，你值得被好好了解。`;
  }

  return {
    energyRhythm: finalRhythm,
    stressThresholds: stressThresholds.slice(0, 5),
    habitSuggestions: habitSuggestions.slice(0, 6),
    personalInsights,
  };
}
