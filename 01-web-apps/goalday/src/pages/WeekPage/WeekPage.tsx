import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useStored } from '@/data/store';
import { getWeekDays, toDateKey, todayKey, parseKey, WEEKDAY_CN } from '@/lib/date';
import { makeId, nowTs } from '@/lib/id';
import type { ITask } from '@/data/types';
import DayColumn from './sections/DayColumn';
import TaskPool from './sections/TaskPool';

type AddTarget = { kind: 'day'; date: string } | { kind: 'pool' } | null;

export default function WeekPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [tasks, setTasks] = useStored('tasks', []);
  const [addTarget, setAddTarget] = useState<AddTarget>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  const weekDays = getWeekDays(anchor);
  const weekKeys = weekDays.map(toDateKey);
  const dayTasksMap: Record<string, ITask[]> = {};
  for (const k of weekKeys) dayTasksMap[k] = [];
  for (const t of tasks) {
    if (t.date && dayTasksMap[t.date]) dayTasksMap[t.date].push(t);
  }
  const poolTasks = tasks.filter((t) => !t.date);

  const addTargetDesc = (() => {
    if (!addTarget) return '';
    if (addTarget.kind === 'pool') return '加入待办池，稍后可拖入周计划任意一天';
    const d = parseKey(addTarget.date);
    return `安排到 ${WEEKDAY_CN[(d.getDay() + 6) % 7]} ${format(d, 'M月d日')}`;
  })();

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function moveTask(dateKey: string, taskId: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, date: dateKey } : t)));
  }

  function moveToToday(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, date: todayKey() } : t)));
  }

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed || !addTarget) return;
    const task: ITask = {
      id: makeId('t'),
      title: trimmed,
      date: addTarget.kind === 'day' ? addTarget.date : null,
      time: time || null,
      done: false,
      createdAt: nowTs(),
    };
    setTasks((prev) => [...prev, task]);
    setTitle('');
    setTime('');
    setAddTarget(null);
  }

  function quickAdd(dateKey: string, taskTitle: string) {
    const task: ITask = {
      id: makeId('t'),
      title: taskTitle,
      date: dateKey,
      time: null,
      done: false,
      createdAt: nowTs(),
    };
    setTasks((prev) => [...prev, task]);
  }

  function quickAddPool(taskTitle: string) {
    const task: ITask = {
      id: makeId('t'),
      title: taskTitle,
      date: null,
      time: null,
      done: false,
      createdAt: nowTs(),
    };
    setTasks((prev) => [...prev, task]);
  }

  function closeDialog() {
    setAddTarget(null);
    setTitle('');
    setTime('');
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">周计划</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {format(weekDays[0], 'M月d日')} - {format(weekDays[6], 'M月d日')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnchor((a) => addDays(a, -7))}
            aria-label="上一周"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setAnchor(new Date())}>
            本周
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnchor((a) => addDays(a, 7))}
            aria-label="下一周"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {weekDays.map((day) => (
            <DayColumn
              key={toDateKey(day)}
              day={day}
              tasks={dayTasksMap[toDateKey(day)] ?? []}
              onQuickAdd={quickAdd}
              onAdd={(k) => setAddTarget({ kind: 'day', date: k })}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onMoveTask={moveTask}
            />
          ))}
        </div>
        <aside className="w-full shrink-0 lg:w-72">
          <TaskPool
            tasks={poolTasks}
            onQuickAdd={quickAddPool}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onMoveToday={moveToToday}
          />
        </aside>
      </div>

      <Dialog open={addTarget !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加任务</DialogTitle>
            <DialogDescription>{addTargetDesc}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="task-title">任务</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="要做什么？"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-time">时间（可选）</Label>
              <Input id="task-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  取消
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!title.trim()}>
                添加
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
