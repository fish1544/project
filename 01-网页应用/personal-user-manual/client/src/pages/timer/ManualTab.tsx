import { useCallback, useMemo, useState } from 'react';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  TIMER_CATEGORIES,
  type TimerCategory,
} from '@shared/api.interface';
import { timerApi } from '@client/src/api';

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

function toLocalDateTimeInput(date: Date): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

function fromLocalDateTimeInput(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}小时${minutes}分${secs}秒`;
}

interface ManualTabProps {
  onRecordSaved: () => void;
}

const ManualTab = ({ onRecordSaved }: ManualTabProps) => {
  const now = new Date();
  const defaultEnd = toLocalDateTimeInput(now);
  const defaultStart = toLocalDateTimeInput(new Date(now.getTime() - 30 * 60 * 1000));

  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState<TimerCategory>('work');
  const [startedAt, setStartedAt] = useState(defaultStart);
  const [endedAt, setEndedAt] = useState(defaultEnd);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const durationSeconds = useMemo(() => {
    const start = fromLocalDateTimeInput(startedAt);
    const end = fromLocalDateTimeInput(endedAt);
    if (!start || !end) return 0;
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    return Math.max(0, diff);
  }, [startedAt, endedAt]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccess(false);

    if (!taskName.trim()) {
      setError('请输入任务名称');
      return;
    }

    const start = fromLocalDateTimeInput(startedAt);
    const end = fromLocalDateTimeInput(endedAt);

    if (!start || !end) {
      setError('请选择有效的开始和结束时间');
      return;
    }

    if (end <= start) {
      setError('结束时间必须晚于开始时间');
      return;
    }

    const dur = Math.floor((end.getTime() - start.getTime()) / 1000);
    if (dur < 1) {
      setError('时长至少为 1 秒');
      return;
    }

    setSaving(true);
    try {
      await timerApi.createTimerRecord({
        taskName: taskName.trim(),
        category,
        durationSeconds: dur,
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        isManual: true,
        notes: notes.trim() || undefined,
      });

      setSuccess(true);
      setTaskName('');
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
      onRecordSaved();
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [taskName, category, startedAt, endedAt, notes, onRecordSaved]);

  return (
    <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-200 space-y-5">
      <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
         <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
         <div className="min-w-0">
           <p className="text-sm font-medium text-indigo-900 break-words">
             忘记启动计时？手动补录一条
           </p>
           <p className="text-xs text-indigo-600 mt-1 break-words">
             填写任务信息和时间范围，即可补录过去的计时记录
           </p>
         </div>
       </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            任务名称 <span className="text-red-500">*</span>
          </label>
          <Input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="例如：阅读《原则》第三章"
            className="h-11 rounded-lg"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            分类
          </label>
          <Select
            value={category}
            onValueChange={(v: string) => setCategory(v as TimerCategory)}
          >
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              开始时间 <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="h-11 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              结束时间 <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className="h-11 rounded-lg"
            />
          </div>
        </div>

         <div className="p-4 bg-gray-50 rounded-lg">
           <p className="text-sm text-gray-500 mb-1">计算时长</p>
           <p className="text-lg sm:text-xl font-semibold text-gray-800 font-mono break-all">
             {formatDuration(durationSeconds)}
           </p>
         </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            备注（可选）
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="记录一下这段时间做了什么..."
            className="min-h-[100px] rounded-lg resize-none"
            maxLength={2000}
          />
        </div>

         {error && (
           <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 break-words">
             {error}
           </div>
         )}

         {success && (
           <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600 break-words">
             记录已保存！
           </div>
         )}

        <Button
          onClick={handleSubmit}
          size="lg"
          className="w-full h-12 rounded-xl text-base"
          disabled={saving}
        >
          <PlusCircle className="w-5 h-5" />
          {saving ? '保存中...' : '保存记录'}
        </Button>
      </div>
    </div>
  );
};

export default ManualTab;
