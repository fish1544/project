import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Lightbulb,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { GrowthItem } from '@shared/api.interface';
import * as growthApi from '@client/src/api/growth';
import {
  getEnergyLevelLabel,
} from '@client/src/api/tasks';

const CATEGORIES = ['学习', '工作', '生活', '健康', '兴趣', '其他'];
const ENERGY_LEVELS = [1, 2, 3, 4, 5];

const categoryColors: Record<string, string> = {
  '学习': 'hsl(var(--primary) / 0.7)',
  '工作': 'hsl(var(--primary))',
  '生活': 'hsl(var(--warning))',
  '健康': 'hsl(var(--accent))',
  '兴趣': 'hsl(var(--accent) / 0.6)',
  '其他': 'hsl(var(--muted-foreground))',
};

export default function GrowthPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unconverted' | 'converted'>('all');
  const [quickInput, setQuickInput] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedEnergyLevel, setSelectedEnergyLevel] = useState<string>('3');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [convertItemId, setConvertItemId] = useState<string | null>(null);

  const { data: growthData, isLoading } = useQuery({
    queryKey: ['growth', activeTab],
    queryFn: () =>
      growthApi.getGrowthList({
        isConverted:
          activeTab === 'all' ? undefined : activeTab === 'converted',
      }),
  });

  const createMutation = useMutation({
    mutationFn: growthApi.createGrowthItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth'] });
      toast.success('想法已添加到成长池');
      setQuickInput('');
      setShowMoreOptions(false);
      setSelectedCategory('');
      setSelectedEnergyLevel('3');
    },
    onError: () => {
      toast.error('添加失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: growthApi.deleteGrowthItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth'] });
      toast.success('已删除');
      setDeleteItemId(null);
    },
    onError: () => {
      toast.error('删除失败');
    },
  });

  const convertMutation = useMutation({
    mutationFn: growthApi.convertToTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth'] });
      toast.success('已转为任务，去任务页看看吧');
      setConvertItemId(null);
    },
    onError: () => {
      toast.error('转化失败');
    },
  });

  const handleQuickAdd = () => {
    if (!quickInput.trim()) {
      toast.error('请输入想法内容');
      return;
    }
    createMutation.mutate({
      title: quickInput.trim(),
      category: selectedCategory || undefined,
      energyLevel: Number(selectedEnergyLevel),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const items = growthData?.items || [];

  const tabConfig: { value: 'all' | 'unconverted' | 'converted'; label: string; count?: number }[] = [
    { value: 'all', label: '全部', count: growthData?.total },
    { value: 'unconverted', label: '未转化' },
    { value: 'converted', label: '已转化' },
  ];

  return (
    <div className="px-3 sm:px-4 md:p-5 py-5 md:py-6 max-w-6xl mx-auto bg-background min-h-full relative overflow-hidden">
      {/* 背景装饰光斑（克制，2 个） */}
      <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="pointer-events-none absolute bottom-40 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      {/* Hero Header */}
      <header className="mb-5 md:mb-6 text-center md:text-left relative">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
          <Sparkles className="w-3 h-3" strokeWidth={1.75} />
          <span className="eyebrow-label">灵感收集站</span>
        </div>
        <h1 className="font-serif-display text-2xl md:text-3xl text-foreground tracking-tight mb-1">
          成长池
        </h1>
        <p className="text-muted-foreground text-sm max-w-md md:max-w-lg mx-auto md:mx-0 leading-relaxed">
          把闪过脑海的每一颗种子轻轻放下，让它们在时间里慢慢发芽，
          等到合适的时机，再移栽到任务清单中。
        </p>
      </header>

      {/* Quick Input — 便签/便利贴风格 */}
      <div className="relative mb-5 md:mb-6">
        <div className="memo-card memo-card-hover p-4 relative overflow-hidden">
          {/* 便签顶部胶带装饰 */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-warning/30 rounded-sm rotate-[-2deg]" />

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center pt-1">
            <div className="flex-1 relative">
              <Lightbulb
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warning"
                strokeWidth={1.75}
                fill="currentColor"
                fillOpacity={0.2}
              />
              <Input
                placeholder="记下此刻的想法..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-4 h-9 border border-border/60 bg-muted/30 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
              />
            </div>
            <Button
              onClick={handleQuickAdd}
              disabled={createMutation.isPending}
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 gap-1.5"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              放入成长池
            </Button>
          </div>

          {/* 更多选项折叠 */}
          <div className="mt-2.5">
            <button
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {showMoreOptions ? (
                <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              更多选项
            </button>

            {showMoreOptions && (
              <div className="mt-2.5 space-y-2.5 animate-fade-in-up">
                {/* 分类 — 有机胶囊按钮组 */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">
                    分类
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat;
                      const catColor = categoryColors[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() =>
                            setSelectedCategory(isActive ? '' : cat)
                          }
                          className="px-2.5 py-1 text-xs font-medium transition-all duration-200 rounded-full"
                          style={{
                            backgroundColor: isActive
                              ? catColor
                              : 'hsl(var(--muted) / 0.5)',
                            color: isActive ? 'hsl(var(--card))' : 'hsl(var(--muted-foreground))',
                            border: isActive
                              ? `1px solid ${catColor}`
                              : '1px solid hsl(var(--border) / 0.6)',
                            boxShadow: isActive
                              ? `0 1px 4px ${catColor}30`
                              : 'none',
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 精力等级 — 有机胶囊按钮组 */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block">
                    预估精力等级
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ENERGY_LEVELS.map((lvl) => {
                      const isActive = selectedEnergyLevel === String(lvl);
                      const energyColors: Record<number, string> = {
                        1: 'hsl(var(--success) / 0.75)',
                        2: 'hsl(var(--success))',
                        3: 'hsl(var(--warning))',
                        4: 'hsl(var(--accent))',
                        5: 'hsl(var(--destructive))',
                      };
                      const color = energyColors[lvl];
                      return (
                        <button
                          key={lvl}
                          onClick={() => setSelectedEnergyLevel(String(lvl))}
                          className="px-2.5 py-1 text-xs font-medium transition-all duration-200 rounded-full"
                          style={{
                            backgroundColor: isActive
                              ? color
                              : 'hsl(var(--muted) / 0.5)',
                            color: isActive ? 'hsl(var(--card))' : 'hsl(var(--muted-foreground))',
                            border: isActive
                              ? `1px solid ${color}`
                              : '1px solid hsl(var(--border) / 0.6)',
                            boxShadow: isActive
                              ? `0 1px 4px ${color}30`
                              : 'none',
                          }}
                        >
                          {getEnergyLevelLabel(lvl)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs — 有机胶囊分段控件 */}
      <div className="mb-4 flex justify-center">
        <div
          className="inline-flex p-1 bg-muted/60 rounded-full h-8"
          role="tablist"
        >
          {tabConfig.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="relative px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-full"
                style={{
                  color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  backgroundColor: isActive ? 'hsl(var(--card))' : 'transparent',
                  boxShadow: isActive
                    ? '0 1px 3px -1px hsl(var(--shadow-color) / 0.08)'
                    : 'none',
                }}
                role="tab"
                aria-selected={isActive}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className="ml-1 text-[10px] font-semibold"
                    style={{
                      color: isActive ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Growth Masonry — 漂流瓶/种子卡片 */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm text-center py-10">加载中...</div>
      ) : items.length === 0 ? (
        /* 空态 */
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <p className="text-sm text-foreground/80">成长池还是空的</p>
          <p className="text-xs text-muted-foreground max-w-[240px] text-center">
            想到什么先记下来，不用急着变成任务。慢慢攒，慢慢发芽。
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 space-y-2.5">
          {items.map((item: GrowthItem, index: number) => (
            <div
              key={item.id}
              className="break-inside-avoid"
              style={{
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <GrowthCard
                item={item}
                index={index}
                onConvert={() => setConvertItemId(item.id)}
                onDelete={() => setDeleteItemId(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteItemId}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
      >
        <AlertDialogContent className="paper-card rounded-2xl p-5 sm:max-w-md">
          <AlertDialogHeader className="text-center pt-2">
            <div className="w-11 h-11 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2
                className="w-5 h-5 text-destructive"
                strokeWidth={1.75}
              />
            </div>
            <AlertDialogTitle className="font-serif-display text-base text-foreground">
              丢掉这颗种子吗？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              它会从成长池中消失，就像从未被拾起过一样。
              <br />
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="bg-card text-foreground border border-border rounded-lg h-9 px-4 text-sm hover:bg-muted/30 transition-colors">
              再想想
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteItemId && deleteMutation.mutate(deleteItemId)
              }
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200"
            >
              {deleteMutation.isPending ? '删除中...' : '丢掉'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Confirm */}
      <AlertDialog
        open={!!convertItemId}
        onOpenChange={(open) => !open && setConvertItemId(null)}
      >
        <AlertDialogContent className="paper-card rounded-2xl p-5 sm:max-w-md">
          <AlertDialogHeader className="text-center pt-2">
            <div className="w-11 h-11 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight
                className="w-5 h-5 text-primary"
                strokeWidth={1.75}
              />
            </div>
            <AlertDialogTitle className="font-serif-display text-base text-foreground">
              移栽到任务清单？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              这颗种子已经准备好发芽了，
              <br />
              把它移入今日任务，开始行动吧。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel className="bg-card text-foreground border border-border rounded-lg h-9 px-4 text-sm hover:bg-muted/30 transition-colors">
              再等等
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                convertItemId && convertMutation.mutate(convertItemId)
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200"
            >
              {convertMutation.isPending ? '转换中...' : '确认移栽'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GrowthCard({
  item,
  index,
  onConvert,
  onDelete,
}: {
  item: GrowthItem;
  index: number;
  onConvert: () => void;
  onDelete: () => void;
}) {
  const energyColors: Record<number, string> = {
    1: 'hsl(var(--success) / 0.75)',
    2: 'hsl(var(--success))',
    3: 'hsl(var(--warning))',
    4: 'hsl(var(--accent))',
    5: 'hsl(var(--destructive))',
  };
  const color = energyColors[item.energyLevel] || 'hsl(var(--success) / 0.75)';
  const catColor = item.category
    ? categoryColors[item.category] || 'hsl(var(--primary) / 0.7)'
    : 'hsl(var(--primary) / 0.7)';

  // 根据索引制造轻微错落：旋转角度和上下偏移
  const driftStyles = [
    { rotate: '-0.8deg', translateY: '0px', borderRadius: '28px 20px 32px 24px / 24px 32px 20px 28px' },
    { rotate: '0.6deg', translateY: '4px', borderRadius: '22px 30px 20px 28px / 28px 22px 30px 20px' },
    { rotate: '-0.4deg', translateY: '2px', borderRadius: '24px 26px 28px 22px / 26px 24px 22px 28px' },
    { rotate: '0.8deg', translateY: '-2px', borderRadius: '30px 22px 26px 24px / 22px 28px 24px 26px' },
    { rotate: '-0.6deg', translateY: '6px', borderRadius: '20px 28px 24px 30px / 26px 22px 28px 20px' },
  ];
  const style = driftStyles[index % driftStyles.length];

  return (
    <div
      className={`group relative memo-card memo-card-hover p-3.5 ${
        item.isConverted ? 'opacity-60 grayscale-[0.3]' : ''
      }`}
      style={{
        borderRadius: style.borderRadius,
        transform: item.isConverted ? 'none' : `rotate(${style.rotate}) translateY(${style.translateY})`,
      }}
    >
      {/* 顶部种子色点 */}
      <div
        className="absolute -top-1.5 left-4 w-2.5 h-2.5 rounded-full"
        style={{
          backgroundColor: catColor,
          boxShadow: `0 0 0 3px hsl(var(--card) / 0.8), 0 1px 3px ${catColor}30`,
        }}
      />

      {/* 删除按钮 */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 z-10"
        aria-label="删除"
      >
        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
      </button>

      {/* 标题 */}
      <h3
        className={`font-serif-display text-sm pr-7 mb-1 ${
          item.isConverted
            ? 'line-through text-muted-foreground decoration-muted-foreground/60'
            : 'text-foreground'
        }`}
        style={{ lineHeight: '1.4' }}
      >
        {item.title}
      </h3>

      {/* 描述 */}
      {item.description && (
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* 底部标签 + 操作按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 mt-auto">
        <div className="flex flex-wrap items-center gap-1">
          {item.category && (
            <span
              className="sticker-label-sm"
              style={{
                color: catColor,
                borderColor: `${catColor}60`,
                backgroundColor: `${catColor}12`,
              }}
            >
              {item.category}
            </span>
          )}
          <span
            className="sticker-label-sm"
            style={{
              color,
              borderColor: `${color}60`,
              backgroundColor: `${color}12`,
            }}
          >
            {getEnergyLevelLabel(item.energyLevel)}
          </span>
          {item.isConverted && (
            <span className="sticker-label-sm bg-primary/10 text-primary border-primary/30 inline-flex items-center gap-1">
              <Check className="w-2.5 h-2.5" strokeWidth={1.75} />
              已移栽
            </span>
          )}
        </div>
        {!item.isConverted && (
          <button
            onClick={onConvert}
            className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium bg-primary/10 hover:bg-primary/15 text-primary rounded-full transition-all duration-200"
          >
            转为任务
            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
