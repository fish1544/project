import { Circle, CheckCircle2, Clock, Trash2, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ITask } from '@/data/types';

interface TaskRowProps {
  task: ITask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLElement>, id: string) => void;
  onMoveToday?: (id: string) => void;
}

export default function TaskRow({ task, onToggle, onDelete, onDragStart, onMoveToday }: TaskRowProps) {
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, task.id) : undefined}
      className={cn(
        'group flex cursor-grab items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-secondary/60',
        !onDragStart && 'cursor-default'
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
        aria-label={task.done ? '标记未完成' : '标记完成'}
      >
        {task.done ? (
          <CheckCircle2 className="h-[18px] w-[18px] text-primary" />
        ) : (
          <Circle className="h-[18px] w-[18px]" />
        )}
      </button>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          task.done && 'text-muted-foreground line-through'
        )}
      >
        {task.title}
      </span>
      {task.time && (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {task.time}
        </span>
      )}
      {onMoveToday && (
        <button
          type="button"
          onClick={() => onMoveToday(task.id)}
          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
          aria-label="安排到今天"
          title="安排到今天"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        aria-label="删除任务"
        title="删除任务"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
