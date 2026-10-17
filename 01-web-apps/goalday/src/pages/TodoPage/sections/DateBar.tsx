import { addDays, format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseKey, toDateKey, todayKey, WEEKDAY_CN } from '@/lib/date';

interface DateBarProps {
  dateKey: string;
  onChange: (key: string) => void;
}

export default function DateBar({ dateKey, onChange }: DateBarProps) {
  const d = parseKey(dateKey);
  const isToday = dateKey === todayKey();

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-3 py-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(toDateKey(addDays(d, -1)))}
        aria-label="前一天"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button type="button" onClick={() => onChange(todayKey())} className="text-center">
        <p className={cn('text-sm font-semibold', isToday && 'text-primary')}>
          {format(d, 'M月d日')}
          {isToday && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              <CalendarCheck2 className="h-3 w-3" />
              今天
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{WEEKDAY_CN[(d.getDay() + 6) % 7]}</p>
      </button>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(toDateKey(addDays(d, 1)))}
          aria-label="后一天"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isToday && (
          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => onChange(todayKey())}>
            回今天
          </Button>
        )}
      </div>
    </div>
  );
}
