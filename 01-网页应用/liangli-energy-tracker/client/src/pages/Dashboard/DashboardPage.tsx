import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  CheckSquare,
  Timer,
  Lightbulb,
  Plus,
  Play,
  ChevronRight,
  Sparkles,
  Leaf,
} from 'lucide-react';
import { useAuth } from '@client/src/contexts/AuthContext';
import * as tasksApi from '@client/src/api/tasks';
import {
  getLoadStatusLabel,
  getLoadStatusColor,
} from '@client/src/api/tasks';
import * as focusApi from '@client/src/api/focus';
import * as growthApi from '@client/src/api/growth';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: energyLoad } = useQuery({
    queryKey: ['energyLoad'],
    queryFn: tasksApi.getEnergyLoad,
  });

  const { data: focusStats } = useQuery({
    queryKey: ['focusStats'],
    queryFn: focusApi.getFocusStats,
  });

  const { data: growthData } = useQuery({
    queryKey: ['growth', 'recent'],
    queryFn: () => growthApi.getGrowthList(),
  });

  const loadStatus = energyLoad?.loadStatus || 'light';
  const loadColor = getLoadStatusColor(loadStatus);
  const progressPercent = energyLoad
    ? Math.min((energyLoad.usedEnergy / energyLoad.totalEnergy) * 100, 100)
    : 0;

  const pendingCount = energyLoad?.pendingTasks?.length ?? 0;
  const completedCount = energyLoad?.completedTasks?.length ?? 0;
  const recentGrowth = (growthData?.items || []).slice(0, 3);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  })();

  // 圆形进度环计算
  const ringSize = 128;
  const ringStroke = 8;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPercent / 100) * ringCircumference;

  return (
    <div className="relative min-h-full bg-background overflow-hidden">
      {/* 背景光斑 */}
      <div className="absolute top-10 -left-16 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative p-3 sm:p-4 md:p-5 max-w-6xl mx-auto space-y-4 md:space-y-5">
        {/* ========== 问候区 ========== */}
        <section className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5">
              <span className="eyebrow-label">今日 · 量力</span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight leading-[1.05]">
              {greeting}，
              <br className="sm:hidden" />
              <span className="text-primary">
                {user?.nickname || user?.username || '朋友'}
              </span>
              <Sparkles
                className="w-5 h-5 inline ml-1.5 text-[hsl(var(--sun-500))] animate-breathe"
                strokeWidth={1.75}
              />
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              今天也要量力而行哦
              <Leaf
                className="w-3.5 h-3.5 inline ml-1 text-success"
                strokeWidth={1.75}
              />
            </p>
          </div>

          {/* 右侧用户头像 + 能量环 */}
          <div className="relative flex-shrink-0 hidden sm:block">
            <div className="relative w-14 h-14 md:w-16 md:h-16">
              <svg
                className="w-full h-full -rotate-90"
                viewBox={`0 0 ${ringSize * 0.75} ${ringSize * 0.75}`}
              >
                <circle
                  cx={ringSize * 0.375}
                  cy={ringSize * 0.375}
                  r={(ringSize * 0.75 - ringStroke) / 2}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={ringStroke}
                />
                <circle
                  cx={ringSize * 0.375}
                  cy={ringSize * 0.375}
                  r={(ringSize * 0.75 - ringStroke) / 2}
                  fill="none"
                  stroke={loadColor}
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={
                    2 * Math.PI * ((ringSize * 0.75 - ringStroke) / 2)
                  }
                  strokeDashoffset={
                    2 *
                    Math.PI *
                    ((ringSize * 0.75 - ringStroke) / 2) *
                    (1 - progressPercent / 100)
                  }
                  style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[hsl(var(--moss-100))] to-[hsl(var(--moss-200))] flex items-center justify-center text-secondary-foreground font-serif-display text-sm md:text-base shadow-sm animate-breathe"
                >
                  {(user?.nickname || user?.username || '?').charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== 快捷操作 Bento 区 ========== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3">
          {/* 左侧大卡片：添加任务 */}
          <button
            onClick={() => navigate('/app/tasks')}
            className="memo-card memo-card-hover sm:col-span-2 p-4 md:p-5 text-left cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-primary/12 to-primary/5 flex items-center justify-center text-primary">
                  <Plus className="w-5 h-5 md:w-[22px] md:h-[22px]" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-serif-display text-base md:text-lg text-foreground">
                    添加任务
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    规划今天的精力分配
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-105 transition-all duration-200">
                <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>
          </button>

          {/* 右侧上下两个小卡片 */}
          <div className="flex flex-col gap-3 md:gap-4">
            <button
              onClick={() => navigate('/app/focus')}
              className="memo-card memo-card-hover p-3.5 text-left cursor-pointer group relative overflow-hidden flex-1"
            >
              <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-primary/8 blur-xl pointer-events-none" />
              <div className="relative flex items-center gap-2.5 h-full">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Play className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-serif-display text-sm text-foreground">
                    开始专注
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    进入专注模式
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/app/growth')}
              className="memo-card memo-card-hover p-3.5 text-left cursor-pointer group relative overflow-hidden flex-1"
            >
              <div className="absolute -bottom-3 -left-3 w-14 h-14 rounded-full bg-accent/10 blur-xl pointer-events-none" />
              <div className="relative flex items-center gap-2.5 h-full">
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent-foreground flex-shrink-0">
                  <Lightbulb className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-serif-display text-sm text-foreground">
                    添加想法
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    存入成长池
                  </p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* ========== 精力负荷 — 视觉焦点大卡片 ========== */}
        <section
          onClick={() => navigate('/app/tasks')}
          className="paper-card paper-card-hover cursor-pointer relative overflow-hidden p-4 md:p-5"
        >
          {/* 装饰光斑 */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-5">
            {/* 左侧：大圆形进度环 */}
            <div className="relative flex-shrink-0">
              <svg
                className="w-28 h-28 md:w-36 md:h-36 -rotate-90"
                viewBox={`0 0 ${ringSize} ${ringSize}`}
              >
                {/* 轨道 */}
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={ringStroke}
                />
                {/* 进度 */}
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke={loadColor}
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="display-number text-2xl md:text-3xl"
                  style={{ color: loadColor }}
                >
                  {Math.round(progressPercent)}
                </span>
                <span className="eyebrow-label mt-1">
                  精力占比
                </span>
              </div>
            </div>

            {/* 右侧：详细信息 */}
            <div className="flex-1 min-w-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                <Zap
                  className="w-[18px] h-[18px]"
                  strokeWidth={1.75}
                  style={{ color: loadColor }}
                />
                <h3 className="font-serif-display text-base md:text-lg text-foreground">
                  今日精力负荷
                </h3>
              </div>

              <div className="flex items-baseline justify-center md:justify-start gap-1.5 mb-3">
                <span className="display-number text-xl md:text-2xl text-foreground">
                  {energyLoad?.usedEnergy ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {energyLoad?.totalEnergy ?? 0}
                </span>
                <span className="text-xs text-muted-foreground ml-0.5">
                  精力点
                </span>
              </div>

              {/* 有机胶囊状态标签 */}
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span
                  className="sticker-label sticker-label-sm"
                  style={{
                    color: loadColor,
                    backgroundColor: `${loadColor}10`,
                    borderColor: `${loadColor}40`,
                  }}
                >
                  {getLoadStatusLabel(loadStatus)}
                </span>
                {loadStatus === 'overload' && (
                  <span className="sticker-label sticker-label-sm text-destructive bg-destructive/10 border-destructive/30">
                    已超载，注意休息
                  </span>
                )}
              </div>

              {/* 小指标 */}
              <div className="flex items-center justify-center md:justify-start gap-5 mt-4">
                <div>
                  <div className="display-number text-lg text-foreground">
                    {pendingCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    待办任务
                  </div>
                </div>
                <div className="w-px h-6 bg-border/60" />
                <div>
                  <div className="display-number text-lg text-success">
                    {completedCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    已完成
                  </div>
                </div>
                <div className="w-px h-6 bg-border/60" />
                <div>
                  <div className="display-number text-lg text-foreground">
                    {pendingCount + completedCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    总任务
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== 专注 + 成长池 Bento 布局 ========== */}
        <section className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
          {/* 今日专注 — 占 2 列 */}
          <button
            onClick={() => navigate('/app/focus')}
            className="paper-card paper-card-hover md:col-span-2 p-4 text-left cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Timer className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-serif-display text-base text-foreground">
                    今日专注
                  </h3>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                  strokeWidth={1.75}
                />
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="display-number text-2xl md:text-3xl text-foreground">
                  {focusStats?.todayMinutes ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  分钟
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  累计专注{' '}
                  <span className="text-primary font-medium">
                    {focusStats?.totalMinutes ?? 0}
                  </span>{' '}
                  分钟
                  <span className="mx-1.5">·</span>
                  共{' '}
                  <span className="text-primary font-medium">
                    {focusStats?.totalSessions ?? 0}
                  </span>{' '}
                  次
                </p>
              </div>
            </div>
          </button>

          {/* 今日任务 — 占 3 列 */}
          <button
            onClick={() => navigate('/app/tasks')}
            className="paper-card paper-card-hover md:col-span-3 p-4 text-left cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent-foreground">
                    <CheckSquare
                      className="w-[18px] h-[18px]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="font-serif-display text-base text-foreground">
                    今日任务
                  </h3>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                  strokeWidth={1.75}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="text-center p-2.5 rounded-xl bg-muted/30">
                  <div className="display-number text-xl md:text-2xl text-foreground">
                    {pendingCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    待办
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-success/10">
                  <div className="display-number text-xl md:text-2xl text-success">
                    {completedCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    已完成
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-accent/15">
                  <div className="display-number text-xl md:text-2xl text-accent-foreground">
                    {pendingCount + completedCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    总计
                  </div>
                </div>
              </div>
            </div>
          </button>
        </section>

        {/* ========== 成长池卡片 ========== */}
        <section
          onClick={() => navigate('/app/growth')}
          className="paper-card paper-card-hover cursor-pointer group relative overflow-hidden p-4"
        >
          <div className="absolute -top-6 right-16 w-24 h-24 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-8 w-20 h-20 rounded-full bg-primary/5 blur-xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent-foreground">
                  <Lightbulb className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-serif-display text-base text-foreground">
                    成长池
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    最近的想法
                  </p>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                strokeWidth={1.75}
              />
            </div>

            {recentGrowth.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted/50">
                  <Lightbulb
                    className="w-4 h-4 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                </div>
                <p className="text-sm text-foreground/80">
                  还没有存下想法
                </p>
                <p className="text-xs text-muted-foreground">
                  想到什么先存进成长池，精力充足时再出发
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {recentGrowth.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 py-2 px-1 border-b border-border/30 last:border-b-0 transition-colors"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: item.isConverted
                          ? 'hsl(var(--success))'
                          : 'hsl(var(--warning))',
                      }}
                    />
                    <span className="text-sm text-foreground/80 truncate flex-1">
                      {item.title}
                    </span>
                    {item.isConverted && (
                      <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        已转化
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
