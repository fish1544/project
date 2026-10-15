import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Mic,
  Clock,
  Flame,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@client/src/contexts/AuthContext';
import { voiceApi, timerApi, reviewApi } from '@client/src/api';
import type {
  VoiceRecord,
  TimerRecord,
  TimerStatsResponse,
  VoiceRecordListResponse,
  ReviewListResponse,
  TimerRecordListResponse,
} from '@shared/api.interface';
import {
  MOTIVATIONAL_QUOTES,
  WEEKDAY_MAP,
  getGreeting,
  formatShortDuration,
  getLast7Days,
  quickActions,
} from './dashboard-constants';

function StatCard({
  label,
  value,
  unit,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-2 text-xl md:text-2xl font-bold text-gray-800 break-all">
             {value}
             {unit && (
               <span className="text-sm font-normal text-gray-400 ml-1">
                 {unit}
               </span>
             )}
           </p>
        </div>
        <div
          className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyChart({ byDay }: { byDay: Record<string, number> }) {
  const days = getLast7Days();
  const values = days.map((d) => byDay[d] ?? 0);
  const maxValue = Math.max(...values, 3600);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between h-32 gap-2">
        {days.map((day, index) => {
          const value = values[index];
          const heightPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const dayLabel = WEEKDAY_MAP[new Date(day).getDay()].replace(
            '周',
            '',
          );
          const isToday = index === days.length - 1;
          return (
            <div
              key={day}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    isToday
                      ? 'bg-gradient-to-t from-indigo-500 to-indigo-400'
                      : 'bg-gradient-to-t from-indigo-200 to-indigo-100'
                  }`}
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    minHeight: value > 0 ? '6px' : '2px',
                  }}
                />
              </div>
              <span
                className={`text-xs ${
                  isToday ? 'text-indigo-600 font-medium' : 'text-gray-400'
                }`}
              >
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>近 7 天计时时长</span>
        <span>最高 {formatShortDuration(maxValue)}</span>
      </div>
    </div>
  );
}

function VoiceRecordItem({ record }: { record: VoiceRecord }) {
  const transcriptPreview = record.transcript
    ? record.transcript.length > 40
      ? `${record.transcript.slice(0, 40)}...`
      : record.transcript
    : '无转写内容';
  const allTags = [...record.emotionTags, ...record.eventTags].slice(0, 3);

  return (
    <Link
      to="/voice"
      className="block py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors -mx-2 px-2 rounded-lg"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Mic className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-800 font-medium truncate">
              {formatShortDuration(record.durationSeconds)}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {record.recordDate}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {transcriptPreview}
          </p>
          {allTags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {allTags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function TimerRecordItem({ record }: { record: TimerRecord }) {
  return (
    <Link
      to="/timer"
      className="block py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors -mx-2 px-2 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-800 font-medium truncate">
              {record.taskName}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0 font-medium">
              {formatShortDuration(record.durationSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              {record.category}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(record.startedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Icon className="w-10 h-10 mb-2 opacity-30" />
      <p className="text-sm">{title}</p>
      <p className="text-xs mt-1">{subtitle}</p>
    </div>
  );
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'voice' | 'timer'>('voice');

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAY_MAP[now.getDay()]}`;
  const quote = useMemo(() => {
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
        86400000,
    );
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = user?.displayName || user?.username || '朋友';

  const { data: voiceData } = useQuery<VoiceRecordListResponse>({
    queryKey: ['voice-records-dashboard'],
    queryFn: () => voiceApi.getVoiceRecords(1, 5),
  });

  const { data: timerStats } = useQuery<TimerStatsResponse>({
    queryKey: ['timer-stats-dashboard'],
    queryFn: () => timerApi.getTimerStats(),
  });

  const { data: reviewData } = useQuery<ReviewListResponse>({
    queryKey: ['review-reports-dashboard'],
    queryFn: () => reviewApi.getReviewReports(1, 1),
  });

  const { data: timerListData } = useQuery<TimerRecordListResponse>({
    queryKey: ['timer-records-dashboard'],
    queryFn: () => timerApi.getTimerRecords(1, 5),
  });

  const todayStr = now.toISOString().split('T')[0];
  const todayVoiceCount =
    voiceData?.items?.filter(
      (item: VoiceRecord) => item.recordDate === todayStr,
    ).length ?? 0;
  const todayTimerSeconds = timerStats?.byDay?.[todayStr] ?? 0;
  const totalReviews = reviewData?.total ?? 0;
  const voiceRecords = voiceData?.items ?? [];
  const timerRecords = timerListData?.items ?? [];

  const streakDays = useMemo(() => {
    if (!timerStats?.byDay) return 0;
    const days = getLast7Days().reverse();
    let count = 0;
    for (const day of days) {
      if ((timerStats.byDay[day] ?? 0) > 0) {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  }, [timerStats?.byDay]);

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-5 md:py-6 space-y-5 md:space-y-6">
      {/* 欢迎区 */}
      <section className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-800 break-words">
           {greeting}，{displayName}
         </h1>
        <p className="text-sm text-gray-500">{dateStr}</p>
        <p className="text-sm text-indigo-500 flex items-start gap-1 mt-2 break-words">
           <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
           <span>{quote}</span>
         </p>
      </section>

      {/* 今日概览卡片 */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="今日语音"
          value={todayVoiceCount}
          unit="条"
          icon={<Mic className="w-4 h-4" />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
        />
        <StatCard
          label="今日专注"
          value={formatShortDuration(todayTimerSeconds)}
          icon={<Clock className="w-4 h-4" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard
          label="连续天数"
          value={streakDays}
          unit="天"
          icon={<Flame className="w-4 h-4" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
        <StatCard
          label="累计复盘"
          value={totalReviews}
          unit="份"
          icon={<FileText className="w-4 h-4" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
      </section>

      {/* 快捷操作 */}
      <section className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={`bg-gradient-to-br ${action.gradient} rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-white group`}
          >
            <div className="flex items-start justify-between">
              <div>{action.icon}</div>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-0.5 transition-transform" />
            </div>
             <div className="mt-6 min-w-0">
               <p className="font-semibold text-white break-words">{action.title}</p>
               <p className="text-xs text-white/70 mt-0.5 break-words">
                 {action.description}
               </p>
             </div>
          </Link>
        ))}
      </section>

      {/* 最近记录 */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">最近记录</h2>
          <Link
            to={activeTab === 'voice' ? '/voice' : '/timer'}
            className="text-xs text-indigo-500 flex items-center gap-0.5 hover:text-indigo-600 transition-colors"
          >
            查看全部
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex gap-1 mb-3 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'voice'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            语音记录
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'timer'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            计时记录
          </button>
        </div>

        <div className="min-h-[200px]">
          {activeTab === 'voice' ? (
            voiceRecords.length > 0 ? (
              <div>
                {voiceRecords.slice(0, 5).map((record: VoiceRecord) => (
                  <VoiceRecordItem key={record.id} record={record} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Mic}
                title="还没有语音记录"
                subtitle="开始第一条吧"
              />
            )
          ) : timerRecords.length > 0 ? (
            <div>
              {timerRecords.slice(0, 5).map((record: TimerRecord) => (
                <TimerRecordItem key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="还没有计时记录"
              subtitle="开始第一条吧"
            />
          )}
        </div>
      </section>

      {/* 本周行为趋势 */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          本周行为趋势
        </h2>
        <p className="text-xs text-gray-500 mb-4">近 7 天每日计时总时长</p>
        <WeeklyChart byDay={timerStats?.byDay ?? {}} />
      </section>
    </div>
  );
};

export default DashboardPage;
