import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import {
  CheckCircle2,
  ListTodo,
  Clock,
  Zap,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import * as reviewApi from '@client/src/api/review';

const getVar = (name: string): string =>
  typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'hsl(153 40% 32%)'
    : 'hsl(153 40% 32%)';

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/^hsl\(([^)]+)\)$/);
  if (match) return `hsla(${match[1]}, ${alpha})`;
  return color;
}

const periods: { key: 'week' | 'month' | 'all'; label: string }[] = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
];

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} 分钟`;
  return `${hours}小时${mins}分钟`;
}

const periodLabels: Record<string, string> = {
  week: '本周',
  month: '本月',
  all: '全部',
};

export default function ReviewPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['reviewData', period],
    queryFn: () => reviewApi.getReviewData(period),
  });

  const hasData = data && data.totalTasks > 0;
  const hasFocusData = data && data.totalFocusMinutes > 0;
  const hasAnyData = hasData || hasFocusData;

  const completionRate = data?.taskCompletionRate ?? 0;
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - completionRate);

  const barOption = useMemo(() => {
    const primary = getVar('--chart-1');
    const success = getVar('--chart-2');
    const warning = getVar('--chart-3');
    const border = getVar('--border');
    const mutedFg = getVar('--muted-foreground');
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['精力使用', '精力上限'],
        bottom: 0,
        textStyle: { color: mutedFg, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: { left: 36, right: 16, top: 12, bottom: 32 },
      xAxis: {
        type: 'category',
        data: data?.energyTrend.map((d) => d.date) ?? [],
        axisLine: { lineStyle: { color: withAlpha(border, 0.5), width: 1 } },
        axisTick: { show: false },
        axisLabel: { color: mutedFg, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '精力值',
        nameTextStyle: { color: mutedFg, fontSize: 10, padding: [0, 0, 0, -28] },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: withAlpha(border, 0.3), type: 'dashed', width: 1 } },
        axisLabel: { color: mutedFg, fontSize: 10 },
      },
      series: [
        {
          name: '精力使用',
          type: 'bar',
          data: data?.energyTrend.map((d) => d.used) ?? [],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: success },
                { offset: 1, color: primary },
              ],
            },
            borderRadius: [3, 3, 0, 0],
          },
          barWidth: '38%',
        },
        {
          name: '精力上限',
          type: 'line',
          data: data?.energyTrend.map((d) => d.limit) ?? [],
          lineStyle: { color: warning, width: 1.5, type: 'dashed' },
          itemStyle: { color: warning },
          symbol: 'circle',
          symbolSize: 4,
        },
      ],
    };
  }, [data]);

  const breakdownOption = useMemo(() => {
    const primary = getVar('--chart-1');
    const success = getVar('--chart-2');
    const border = getVar('--border');
    const mutedFg = getVar('--muted-foreground');
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: { left: 56, right: 16, top: 12, bottom: 24 },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: withAlpha(border, 0.3), type: 'dashed', width: 1 } },
        axisLabel: { color: mutedFg, fontSize: 10 },
      },
      yAxis: {
        type: 'category',
        data: data?.categoryBreakdown.map((c) => c.category).reverse() ?? [],
        axisLine: { lineStyle: { color: withAlpha(border, 0.5), width: 1 } },
        axisTick: { show: false },
        axisLabel: { color: mutedFg, fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: data?.categoryBreakdown.map((c) => c.count).reverse() ?? [],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: withAlpha(success, 0.38) },
                { offset: 1, color: primary },
              ],
            },
            borderRadius: [0, 3, 3, 0],
          },
          barWidth: '50%',
        },
      ],
    };
  }, [data]);

  return (
    <div className="p-3 md:p-5 space-y-4 bg-background min-h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-8 w-40 h-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <header className="relative">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="ink-dot mt-2 hidden sm:inline-block" />
            <div>
              <h1 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight">复盘</h1>
              <p className="text-xs text-muted-foreground mt-0.5">回顾你的精力管理与成长进度</p>
            </div>
          </div>

          <div className="relative inline-flex p-0.5 bg-card border border-border/60 rounded-full shadow-sm">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`relative px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                  period === p.key
                    ? 'text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {period === p.key && (
                  <span className="absolute inset-0 bg-primary rounded-full shadow-sm" />
                )}
                <span className="relative z-10">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="col-span-2 row-span-2 paper-card p-4">
            <div className="w-24 h-5 rounded-md bg-muted/40 animate-pulse mb-3" />
            <div className="flex items-center justify-center py-6">
              <div className="w-24 h-24 rounded-full bg-muted/30 animate-pulse" />
            </div>
          </div>
          <div className="paper-card p-3">
            <div className="w-16 h-4 rounded-md bg-muted/40 animate-pulse mb-2" />
            <div className="w-20 h-5 rounded-md bg-muted/40 animate-pulse" />
          </div>
          <div className="paper-card p-3">
            <div className="w-16 h-4 rounded-md bg-muted/40 animate-pulse mb-2" />
            <div className="w-20 h-5 rounded-md bg-muted/40 animate-pulse" />
          </div>
          <div className="col-span-2 paper-card p-3">
            <div className="w-24 h-4 rounded-md bg-muted/40 animate-pulse" />
          </div>
        </div>
      ) : !hasAnyData ? (
        <div className="paper-card">
          <div className="flex flex-col items-center justify-center py-10 md:py-14 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <BarChart3 className="w-7 h-7 text-muted-foreground/60" strokeWidth={1.75} />
            </div>
            <h3 className="font-serif-display text-base text-foreground mb-1.5">
              {periodLabels[period]}还没有数据
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              完成第一个任务、开启第一次专注后，这里会生成你的精力复盘数据，帮你看见每一步成长。
            </p>
            <div className="flex items-center gap-6 mt-5">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-success/60" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] text-muted-foreground">完成率</span>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning/60" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] text-muted-foreground">专注时长</span>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary/60" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] text-muted-foreground">精力趋势</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 auto-rows-min">
            <div className="col-span-2 row-span-2 paper-card paper-card-hover p-4 flex flex-col relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-success/15 blur-2xl pointer-events-none" />

              <div className="relative flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-success/30 bg-success/10 text-success">
                  <Sparkles className="w-3 h-3" strokeWidth={1.75} />
                  本期完成率
                </span>
              </div>

              <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 flex-1">
                <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="reviewCompletionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--success))" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="url(#reviewCompletionGradient)"
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="display-number text-2xl md:text-3xl text-foreground">
                      {`${Math.round(completionRate * 100)}%`}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">任务完成</span>
                  </div>
                </div>

                <div className="text-center md:text-left space-y-2">
                  <div>
                    <p className="eyebrow-label mb-0.5">总任务数</p>
                    <p className="display-number text-xl text-foreground">
                      {data?.totalTasks ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow-label mb-0.5">已完成</p>
                    <p className="display-number text-xl text-primary flex items-center gap-1.5 md:justify-start justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {data?.completedTasks ?? 0}
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-serif-display">
                      {completionRate >= 0.8
                        ? '表现出色，继续保持'
                        : completionRate >= 0.5
                        ? '稳步推进中，加油'
                        : '慢慢起步，积少成多'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 paper-card paper-card-hover p-3 flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <p className="eyebrow-label">总专注时长</p>
                <div className="w-7 h-7 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
              </div>
              <p className="display-number text-lg text-foreground">
                {formatMinutes(data?.totalFocusMinutes ?? 0)}
              </p>
            </div>

            <div className="col-span-1 paper-card paper-card-hover p-3 flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center justify-between">
                <p className="eyebrow-label">日均专注</p>
                <div className="w-7 h-7 rounded-lg bg-warning/20 text-warning flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
              </div>
              <p className="display-number text-lg text-foreground">
                {`${Math.round(data?.averageDailyFocusMinutes ?? 0)} 分钟`}
              </p>
            </div>

            <div className="col-span-2 md:col-span-2 paper-card paper-card-hover p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                <ListTodo className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <p className="eyebrow-label">总任务数</p>
                  <p className="display-number text-lg text-foreground mt-0.5">
                    {data?.totalTasks ?? 0}
                  </p>
                </div>
                <div>
                  <p className="eyebrow-label">已完成</p>
                  <p className="display-number text-lg text-primary mt-0.5">
                    {data?.completedTasks ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 paper-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="font-serif-display text-base md:text-lg text-foreground">精力消耗趋势</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">每日精力使用量与上限对比</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border border-primary/20 bg-primary/5 text-primary">
                    <Zap className="w-3 h-3" strokeWidth={1.75} />
                    趋势图
                  </span>
                </div>
                <ReactECharts option={barOption} style={{ height: 220 }} />
              </div>
            </div>

            <div className="paper-card overflow-hidden">
              <div className="p-4">
                <div className="mb-2">
                  <h2 className="font-serif-display text-base md:text-lg text-foreground">精力等级分布</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">各等级任务数量</p>
                </div>
                <ReactECharts option={breakdownOption} style={{ height: 220 }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
