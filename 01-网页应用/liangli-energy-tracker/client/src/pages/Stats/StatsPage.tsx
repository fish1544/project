import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import {
  Clock,
  Target,
  Calendar,
  TrendingUp,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import * as focusApi from '@client/src/api/focus';

const getVar = (name: string): string =>
  typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'hsl(153 40% 32%)'
    : 'hsl(153 40% 32%)';

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/^hsl\(([^)]+)\)$/);
  if (match) return `hsla(${match[1]}, ${alpha})`;
  return color;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} 分钟`;
  return `${hours}小时${mins}分钟`;
}

export default function StatsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['focusStats'],
    queryFn: focusApi.getFocusStats,
  });

  const hasData = data && data.totalMinutes > 0;

  const dailyAverage = data
    ? data.totalMinutes / Math.max(1, data.weeklyData.length || 1)
    : 0;

  const lineOption = useMemo(() => {
    const primary = getVar('--chart-1');
    const chart2 = getVar('--chart-2');
    const border = getVar('--border');
    const mutedFg = getVar('--muted-foreground');
    const card = getVar('--card');
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: card,
        borderColor: border,
        borderWidth: 1,
        textStyle: { color: mutedFg, fontSize: 12 },
        formatter: '{b}<br/>专注时长：{c} 分钟',
      },
      grid: { left: 32, right: 16, top: 20, bottom: 24 },
      xAxis: {
        type: 'category',
        data: data?.weeklyData.map((d) => d.date) ?? [],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: mutedFg, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: '',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: withAlpha(border, 0.3), type: 'dashed' } },
        axisLabel: { color: mutedFg, fontSize: 11 },
      },
      series: [
        {
          type: 'line',
          data: data?.weeklyData.map((d) => d.minutes) ?? [],
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: primary, width: 2 },
          itemStyle: { color: primary, borderColor: card, borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: withAlpha(chart2, 0.2) },
                { offset: 1, color: withAlpha(chart2, 0.02) },
              ],
            },
          },
        },
      ],
    };
  }, [data]);

  const pieOption = useMemo(() => {
    const card = getVar('--card');
    const foreground = getVar('--foreground');
    const mutedFg = getVar('--muted-foreground');
    const palette = [
      getVar('--chart-1'),
      getVar('--chart-2'),
      getVar('--chart-3'),
      getVar('--chart-4'),
      getVar('--chart-5'),
    ];
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: card,
        borderColor: getVar('--border'),
        borderWidth: 1,
        textStyle: { color: mutedFg, fontSize: 12 },
        formatter: '{b}：{c} 分钟 ({d}%)',
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        textStyle: { color: mutedFg, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
      },
      series: [
        {
          type: 'pie',
          radius: ['48%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: card,
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: 500, color: foreground },
            scale: true,
            scaleSize: 4,
          },
          labelLine: { show: false },
          color: palette,
          data:
            data?.distribution.map((d) => ({
              value: d.minutes,
              name: d.category,
            })) ?? [],
        },
      ],
    };
  }, [data]);

  return (
    <div className="p-3 md:p-5 space-y-4 md:space-y-5 bg-background min-h-full">
      {/* Page Header */}
      <header className="relative">
        <div className="absolute -top-2 -left-2 w-24 h-24 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1 right-8 w-20 h-20 rounded-full bg-warning/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-2.5">
          <span className="ink-dot mt-3 hidden sm:inline-block" />
          <div>
            <h1 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight">数据看板</h1>
            <p className="text-xs text-muted-foreground mt-1">查看你的专注数据与成长轨迹</p>
          </div>
        </div>
      </header>

      {/* 统计数字卡片 */}
      {isError ? (
        <div className="paper-card">
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-destructive" strokeWidth={1.75} />
            </div>
            <h3 className="font-serif-display text-base text-foreground mb-1">
              数据加载失败
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              网络异常或服务暂时不可用，请稍后重试
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      ) : !isLoading && !hasData ? (
        <div className="paper-card">
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-muted-foreground/60" strokeWidth={1.75} />
            </div>
            <h3 className="font-serif-display text-base text-foreground mb-1">
              还没有专注数据
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              开启第一次专注后，这里会生成你的专注数据看板，记录每一次投入的时光。
            </p>
            <div className="flex items-center gap-5 mt-5">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-primary/50" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] text-muted-foreground">总时长</span>
              </div>
              <div className="w-px h-7 bg-border/50" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-success/50" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] text-muted-foreground">次数</span>
              </div>
              <div className="w-px h-7 bg-border/50" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-warning/50" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] text-muted-foreground">趋势</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* 主指标卡 */}
        <div className="col-span-2 row-span-2 paper-card paper-card-hover rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="relative flex flex-col h-full justify-between">
            <div>
              <p className="eyebrow-label mb-1">Total Focus</p>
              <p className="text-sm text-muted-foreground">累计专注时长</p>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="w-24 h-9 md:w-32 md:h-10 rounded-md bg-muted/40 animate-pulse" />
              ) : (
                <p className="display-number text-3xl md:text-4xl text-foreground tracking-tight">
                  {data?.totalMinutes ? formatMinutes(data.totalMinutes) : (
                    <span className="text-muted-foreground/40">--</span>
                  )}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} />
                日均{' '}
                {isLoading ? (
                  <span className="inline-block w-12 h-3.5 rounded bg-muted/40 animate-pulse align-middle" />
                ) : dailyAverage > 0 ? (
                  formatMinutes(dailyAverage)
                ) : (
                  <span className="text-muted-foreground/40">--</span>
                )}
              </p>
            </div>
            <div className="absolute bottom-2 right-3 opacity-10 pointer-events-none">
              <Clock className="w-12 h-12 md:w-16 md:h-16 text-primary" strokeWidth={1.75} />
            </div>
          </div>
        </div>

        {/* 累计专注次数 */}
        <div className="paper-card paper-card-hover rounded-xl p-3 flex flex-col justify-between min-h-[88px]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">累计专注次数</p>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Target className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          {isLoading ? (
            <div className="w-14 h-6 rounded-md bg-muted/40 animate-pulse" />
          ) : data?.totalSessions ? (
            <p className="display-number text-xl text-foreground">
              {data.totalSessions.toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1">次</span>
            </p>
          ) : (
            <p className="display-number text-xl text-muted-foreground/40">--</p>
          )}
        </div>

        {/* 今日专注 */}
        <div className="paper-card paper-card-hover rounded-xl p-3 flex flex-col justify-between min-h-[88px]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">今日专注</p>
            <div className="w-7 h-7 rounded-lg bg-warning/15 text-warning flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          {isLoading ? (
            <div className="w-16 h-6 rounded-md bg-muted/40 animate-pulse" />
          ) : data?.todayMinutes ? (
            <p className="display-number text-xl text-foreground">
              {formatMinutes(data.todayMinutes)}
            </p>
          ) : (
            <p className="display-number text-xl text-muted-foreground/40">--</p>
          )}
        </div>

        {/* 日均专注 */}
        <div className="col-span-2 md:col-span-2 paper-card paper-card-hover rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">日均专注时长</p>
            {isLoading ? (
              <div className="w-16 h-5 rounded-md bg-muted/40 animate-pulse mt-0.5" />
            ) : (
              <p className="display-number text-lg text-foreground mt-0.5">
                {formatMinutes(dailyAverage)}
              </p>
            )}
          </div>
        </div>
      </div>
      )}

       {/* 图表区域 */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* 折线图 */}
        <div className="lg:col-span-2 paper-card paper-card-hover rounded-xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-serif-display text-base text-foreground">专注趋势</h2>
                <p className="text-xs text-muted-foreground mt-0.5">最近 7 天专注时长</p>
              </div>
              <span className="text-xs text-primary/70 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" strokeWidth={1.75} />
                周趋势
              </span>
            </div>
            <ReactECharts option={lineOption} style={{ height: 220 }} />
          </div>
        </div>

        {/* 饼图 */}
        <div className="paper-card paper-card-hover rounded-xl overflow-hidden">
          <div className="p-4">
            <div className="mb-2">
              <h2 className="font-serif-display text-base text-foreground">专注分布</h2>
              <p className="text-xs text-muted-foreground mt-0.5">各分类占比</p>
            </div>
            <ReactECharts option={pieOption} style={{ height: 220 }} />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
