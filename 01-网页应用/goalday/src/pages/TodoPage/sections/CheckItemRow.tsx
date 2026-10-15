import { Check, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getCategoryMeta } from '@/lib/category';
import type { ITodoItem } from '@/data/types';

interface CheckItemRowProps {
  item: ITodoItem;
  categoryIndex: number;
  dateKey: string; // 当前打卡的日期
  weekDone: number;
  weekDue: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CheckItemRow({
  item,
  categoryIndex,
  dateKey,
  weekDone,
  weekDue,
  onToggle,
  onDelete,
}: CheckItemRowProps) {
  const meta = getCategoryMeta(item.category, categoryIndex);
  const Icon = meta.icon;
  const checkin = item.checkins.find((c) => c.date === dateKey);
  const done = !!checkin;
  const lastCheckin = item.checkins[item.checkins.length - 1];
  const rate = weekDue > 0 ? Math.round((weekDone / weekDue) * 100) : 0;

  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary/50">
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          done
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/35 bg-background text-transparent hover:border-primary hover:text-primary/50'
        )}
        aria-label={done ? `取消 ${dateKey} 打卡` : `${dateKey} 打卡`}
      >
        <Check className="h-4 w-4" strokeWidth={3.5} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm font-medium',
              done && 'text-muted-foreground line-through decoration-muted-foreground/50'
            )}
          >
            {item.name}
          </span>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `hsl(from ${meta.color} h s l / 0.12)`, color: meta.color }}
          >
            <Icon className="h-3 w-3" />
            {item.category}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <Progress value={rate} className="h-1 w-24" />
          <span className="text-[11px] text-muted-foreground">
            本周 {weekDone}/{weekDue}
          </span>
          {checkin ? (
            <span className="flex items-center gap-1 text-[11px] text-primary">
              <Check className="h-3 w-3" strokeWidth={3} />
              {dateKey.slice(5)} {checkin.doneAt} 完成
            </span>
          ) : (
            lastCheckin && (
              <span className="text-[11px] text-muted-foreground/70">
                上次 {lastCheckin.date.slice(5)} {lastCheckin.doneAt}
              </span>
            )
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        aria-label="删除清单项"
        title="删除清单项"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
