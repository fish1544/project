import { useState } from 'react';
import { addDays, format } from 'date-fns';
import {
  BatteryLow,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Flame,
  Frown,
  ImagePlus,
  ListChecks,
  Smile,
  Sun,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { useStored } from '@/data/store';
import { toDateKey, parseKey, todayKey, WEEKDAY_CN } from '@/lib/date';
import { fileToDataUrl } from '@/lib/image';
import { MOODS } from '@/data/types';
import type { IJournalEntry } from '@/data/types';

const MOOD_ICONS: Record<string, LucideIcon> = {
  great: Sun,
  good: Smile,
  calm: Cloud,
  tired: BatteryLow,
  down: Frown,
};

export default function JournalPage() {
  const [currentKey, setCurrentKey] = useState(() => todayKey());
  const [entries, setEntries] = useStored('journal', {});
  const [tasks] = useStored('tasks', []);
  const [todos] = useStored('todos', []);
  const [habits] = useStored('habits', []);
  const [busy, setBusy] = useState(false);

  const currentDate = parseKey(currentKey);
  const entry = entries[currentKey];
  const images = entry?.images ?? [];

  function updateEntry(
    patch: Partial<IJournalEntry> | ((cur: IJournalEntry | undefined) => Partial<IJournalEntry>)
  ) {
    setEntries((prev) => {
      const cur = prev[currentKey];
      const p = typeof patch === 'function' ? patch(cur) : patch;
      return {
        ...prev,
        [currentKey]: {
          date: currentKey,
          text: cur?.text ?? '',
          mood: cur?.mood ?? '',
          updatedAt: Date.now(),
          ...p,
        },
      };
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const dataUrls: string[] = [];
      for (const f of Array.from(files).slice(0, 6)) {
        dataUrls.push(await fileToDataUrl(f));
      }
      updateEntry((cur) => ({ images: [...(cur?.images ?? []), ...dataUrls] }));
    } catch {
      /* 读取失败忽略 */
    } finally {
      setBusy(false);
    }
  }

  function removeImage(index: number) {
    updateEntry((cur) => ({ images: (cur?.images ?? []).filter((_, i) => i !== index) }));
  }

  function goTo(date: Date) {
    setCurrentKey(toDateKey(date));
  }

  const doneTasks = tasks.filter((t) => t.done && t.date === currentKey);
  const doneTodos = todos.flatMap((item) =>
    item.checkins
      .filter((c) => c.date === currentKey)
      .map((c) => ({ name: item.name, doneAt: c.doneAt }))
  );
  const doneHabits = habits.filter((h) => h.records[currentKey]);
  const hasEvents = doneTasks.length + doneTodos.length + doneHabits.length > 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">日记</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">一日一页，记录每天的重要瞬间</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => goTo(addDays(currentDate, -1))} aria-label="前一天">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-32 text-center">
            <p className="font-serif text-lg font-semibold leading-tight">{format(currentDate, 'M月d日')}</p>
            <p className="text-xs text-muted-foreground">
              {WEEKDAY_CN[(currentDate.getDay() + 6) % 7]} · {format(currentDate, 'yyyy年')}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => goTo(addDays(currentDate, 1))} aria-label="后一天">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => goTo(new Date())}>
            今天
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {currentKey === todayKey() ? '今天' : format(currentDate, 'M月d日')}的心情与记录
            </span>
            {entry?.updatedAt ? (
              <span className="text-xs text-muted-foreground/70">
                {format(entry.updatedAt, 'HH:mm')} 已保存
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/70">自动保存</span>
            )}
          </div>
          <textarea
            value={entry?.text ?? ''}
            onChange={(e) => updateEntry({ text: e.target.value })}
            placeholder={'写下今天的重要瞬间、想法或小确幸……'}
            className="paper-lines min-h-[300px] w-full resize-y rounded-lg bg-transparent px-2 py-1 text-[15px] leading-8 outline-none placeholder:text-muted-foreground/60"
          />

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <div key={`${i}-${src.slice(0, 24)}`} className="group relative overflow-hidden rounded-lg border">
                  <Image src={src} alt={`日记图片 ${i + 1}`} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100"
                    aria-label="删除图片"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              id="journal-images"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
              <label htmlFor="journal-images" className="cursor-pointer">
                <ImagePlus className="h-4 w-4" />
                {busy ? '处理中…' : '添加图片'}
              </label>
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">今日心情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {MOODS.map((m) => {
                  const Icon = MOOD_ICONS[m.id];
                  const active = (entry?.mood ?? '') === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateEntry({ mood: active ? '' : m.id })}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                      aria-label={m.label}
                      title={m.label}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
                <ListChecks className="h-4 w-4 text-primary" />
                今日完成
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasEvents && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  今天还没有完成事项
                  <br />
                  去清单或周计划打个卡吧
                </p>
              )}

              {doneTasks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">完成的任务</p>
                  {doneTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      {t.time && <span className="shrink-0 text-xs text-muted-foreground">{t.time}</span>}
                    </div>
                  ))}
                </div>
              )}

              {doneTodos.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">清单打卡</p>
                  {doneTodos.map((t, i) => (
                    <div key={`${t.name}-${i}`} className="flex items-center gap-2 text-sm">
                      <ListChecks className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate">{t.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{t.doneAt}</span>
                    </div>
                  ))}
                </div>
              )}

              {doneHabits.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">习惯打卡</p>
                  {doneHabits.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-sm">
                      <Flame className="h-4 w-4 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1 truncate">{h.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
