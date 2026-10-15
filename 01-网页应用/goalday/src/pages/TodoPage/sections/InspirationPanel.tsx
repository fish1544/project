import { Check, Lightbulb, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getCategoryMeta } from '@/lib/category';
import { INSPIRATIONS, INSPIRATION_CATEGORIES, repeatLabel } from '@/data/inspirations';
import type { IInspiration } from '@/data/inspirations';

interface InspirationPanelProps {
  existingNames: string[];
  onAdd: (insp: IInspiration) => void;
}

export default function InspirationPanel({ existingNames, onAdd }: InspirationPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <CardTitle className="text-sm font-medium">灵感中心</CardTitle>
        <span className="text-xs text-muted-foreground">按分类挑选实用的打卡清单，一键添加</span>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="全部">
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            {['全部', ...INSPIRATION_CATEGORIES].map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>

          {['全部', ...INSPIRATION_CATEGORIES].map((c) => {
            const list = c === '全部' ? INSPIRATIONS : INSPIRATIONS.filter((i) => i.category === c);
            return (
              <TabsContent key={c} value={c} className="mt-3">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((insp) => {
                    const meta = getCategoryMeta(insp.category, 0);
                    const Icon = meta.icon;
                    const added = existingNames.includes(insp.name);
                    return (
                      <div
                        key={insp.name}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border bg-background p-3 transition-all',
                          added ? 'opacity-70' : 'hover:border-primary/40 hover:bg-primary/[0.03]'
                        )}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `hsl(from ${meta.color} h s l / 0.12)`, color: meta.color }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium">{insp.name}</p>
                            <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {repeatLabel(insp.repeat)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{insp.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={added}
                          onClick={() => onAdd(insp)}
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all',
                            added
                              ? 'bg-secondary text-muted-foreground'
                              : 'bg-primary text-primary-foreground hover:opacity-85'
                          )}
                          aria-label={added ? '已添加' : '添加'}
                          title={added ? '已在清单中' : '添加到清单'}
                        >
                          {added ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
