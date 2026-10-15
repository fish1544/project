import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Zap,
  Calendar as CalendarIcon,
  X,
  Loader2,
  Info,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import type { Task } from '@shared/api.interface';
import * as tasksApi from '@client/src/api/tasks';
import {
  getEnergyLevelLabel,
  getLoadStatusLabel,
  getLoadStatusColor,
} from '@client/src/api/tasks';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [showEnergyLevels, setShowEnergyLevels] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEnergyLevel, setFormEnergyLevel] = useState('3');
  const [formDueDate, setFormDueDate] = useState<Date | undefined>(undefined);

  const { data: energyLoad, isLoading: loadLoading } = useQuery({
    queryKey: ['energyLoad'],
    queryFn: tasksApi.getEnergyLoad,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', activeTab],
    queryFn: () => tasksApi.getTasks({ status: activeTab }),
  });

  const createMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['energyLoad'] });
      toast.success('任务添加成功');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('添加任务失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status?: 'pending' | 'completed' | 'in_progress' };
    }) => tasksApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['energyLoad'] });
    },
    onError: () => {
      toast.error('更新任务失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['energyLoad'] });
      toast.success('任务已删除');
      setDeleteTaskId(null);
    },
    onError: () => {
      toast.error('删除任务失败');
    },
  });

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormEnergyLevel('3');
    setFormDueDate(undefined);
  };

  const handleSubmit = () => {
    if (!formTitle.trim()) {
      toast.error('请输入任务标题');
      return;
    }
    createMutation.mutate({
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      energyLevel: Number(formEnergyLevel),
      dueDate: formDueDate ? format(formDueDate, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleToggleStatus = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const loadStatus = energyLoad?.loadStatus || 'light';
  const loadColor = getLoadStatusColor(loadStatus);
  const progressPercent = energyLoad
    ? Math.min((energyLoad.usedEnergy / energyLoad.totalEnergy) * 100, 100)
    : 0;

  const energyLevels = [
    { level: 1, label: '很轻松', value: 5, color: 'hsl(var(--success) / 0.75)' },
    { level: 2, label: '小费劲', value: 10, color: 'hsl(var(--success))' },
    { level: 3, label: '中等', value: 20, color: 'hsl(var(--warning))' },
    { level: 4, label: '很费劲', value: 35, color: 'hsl(var(--accent))' },
    { level: 5, label: '大工程', value: 50, color: 'hsl(var(--destructive))' },
  ];

  const getEnergyBadgeColor = (level: number): string => {
   const item = energyLevels.find((e) => e.level === level);
   return item?.color || 'hsl(var(--success) / 0.75)';
  };

  return (
    <div className="p-3 sm:p-4 md:p-5 pb-6 sm:pb-8 space-y-4 md:space-y-5 bg-background min-h-full relative overflow-hidden">
      {/* 背景装饰光斑（克制，2 个） */}
      <div className="pointer-events-none absolute top-0 right-0 w-56 h-56 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="pointer-events-none absolute bottom-32 left-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      {/* 顶部标题区 */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative">
        <div className="flex items-center gap-3">
          <span className="ink-dot" />
          <div>
            <h1 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight">
              任务管理
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              管理今日任务，保持精力在舒适区
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary text-primary-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 gap-1.5"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          添加任务
        </Button>
      </div>

      {/* 精力负荷卡片 — 视觉焦点 */}
      <div className="paper-card paper-card-hover rounded-2xl relative overflow-hidden">
        <div className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap
              className="w-4 h-4"
              strokeWidth={1.75}
              style={{ color: loadColor }}
            />
            <span className="eyebrow-label">
              今日精力负荷
            </span>
          </div>

              {loadLoading ? (
                <div className="text-muted-foreground text-sm py-6">加载中...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="display-number text-3xl md:text-4xl text-foreground leading-none">
                        {energyLoad?.usedEnergy ?? 0}
                      </span>
                      <span className="text-muted-foreground text-sm leading-none">
                        / {energyLoad?.totalEnergy ?? 0}
                      </span>
                    </div>
                    <span
                      className="sticker-label-sm flex-shrink-0"
                      style={{
                        color: loadColor,
                        backgroundColor: `${loadColor}12`,
                        borderColor: `${loadColor}40`,
                      }}
                    >
                      {getLoadStatusLabel(loadStatus)}
                    </span>
                  </div>

                  {/* 细腻进度条 */}
                  <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, ${loadColor}cc, ${loadColor})`,
                      }}
                    />
                  </div>

                  {loadStatus === 'overload' ? (
                    <p className="text-xs text-destructive mt-1.5 mb-1 flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: 'hsl(var(--destructive))' }}
                      />
                      今天可能已经装不下这么多事情了
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      剩余 {Math.max(0, (energyLoad?.remainingEnergy ?? 0))} 精力可分配
                    </p>
                  )}

                  {/* 精力档位说明 — 可展开 */}
                  <button
                    type="button"
                    onClick={() => setShowEnergyLevels(!showEnergyLevels)}
                    className="w-full mt-3 pt-3 soft-divider flex items-center justify-between text-left group"
                  >
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Info className="w-3 h-3" strokeWidth={1.75} />
                      精力档位说明
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 ${showEnergyLevels ? 'rotate-180' : ''}`}
                      strokeWidth={1.75}
                    />
                  </button>

                  {showEnergyLevels && (
                    <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {energyLevels.map((e) => (
                        <div
                          key={e.level}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/30 text-[11px]"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: e.color }}
                          />
                          <span className="text-foreground/80 font-medium">
                            {e.label}
                          </span>
                          <span className="text-muted-foreground ml-auto">
                            {e.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
        </div>
      </div>

      {/* 任务列表 — 便签卡片式 */}
      <div className="space-y-3">
        {/* 有机胶囊分段 Tabs */}
        <div className="flex justify-center">
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as 'pending' | 'completed')
            }
            className="w-full"
          >
            <TabsList className="bg-muted/50 p-1 organic-pill w-full max-w-xs mx-auto text-sm h-8">
              <TabsTrigger
                value="pending"
                className="flex-1 rounded-full data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground transition-all duration-200 h-7 text-xs font-medium"
              >
                待办 ({tasksData?.total ?? 0})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex-1 rounded-full data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground transition-all duration-200 h-7 text-xs font-medium"
              >
                已完成 ({energyLoad?.completedTasks?.length ?? 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 任务项 — 便签/小卡片 */}
        {tasksLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            <span className="text-xs text-muted-foreground">加载中...</span>
          </div>
        ) : tasksData?.items?.length === 0 ? (
            <div className="text-center py-8 paper-card rounded-2xl bg-card/60">
                <div className="w-9 h-9 mx-auto mb-2.5 rounded-full bg-muted/40 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.75} />
                </div>
                <p className="font-serif-display text-sm text-foreground/80 mb-0.5">
                  {activeTab === 'pending' ? '今日暂无待办' : '还没有完成的任务'}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeTab === 'pending' ? '深呼吸，一件一件来' : '从待办里挑一件开始吧'}
                </p>
              </div>
          ) : (
            <div className="space-y-2">
              {tasksData?.items?.map((task: Task, index: number) => (
                <div
                  key={task.id}
                  className="group paper-card paper-card-hover rounded-xl p-3 md:p-3.5 transition-all duration-200"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="flex items-start gap-2.5 md:gap-3 min-w-0">
                    {/* Checkbox */}
                    <div className="pt-0.5 flex-shrink-0">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => handleToggleStatus(task)}
                        className="rounded-full w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary border-2 border-border hover:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm ${
                          task.status === 'completed'
                            ? 'text-muted-foreground line-through decoration-muted-foreground/50'
                            : 'text-foreground font-medium'
                        }`}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div
                          className={`text-xs mt-1 leading-relaxed ${
                            task.status === 'completed'
                              ? 'text-muted-foreground/50 line-through decoration-muted-foreground/40'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {task.description}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                            <CalendarIcon
                              className="w-3 h-3"
                              strokeWidth={1.75}
                            />
                            {task.dueDate}
                          </span>
                        )}
                        {/* 精力等级 — 精简小圆点 + 文字 */}
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          style={{
                            color: getEnergyBadgeColor(task.energyLevel),
                            backgroundColor: `${getEnergyBadgeColor(task.energyLevel)}12`,
                            border: `1px solid ${getEnergyBadgeColor(task.energyLevel)}35`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: getEnergyBadgeColor(task.energyLevel),
                            }}
                          />
                          {getEnergyLevelLabel(task.energyLevel)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeleteTaskId(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 flex-shrink-0"
                      aria-label="删除任务"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* 添加任务对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm paper-card rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="font-serif-display text-base text-foreground flex items-center gap-2">
              <span className="ink-dot" />
              添加新任务
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary" />
                任务标题
              </label>
              <Input
                placeholder="输入任务标题"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-9 border border-border/60 bg-muted/30 rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary" />
                描述（可选）
              </label>
              <Input
                placeholder="简要描述任务内容"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="h-9 border border-border/60 bg-muted/30 rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary" />
                精力等级
              </label>
              <Select
                value={formEnergyLevel}
                onValueChange={setFormEnergyLevel}
              >
                <SelectTrigger className="w-full h-9 border border-border/60 bg-muted/30 rounded-lg px-3 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-border/60 shadow-sm">
                  {energyLevels.map((e) => (
                    <SelectItem key={e.level} value={String(e.level)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: e.color }}
                        />
                        {e.label} ({e.value})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary" />
                截止日期（可选）
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-9 border border-border/60 bg-muted/30 hover:bg-muted/50 rounded-lg text-sm"
                  >
                    <CalendarIcon
                      className="mr-2 h-4 w-4"
                      strokeWidth={1.75}
                    />
                    {formDueDate
                      ? format(formDueDate, 'yyyy年MM月dd日')
                      : '选择日期'}
                    {formDueDate && (
                      <X
                        className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
                        strokeWidth={1.75}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormDueDate(undefined);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-lg border-border/60 shadow-sm">
                  <Calendar
                    mode="single"
                    selected={formDueDate}
                    onSelect={setFormDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="bg-card text-foreground border border-border rounded-lg h-9 px-4 text-sm hover:bg-muted/30 transition-colors flex-1 sm:flex-none"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-primary text-primary-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 flex-1 sm:flex-none"
            >
              {createMutation.isPending ? '添加中...' : '添加任务'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
      >
        <AlertDialogContent className="paper-card rounded-2xl p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-serif-display text-base flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: 'hsl(var(--destructive))' }}
              />
              确认删除
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              确定要删除这个任务吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:gap-2 mt-3">
            <AlertDialogCancel className="bg-card text-foreground border border-border rounded-lg h-9 px-4 text-sm hover:bg-muted/30 transition-colors flex-1 sm:flex-none">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTaskId && deleteMutation.mutate(deleteTaskId)
              }
              className="bg-destructive text-destructive-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 flex-1 sm:flex-none"
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
