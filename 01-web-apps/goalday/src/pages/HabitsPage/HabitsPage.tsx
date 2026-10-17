import { useState } from 'react';
import { Check, Flame, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useStored } from '@/data/store';
import { getWeekDays, toDateKey, todayKey, WEEKDAY_CN } from '@/lib/date';
import { calcStreak, weekProgress } from '@/lib/habit';
import { makeId } from '@/lib/id';
import type { IHabit } from '@/data/types';

const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];

export default function HabitsPage() {
  const [habits, setHabits] = useStored('habits', []);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [weekDays, setWeekDays] = useState<number[]>(ALL_WEEK);

  const today = new Date();
  const weekDaysArr = getWeekDays(today);
  const weekKeys = weekDaysArr.map(toDateKey);

  const totalDue = habits.reduce((sum, h) => sum + weekProgress(h, weekKeys).due, 0);
  const totalDone = habits.reduce((sum, h) => sum + weekProgress(h, weekKeys).done, 0);
  const rate = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0;

  function toggleCheck(habitId: string, key: string) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId ? { ...h, records: { ...h.records, [key]: !h.records[key] } } : h
      )
    );
  }

  function deleteHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const habit: IHabit = {
      id: makeId('h'),
      name: trimmed,
      weekDays: weekDays.length > 0 ? weekDays : ALL_WEEK,
      records: {},
      createdAt: Date.now(),
    };
    setHabits((prev) => [...prev, habit]);
    setName('');
    setWeekDays(ALL_WEEK);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">习惯</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">按周打卡，让坚持更简单</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          新建习惯
        </Button>
      </header>

      {habits.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          还没有习惯，点击「新建习惯」开始打卡吧
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">本周打卡</span>
              <span className="text-muted-foreground">
                {totalDone}/{totalDue} · {rate}%
              </span>
            </div>
            <Progress value={rate} className="h-2" />
          </Card>

          <div className="space-y-3">
            {habits.map((habit) => {
              const { due, done } = weekProgress(habit, weekKeys);
              const streak = calcStreak(habit, today);
              return (
                <Card key={habit.id} className="group p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{habit.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          本周 {done}/{due}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-accent" />
                          连续 {streak} 天
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {weekDaysArr.map((d, i) => {
                        const key = weekKeys[i];
                        const doneToday = !!habit.records[key];
                        const isToday = key === todayKey();
                        const isDue = habit.weekDays.includes(d.getDay());
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleCheck(habit.id, key)}
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-all',
                              doneToday
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                              isToday && 'ring-2 ring-primary/30',
                              !isDue && 'opacity-35'
                            )}
                            aria-label={`${WEEKDAY_CN[i]}${doneToday ? '已打卡' : '未打卡'}`}
                          >
                            {doneToday ? <Check className="h-4 w-4" strokeWidth={3} /> : WEEKDAY_CN[i]}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => deleteHabit(habit.id)}
                        className="ml-1 rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        aria-label="删除习惯"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建习惯</DialogTitle>
            <DialogDescription>设定每周的重复打卡日，固定 SOP 让坚持更简单</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="habit-name">习惯名称</Label>
              <Input
                id="habit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：晨间拉伸、23 点前睡觉"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>每周重复日</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={weekDays.map(String)}
                onValueChange={(vals) => setWeekDays(vals.map(Number))}
                className="flex flex-wrap justify-start"
              >
                {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
                  <ToggleGroupItem key={i} value={String(i)} aria-label={`周${d}`}>
                    {d}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  取消
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!name.trim()}>
                创建
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
