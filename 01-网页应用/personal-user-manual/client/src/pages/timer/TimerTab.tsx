import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import {
  TIMER_CATEGORIES,
  type TimerCategory,
} from '@shared/api.interface';
import { timerApi } from '@client/src/api';

const STORAGE_KEY = 'timer-runtime-state';
const CATEGORY_LABELS: Record<TimerCategory, string> = {
  work: '工作',
  study: '学习',
  creative: '创作',
  rest: '休息',
  exercise: '运动',
  social: '社交',
  outdoor: '出门',
  other: '其他',
};

interface RuntimeState {
  taskName: string;
  category: TimerCategory;
  accumulatedMs: number;
  startedAt: number | null; // timestamp when current running segment started
  isRunning: boolean;
}

function loadState(): RuntimeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RuntimeState;
      if (parsed && typeof parsed.accumulatedMs === 'number') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    taskName: '',
    category: 'work',
    accumulatedMs: 0,
    startedAt: null,
    isRunning: false,
  };
}

function saveState(state: RuntimeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getCurrentMs(state: RuntimeState, now: number): number {
  let ms = state.accumulatedMs;
  if (state.isRunning && state.startedAt != null) {
    ms += now - state.startedAt;
  }
  return Math.max(0, ms);
}

interface TimerTabProps {
  onRecordSaved: () => void;
}

const TimerTab = ({ onRecordSaved }: TimerTabProps) => {
  const [state, setState] = useState<RuntimeState>(() => loadState());
  const [displaySeconds, setDisplaySeconds] = useState<number>(() => {
    const s = loadState();
    return Math.floor(getCurrentMs(s, Date.now()) / 1000);
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Persist state to localStorage on change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Tick effect for running timer
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = window.setInterval(() => {
        setState((prev) => {
          const ms = getCurrentMs(prev, Date.now());
          setDisplaySeconds(Math.floor(ms / 1000));
          return prev;
        });
      }, 1000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Update display one final time when paused
      const ms = getCurrentMs(state, Date.now());
      setDisplaySeconds(Math.floor(ms / 1000));
    }
  }, [state.isRunning]);

  // Sync display on mount / state changes that affect accumulated time
  useEffect(() => {
    const ms = getCurrentMs(state, Date.now());
    setDisplaySeconds(Math.floor(ms / 1000));
  }, [state.accumulatedMs]);

  const handleStart = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning) return prev;
      return {
        ...prev,
        isRunning: true,
        startedAt: Date.now(),
      };
    });
  }, []);

  const handlePause = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning) return prev;
      const now = Date.now();
      const elapsed = prev.startedAt != null ? now - prev.startedAt : 0;
      return {
        ...prev,
        isRunning: false,
        startedAt: null,
        accumulatedMs: prev.accumulatedMs + elapsed,
      };
    });
  }, []);

  const handleStop = useCallback(() => {
    // Finalize current running segment
    setState((prev) => {
      if (!prev.isRunning) return prev;
      const now = Date.now();
      const elapsed = prev.startedAt != null ? now - prev.startedAt : 0;
      return {
        ...prev,
        isRunning: false,
        startedAt: null,
        accumulatedMs: prev.accumulatedMs + elapsed,
      };
    });
    setShowConfirm(true);
  }, []);

  const handleConfirmSave = useCallback(async () => {
    const finalMs = getCurrentMs(state, Date.now());
    const totalSeconds = Math.floor(finalMs / 1000);

    if (totalSeconds < 1) {
      setShowConfirm(false);
      return;
    }

    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - totalSeconds * 1000);

    setSaving(true);
    try {
      await timerApi.createTimerRecord({
        taskName: state.taskName || '未命名任务',
        category: state.category,
        durationSeconds: totalSeconds,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        isManual: false,
      });

      // Reset timer
      setState({
        taskName: state.taskName,
        category: state.category,
        accumulatedMs: 0,
        startedAt: null,
        isRunning: false,
      });
      setDisplaySeconds(0);
      setShowConfirm(false);
      onRecordSaved();
    } catch {
      // error logged by api
    } finally {
      setSaving(false);
    }
  }, [state, onRecordSaved]);

  const handleCancelSave = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleReset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      accumulatedMs: 0,
      startedAt: null,
      isRunning: false,
    }));
    setDisplaySeconds(0);
  }, []);

  const handleTaskNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({ ...prev, taskName: e.target.value }));
    },
    [],
  );

  const handleCategoryChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, category: value as TimerCategory }));
  }, []);

  const totalSeconds = displaySeconds;

  return (
    <div className="flex flex-col gap-6">
      {/* Timer Display */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200 text-center overflow-hidden">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-indigo-600" />
        </div>
        <div
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-indigo-600 font-mono mb-2 tabular-nums tracking-tight whitespace-nowrap"
          data-testid="timer-display"
        >
          {formatDuration(totalSeconds)}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {state.isRunning
            ? '正在计时中...'
            : totalSeconds > 0
              ? '已暂停'
              : '点击开始按钮开始计时'}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!state.isRunning ? (
            <Button
              onClick={handleStart}
              size="lg"
              className="rounded-xl h-12 px-8 text-base"
            >
              <Play className="w-5 h-5" />
              {totalSeconds > 0 ? '继续' : '开始'}
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="secondary"
              size="lg"
              className="rounded-xl h-12 px-8 text-base"
            >
              <Pause className="w-5 h-5" />
              暂停
            </Button>
          )}
          <Button
            onClick={handleStop}
            variant="outline"
            size="lg"
            className="rounded-xl h-12 px-8 text-base"
            disabled={totalSeconds === 0 && !state.isRunning}
          >
            <Square className="w-5 h-5" />
            结束
          </Button>
          {totalSeconds > 0 && !state.isRunning && (
            <Button
              onClick={handleReset}
              variant="ghost"
              size="lg"
              className="rounded-xl h-12 px-6 text-sm text-gray-500"
            >
              重置
            </Button>
          )}
        </div>
      </div>

      {/* Task Info */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-base font-semibold text-gray-800">任务信息</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              任务名称
            </label>
            <Input
              value={state.taskName}
              onChange={handleTaskNameChange}
              placeholder="例如：写项目文档"
              className="h-11 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              分类
            </label>
            <Select value={state.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full h-11 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMER_CATEGORIES.map((cat: TimerCategory) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>保存计时记录</DialogTitle>
            <DialogDescription>
              确认保存本次计时记录吗？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="text-4xl font-bold text-indigo-600 font-mono mb-2">
              {formatDuration(totalSeconds)}
            </div>
            <p className="text-sm text-gray-500">
              {state.taskName || '未命名任务'} · {CATEGORY_LABELS[state.category]}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelSave}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={handleConfirmSave} disabled={saving}>
              {saving ? '保存中...' : '确认保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimerTab;
