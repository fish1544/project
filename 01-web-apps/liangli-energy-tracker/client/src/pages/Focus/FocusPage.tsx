import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Square,
  Timer,
  Clock,
  CheckCircle2,
  Target,
  Leaf,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as focusApi from '@client/src/api/focus';
import { formatDuration } from '@client/src/api/focus';
import * as tasksApi from '@client/src/api/tasks';
import type { FocusRecord } from '@shared/api.interface';

const POMODORO_OPTIONS = [
  { value: 25, label: '25 分钟' },
  { value: 30, label: '30 分钟' },
  { value: 45, label: '45 分钟' },
  { value: 60, label: '60 分钟' },
];

export default function FocusPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'pomodoro' | 'free'>('free');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const intervalRef = useRef<number | null>(null);

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'pending'],
    queryFn: () => tasksApi.getTasks({ status: 'pending' }),
  });

  const { data: stats } = useQuery({
    queryKey: ['focusStats'],
    queryFn: focusApi.getFocusStats,
  });

  const { data: recordsData } = useQuery({
    queryKey: ['focusRecords'],
    queryFn: () => focusApi.getFocusRecords(),
  });

  const startMutation = useMutation({
    mutationFn: focusApi.startFocus,
    onSuccess: (record) => {
      setRecordId(record.id);
      setIsRunning(true);
    },
    onError: () => {
      toast.error('开始专注失败');
    },
  });

  const endMutation = useMutation({
    mutationFn: focusApi.endFocus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusStats'] });
      queryClient.invalidateQueries({ queryKey: ['focusRecords'] });
      toast.success('专注记录已保存');
      resetTimer();
    },
    onError: () => {
      toast.error('结束专注失败');
    },
  });

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        if (mode === 'pomodoro') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleEnd(true);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode]);

  const handleStart = () => {
    const durationSeconds = mode === 'pomodoro' ? pomodoroMinutes * 60 : undefined;
    startMutation.mutate({
      mode,
      durationSeconds,
      taskId: selectedTaskId || undefined,
    });
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    if (recordId) {
      setIsRunning(true);
    }
  };

  const handleEnd = (isCompleted: boolean = false) => {
    if (!recordId) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);

    let actualDuration: number;
    if (mode === 'pomodoro') {
      actualDuration = pomodoroMinutes * 60 - timeLeft;
    } else {
      actualDuration = elapsedSeconds;
    }

    if (actualDuration < 10) {
      toast.info('专注时间太短，不保存记录');
      resetTimer();
      return;
    }

    endMutation.mutate({ recordId, isCompleted });

    if (mode === 'pomodoro' && isCompleted) {
      toast.success('🎉 番茄钟完成！干得漂亮');
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRecordId(null);
    if (mode === 'pomodoro') {
      setTimeLeft(pomodoroMinutes * 60);
    } else {
      setElapsedSeconds(0);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleModeChange = (newMode: 'pomodoro' | 'free') => {
    if (isRunning || recordId) {
      toast.info('请先结束当前专注');
      return;
    }
    setMode(newMode);
    if (newMode === 'pomodoro') {
      setTimeLeft(pomodoroMinutes * 60);
    } else {
      setElapsedSeconds(0);
    }
  };

  const handleDurationChange = (value: string) => {
    if (isRunning || recordId) return;
    const mins = Number(value);
    setPomodoroMinutes(mins);
    setTimeLeft(mins * 60);
  };

  const displayTime = mode === 'pomodoro'
    ? formatDuration(timeLeft)
    : formatDuration(elapsedSeconds);

  const recentRecords = (recordsData?.items || []).slice(0, 5);
  const pendingTasks = tasksData?.items || [];

  // Calculate progress for pomodoro ring (r=100 for thick stroke)
  const RING_RADIUS = 100;
  const progressPercent = mode === 'pomodoro'
    ? ((pomodoroMinutes * 60 - timeLeft) / (pomodoroMinutes * 60)) * 100
    : 0;
  const circumference = 2 * Math.PI * RING_RADIUS;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="p-3 md:p-5 space-y-4 md:space-y-5 min-h-full bg-background">
      {/* Page Header */}
      <header className="relative">
        <div className="absolute -top-2 -left-2 w-24 h-24 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1 right-4 w-20 h-20 rounded-full bg-warning/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-2.5">
          <span className="ink-dot mt-3 hidden sm:inline-block" />
          <div>
            <h1 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight">
              专注<span className="text-primary">林间</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-primary/70" strokeWidth={1.75} />
              深呼吸，让思绪慢下来
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* ========== Timer Card — 林间静坐核心区 ========== */}
        <div className="lg:col-span-2">
          <div className="paper-card rounded-2xl overflow-hidden relative">
            {/* 柔和光斑（2 个，克制） */}
            <div className="absolute -top-10 -left-6 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -right-4 w-32 h-32 rounded-full bg-warning/10 blur-3xl pointer-events-none" />

            <div className="relative p-4 sm:p-5 md:p-7">
              {/* 计时器主体 */}
              <div className="flex flex-col items-center">
                <div className={`relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center mb-5 md:mb-6 ${isRunning ? 'animate-breathe' : ''}`}>
                  {/* 外圈柔和光晕 */}
                  <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl scale-105" />

                  {mode === 'pomodoro' ? (
                    <>
                      {/* 进度环 */}
                      <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
                        {/* 轨道环 */}
                        <circle
                          cx="110"
                          cy="110"
                          r="100"
                          stroke="hsl(var(--border))"
                          strokeWidth="6"
                          fill="none"
                        />
                        {/* 进度环 */}
                        <circle
                          cx="110"
                          cy="110"
                          r={RING_RADIUS}
                          stroke="hsl(var(--primary))"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-1000 ease-linear"
                          style={{
                            filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.25))',
                          }}
                        />
                        {/* 内圈装饰细线 */}
                        <circle
                          cx="110"
                          cy="110"
                          r="86"
                          stroke="hsl(var(--border) / 0.8)"
                          strokeWidth="1"
                          fill="none"
                          strokeDasharray="2 6"
                          opacity="0.5"
                        />
                      </svg>

                      {/* 中心时间显示 */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="display-number text-3xl sm:text-4xl md:text-5xl text-foreground tabular-nums">
                          {displayTime}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-1.5 font-serif italic">
                          剩余时间
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 自由计时：圆环 */}
                      <div className="absolute inset-0 rounded-full border-[6px] border-border" />
                      <div
                        className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-primary/60 border-r-primary/80"
                        style={{
                          animation: isRunning ? 'spin 4s linear infinite' : 'none',
                        }}
                      />
                      {/* 内圈虚线装饰 */}
                      <div className="absolute inset-8 rounded-full border border-dashed border-border" />

                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card rounded-full m-3">
                        <span className="display-number text-3xl sm:text-4xl md:text-5xl text-foreground tabular-nums">
                          {displayTime}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-1.5 font-serif italic">
                          已专注
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* 模式切换：有机胶囊 Tabs */}
                <div className="w-full max-w-[260px] mb-4">
                  <div className="relative flex p-1 bg-muted/40 rounded-full border border-border/60">
                    <div
                      className="absolute top-1 bottom-1 w-1/2 bg-card rounded-full shadow-sm transition-all duration-200 ease-out"
                      style={{
                        left: mode === 'free' ? '4px' : 'calc(50% - 2px)',
                        width: 'calc(50% - 4px)',
                      }}
                    />
                    <button
                      onClick={() => handleModeChange('free')}
                      className="relative flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors duration-200 z-10"
                      style={{ color: mode === 'free' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                    >
                      <Leaf className="w-3.5 h-3.5" strokeWidth={1.75} />
                      自由计时
                    </button>
                    <button
                      onClick={() => handleModeChange('pomodoro')}
                      className="relative flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors duration-200 z-10"
                      style={{ color: mode === 'pomodoro' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                    >
                      <Timer className="w-3.5 h-3.5" strokeWidth={1.75} />
                      番茄钟
                    </button>
                  </div>
                </div>

                {/* 番茄钟时长选择 */}
                {mode === 'pomodoro' && !isRunning && !recordId && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                    <span className="text-xs text-muted-foreground mr-1 font-serif italic">
                      时长：
                    </span>
                    {POMODORO_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleDurationChange(String(opt.value))}
                        className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                          pomodoroMinutes === opt.value
                            ? 'bg-primary/12 text-primary font-medium border border-primary/25'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 控制按钮区 */}
                <div className="flex items-center gap-2.5 mb-4">
                  {!isRunning && !recordId && (
                    <Button
                      onClick={handleStart}
                      disabled={startMutation.isPending}
                      className="h-9 px-4 rounded-lg text-sm font-medium gap-2 shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 bg-primary text-primary-foreground"
                    >
                      <Play className="w-4 h-4" strokeWidth={1.75} />
                      <span>开始专注</span>
                    </Button>
                  )}
                  {isRunning && (
                    <>
                      {/* 暂停按钮：圆形次按钮 */}
                      <Button
                        onClick={handlePause}
                        variant="outline"
                        className="h-11 w-11 rounded-full p-0 border border-border text-foreground hover:bg-muted/30 transition-all duration-200 bg-card"
                      >
                        <Pause className="w-4 h-4" strokeWidth={1.75} />
                      </Button>
                      {/* 停止按钮：圆形主按钮（暖色调） */}
                      <Button
                        onClick={() => handleEnd(false)}
                        className="h-11 w-11 rounded-full p-0 shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 bg-destructive text-destructive-foreground"
                      >
                        <Square className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </Button>
                    </>
                  )}
                  {!isRunning && recordId && (
                    <>
                      <Button
                        onClick={handleResume}
                        className="h-9 px-4 rounded-lg text-sm font-medium gap-2 shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 bg-primary text-primary-foreground"
                      >
                        <Play className="w-4 h-4" strokeWidth={1.75} />
                        <span>继续</span>
                      </Button>
                      <Button
                        onClick={() => handleEnd(false)}
                        variant="outline"
                        className="h-9 px-4 rounded-lg border border-border text-foreground hover:bg-muted/30 transition-colors bg-card text-sm font-medium"
                      >
                        结束
                      </Button>
                    </>
                  )}
                </div>

                {/* 任务关联选择器 */}
                {(!isRunning || !recordId) && (
                  <div className="w-full max-w-sm">
                    <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-primary/70" strokeWidth={1.75} />
                      <span>关联任务（可选）</span>
                    </label>
                    <div className="relative">
                      <Select
                        value={selectedTaskId}
                        onValueChange={setSelectedTaskId}
                        disabled={isRunning}
                      >
                        <SelectTrigger className="w-full h-9 border-border/60 bg-muted/30 rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200">
                          <SelectValue placeholder="选择一个任务，锚定你的专注" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-border/60 bg-card shadow-md">
                          {pendingTasks.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center font-serif italic">
                              暂无待办任务
                            </div>
                          ) : (
                            pendingTasks.map((task) => (
                              <SelectItem
                                key={task.id}
                                value={task.id}
                                className="text-sm"
                              >
                                {task.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========== 右侧统计与记录 ========== */}
        <div className="space-y-4 md:space-y-5">
          {/* 今日统计卡片 */}
          <div className="paper-card paper-card-hover rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="font-serif-display text-base text-foreground">
                今日统计
              </h3>
            </div>

            {/* 主指标 */}
            <div className="mb-3">
              <p className="eyebrow-label mb-1">Today&apos;s Focus</p>
              <div className="flex items-baseline gap-1">
                <span className="display-number text-3xl text-foreground">
                  {stats?.todayMinutes ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">分钟</span>
              </div>
            </div>

            {/* 次级指标：两列 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">专注次数</p>
                <span className="display-number text-lg text-primary">
                  {stats?.totalSessions ?? 0}
                </span>
                <span className="text-xs text-muted-foreground ml-0.5">次</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">累计时长</p>
                <span className="display-number text-lg text-primary">
                  {stats?.totalMinutes ?? 0}
                </span>
                <span className="text-xs text-muted-foreground ml-0.5">分钟</span>
              </div>
            </div>
          </div>

          {/* 最近记录 */}
          <div className="paper-card paper-card-hover rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-warning" strokeWidth={1.75} />
              </div>
              <h3 className="font-serif-display text-base text-foreground">
                最近记录
              </h3>
            </div>

            {recentRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <p className="text-xs text-muted-foreground">
                  还没有专注记录
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentRecords.map((record: FocusRecord) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted/30 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                          record.mode === 'pomodoro'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-primary/12 text-primary'
                        }`}
                      >
                        {record.mode === 'pomodoro'
                          ? <Timer className="w-3 h-3" strokeWidth={1.75} />
                          : <Leaf className="w-3 h-3" strokeWidth={1.75} />
                        }
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground/80 truncate">
                          {record.mode === 'pomodoro' ? '番茄钟' : '自由计时'}
                        </p>
                        {record.taskId && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Target className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                            已关联任务
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="display-number text-base text-foreground tabular-nums">
                        {Math.floor(record.durationSeconds / 60)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-0.5">分</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部装饰：林间小语 */}
          <div className="text-center py-1">
            <p className="text-xs text-muted-foreground/70 font-serif italic">
              「专注不是强迫自己，而是温柔地回到当下」
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
