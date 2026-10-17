import { useState } from 'react';
import { Check, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStored } from '@/data/store';
import { getWeekDays, toDateKey, parseKey, todayKey, nowTime } from '@/lib/date';
import { makeId, nowTs } from '@/lib/id';
import { getCategoryMeta } from '@/lib/category';
import type { ITodoItem } from '@/data/types';
import type { IInspiration } from '@/data/inspirations';
import DateBar from './sections/DateBar';
import CheckItemRow from './sections/CheckItemRow';
import InspirationPanel from './sections/InspirationPanel';

const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];

export default function TodoPage() {
  const [todos, setTodos] = useStored('todos', []);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [repeat, setRepeat] = useState<number[]>(ALL_WEEK);
  const [dateKey, setDateKey] = useState(() => todayKey());

  const today = new Date();
  const weekKeys = getWeekDays(today).map(toDateKey);
  const tKey = todayKey();
  const todayDow = today.getDay();

  // 今日总览（固定统计今天）
  const dueToday = todos.filter((t) => t.repeat.includes(todayDow));
  const doneTodayCount = dueToday.filter((t) => t.checkins.some((c) => c.date === tKey)).length;
  const todayRate = dueToday.length > 0 ? Math.round((doneTodayCount / dueToday.length) * 100) : 0;

  // 本周合计
  const weekDueAll = todos.reduce((sum, t) => {
    return sum + weekKeys.filter((k) => t.repeat.includes(parseKey(k).getDay())).length;
  }, 0);
  const weekDoneAll = todos.reduce((sum, t) => sum + t.checkins.filter((c) => weekKeys.includes(c.date)).length, 0);
  const weekRate = weekDueAll > 0 ? Math.round((weekDoneAll / weekDueAll) * 100) : 0;

  const categories = [...new Set(todos.map((t) => t.category))];

  function toggleOn(id: string) {
    setTodos((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const has = item.checkins.some((c) => c.date === dateKey);
        if (has) {
          return { ...item, checkins: item.checkins.filter((c) => c.date !== dateKey) };
        }
        return { ...item, checkins: [...item.checkins, { date: dateKey, doneAt: nowTime() }] };
      })
    );
  }

  function deleteItem(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const item: ITodoItem = {
      id: makeId('td'),
      name: trimmed,
      category: category.trim() || '生活',
      repeat: repeat.length > 0 ? repeat : ALL_WEEK,
      checkins: [],
      createdAt: nowTs(),
    };
    setTodos((prev) => [...prev, item]);
    setName('');
    setCategory('');
    setRepeat(ALL_WEEK);
    setOpen(false);
  }

  function addInspiration(insp: IInspiration) {
    if (todos.some((t) => t.name === insp.name)) {
      toast.info(`「${insp.name}」已在清单里`);
      return;
    }
    const item: ITodoItem = {
      id: makeId('td'),
      name: insp.name,
      category: insp.category,
      repeat: insp.repeat.length > 0 ? insp.repeat : ALL_WEEK,
      checkins: [],
      createdAt: nowTs(),
    };
    setTodos((prev) => [...prev, item]);
    toast.success(`已添加「${insp.name}」`);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">清单</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">打卡清单，自动记录进度与完成时间</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          新建清单项
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">今日打卡</p>
            <Check className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 font-serif text-2xl font-semibold">
            {doneTodayCount}
            <span className="text-base text-muted-foreground"> / {dueToday.length} 项</span>
          </p>
          <Progress value={todayRate} className="mt-2 h-1.5" />
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">本周进度</p>
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-1 font-serif text-2xl font-semibold">
            {weekDoneAll}
            <span className="text-base text-muted-foreground"> / {weekDueAll} 次</span>
          </p>
          <Progress value={weekRate} className="mt-2 h-1.5" />
        </Card>
      </div>

      <DateBar dateKey={dateKey} onChange={setDateKey} />

      {todos.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          清单是空的，从上面的灵感中心挑一个，或点「新建清单项」添加
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, idx) => {
            const items = todos.filter((t) => t.category === cat);
            return (
              <Card key={cat}>
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: getCategoryMeta(cat, idx).color }}
                    />
                    {cat}
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">{items.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  {items.map((item) => {
                    const weekDone = item.checkins.filter((c) => weekKeys.includes(c.date)).length;
                    const weekDue = weekKeys.filter((k) => item.repeat.includes(parseKey(k).getDay())).length;
                    return (
                      <CheckItemRow
                        key={item.id}
                        item={item}
                        categoryIndex={idx}
                        dateKey={dateKey}
                        weekDone={weekDone}
                        weekDue={weekDue}
                        onToggle={toggleOn}
                        onDelete={deleteItem}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <InspirationPanel existingNames={todos.map((t) => t.name)} onAdd={addInspiration} />

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建清单项</DialogTitle>
            <DialogDescription>设置重复周期，自动生成循环任务并记录完成时间</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="todo-name">名称</Label>
              <Input
                id="todo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：喝水 8 杯"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="todo-category">分组（可选）</Label>
              <Input
                id="todo-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例如：健康 / 学习 / 工作 / 生活 / 理财，留空默认「生活」"
              />
            </div>
            <div className="space-y-2">
              <Label>每周重复日</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={repeat.map(String)}
                onValueChange={(vals) => setRepeat(vals.map(Number))}
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
