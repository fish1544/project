import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toDateKey, shortDate, WEEKDAY_CN, todayKey } from '@/lib/date';
import type { ITask } from '@/data/types';
import TaskRow from './TaskRow';

interface DayColumnProps {
  day: Date;
  tasks: ITask[];
  onQuickAdd: (dateKey: string, title: string) => void;
  onAdd: (dateKey: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveTask: (dateKey: string, taskId: string) => void;
}

export default function DayColumn({ day, tasks, onQuickAdd, onAdd, onToggle, onDelete, onMoveTask }: DayColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const key = toDateKey(day);
  const isToday = key === todayKey();
  const label = WEEKDAY_CN[(day.getDay() + 6) % 7];

  function commitQuickAdd() {
    const trimmed = draft.trim();
    if (trimmed) {
      onQuickAdd(key, trimmed);
      setDraft('');
      setAdding(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const id = e.dataTransfer.getData('text/task-id');
        if (id) onMoveTask(key, id);
      }}
      className={cn(
        'flex min-h-[190px] flex-col rounded-xl border bg-card p-3 transition-all',
        isOver && 'border-primary ring-2 ring-primary/25',
        isToday && 'border-primary/50'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div
          className={cn(
            'sticker-shadow inline-flex items-baseline gap-1.5 rounded-lg px-2.5 py-1',
            isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
          )}
        >
          <span className="text-sm font-medium">{label}</span>
          <span className={cn('text-xs', isToday ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
            {shortDate(day)}
          </span>
        </div>
      </div>
      <div className="paper-lines min-h-0 flex-1 space-y-0.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onDragStart={handleDragStart} />
        ))}
        {tasks.length === 0 && !adding && (
          <p className="px-2 pt-1 text-xs text-muted-foreground/70">拖入任务或点击下方添加</p>
        )}
      </div>

      {adding ? (
        <div className="mt-2 flex items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitQuickAdd();
              } else if (e.key === 'Escape') {
                setAdding(false);
                setDraft('');
              }
            }}
            onBlur={() => {
              setAdding(false);
              setDraft('');
            }}
            placeholder="输入任务，回车添加"
            className="h-8 text-xs"
            autoFocus
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setAdding(false);
              onAdd(key);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="带时间添加"
            title="带时间添加"
          >
            <Clock className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-1 self-start rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          添加任务
        </button>
      )}
    </div>
  );

  function handleDragStart(e: React.DragEvent<HTMLElement>, id: string) {
    e.dataTransfer.setData('text/task-id', id);
    e.dataTransfer.effectAllowed = 'move';
  }
}
