import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';
import {
  TIMER_CATEGORIES,
  type TimerCategory,
  type TimerRecord,
} from '@shared/api.interface';
import { timerApi } from '@client/src/api';

const CATEGORY_LABELS: Record<TimerCategory, string> = {
  work: '工作',
  study: '学习',
  creative: '创作',
  rest: '休息',
  exercise: '运动',
  social: '社交',
  outdoor: '出门',
  other: '其他',
};

const CATEGORY_COLORS: Record<TimerCategory, string> = {
  work: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  study: 'bg-blue-100 text-blue-700 border-blue-200',
  creative: 'bg-purple-100 text-purple-700 border-purple-200',
  rest: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  exercise: 'bg-orange-100 text-orange-700 border-orange-200',
  social: 'bg-pink-100 text-pink-700 border-pink-200',
  outdoor: 'bg-teal-100 text-teal-700 border-teal-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}小时${minutes}分`;
  }
  if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  }
  return `${secs}秒`;
}

function formatTimeRange(startedAt: string, endedAt: string): string {
  const s = new Date(startedAt);
  const e = new Date(endedAt);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${fmt(s)} - ${fmt(e)}`;
}

function getDateKey(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isToday(isoString: string): boolean {
  return getDateKey(isoString) === getDateKey(new Date().toISOString());
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(getDateKey(d.toISOString()));
  }
  return days;
}

interface HistoryTabProps {
  refreshKey: number;
}

const HistoryTab = ({ refreshKey }: HistoryTabProps) => {
  const [items, setItems] = useState<TimerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [stats, setStats] = useState<{
    totalSeconds: number;
    byCategory: Record<string, number>;
    byDay: Record<string, number>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [editingRecord, setEditingRecord] = useState<TimerRecord | null>(null);
  const [editForm, setEditForm] = useState({
    taskName: '',
    category: 'work' as TimerCategory,
    startedAt: '',
    endedAt: '',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Fetch records
  const fetchRecords = useCallback(
    async (pageNum: number, replace = false) => {
      setLoading(true);
      try {
        const cat = category === 'all' ? undefined : category;
        const result = await timerApi.getTimerRecords(pageNum, pageSize, cat);
        if (replace) {
          setItems(result.items);
        } else {
          setItems((prev) => [...prev, ...result.items]);
        }
        setTotal(result.total);
        setHasMore(result.items.length === pageSize);
        setPage(pageNum);
      } catch {
        // error logged
      } finally {
        setLoading(false);
      }
    },
    [category, pageSize],
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await timerApi.getTimerStats(7);
      setStats(result);
    } catch {
      // error logged
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial load & refresh
  useEffect(() => {
    setItems([]);
    setTotal(0);
    setHasMore(true);
    setPage(1);
    fetchRecords(1, true);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, refreshKey]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          fetchRecords(page + 1, false);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchRecords]);

  const handleCategoryChange = useCallback((value: string) => {
    setCategory(value);
  }, []);

  // Stats: today & this week
  const todaySeconds = useMemo(() => {
    if (!stats) return 0;
    const todayKey = getDateKey(new Date().toISOString());
    return stats.byDay[todayKey] ?? 0;
  }, [stats]);

  const weekSeconds = useMemo(() => {
    return stats?.totalSeconds ?? 0;
  }, [stats]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; records: TimerRecord[] }[] = [];
    const map = new Map<string, TimerRecord[]>();
    for (const record of items) {
      const key = getDateKey(record.startedAt);
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ date: key, records: map.get(key)! });
      }
      map.get(key)!.push(record);
    }
    return groups;
  }, [items]);

  const last7Days = useMemo(() => getLast7Days(), []);
  const maxDaySeconds = useMemo(() => {
    if (!stats) return 0;
    return Math.max(
      60, // min bar height for 1 min
      ...last7Days.map((d) => stats.byDay[d] ?? 0),
    );
  }, [stats, last7Days]);

  // Edit handlers
  const handleEdit = useCallback((record: TimerRecord) => {
    setEditingRecord(record);
    const toLocal = (iso: string) => {
      const d = new Date(iso);
      const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
      return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
    };
    setEditForm({
      taskName: record.taskName,
      category: record.category,
      startedAt: toLocal(record.startedAt),
      endedAt: toLocal(record.endedAt),
      notes: record.notes ?? '',
    });
    setOpenMenuId(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingRecord) return;

    const start = new Date(editForm.startedAt);
    const end = new Date(editForm.endedAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    if (end <= start) return;

    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

    setSavingEdit(true);
    try {
      await timerApi.updateTimerRecord(editingRecord.id, {
        taskName: editForm.taskName,
        category: editForm.category,
        durationSeconds: duration,
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        notes: editForm.notes || undefined,
      });
      setEditingRecord(null);
      setItems([]);
      setHasMore(true);
      setPage(1);
      fetchRecords(1, true);
      fetchStats();
    } catch {
      // error logged
    } finally {
      setSavingEdit(false);
    }
  }, [editingRecord, editForm, fetchRecords, fetchStats]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await timerApi.deleteTimerRecord(id);
      setDeleteConfirmId(null);
      setItems([]);
      setHasMore(true);
      setPage(1);
      fetchRecords(1, true);
      fetchStats();
    } catch {
      // error logged
    } finally {
      setDeleting(false);
    }
  }, [fetchRecords, fetchStats]);

  const toggleMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">今日总时长</p>
          <p className="text-2xl font-bold text-gray-800 font-mono">
            {statsLoading ? '--' : formatDuration(todaySeconds)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">本周总时长</p>
          <p className="text-2xl font-bold text-indigo-600 font-mono">
            {statsLoading ? '--' : formatDuration(weekSeconds)}
          </p>
        </div>
      </div>

      {/* 7-day bar chart */}
      <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-200 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">最近 7 天</h3>
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-28 min-w-[280px]">
          {last7Days.map((day) => {
            const secs = stats?.byDay[day] ?? 0;
            const heightPct = maxDaySeconds > 0 ? (secs / maxDaySeconds) * 100 : 0;
            const date = new Date(day);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;
            const isTdy = day === getDateKey(new Date().toISOString());
            return (
              <div
                key={day}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <div className="w-full flex flex-col justify-end items-center h-24">
                  <div
                    className={`w-full max-w-8 rounded-t-md transition-all duration-300 ${
                      isTdy ? 'bg-indigo-500' : 'bg-indigo-300'
                    }`}
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                    title={formatDuration(secs)}
                  />
                </div>
                <span
                  className={`text-xs ${isTdy ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 flex-shrink-0">
          分类筛选
        </label>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="flex-1 h-10 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {TIMER_CATEGORIES.map((cat: TimerCategory) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Record list */}
      <div className="space-y-5">
        {items.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-200 text-center">
            <p className="text-sm text-gray-500">暂无计时记录</p>
            <p className="text-xs text-gray-400 mt-1">
              开始你的第一次计时吧
            </p>
          </div>
        )}

        {grouped.map((group) => {
          const dayTotal = group.records.reduce(
            (sum, r) => sum + r.durationSeconds,
            0,
          );
          const dateLabel = isToday(group.records[0].startedAt)
            ? '今天'
            : group.date;
          return (
            <div key={group.date}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-medium text-gray-600">
                  {dateLabel}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDuration(dayTotal)}
                </span>
              </div>
              <div className="space-y-2">
                {group.records.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-medium text-gray-800 truncate">
                            {record.taskName}
                          </h4>
                          <span
                            className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[record.category as TimerCategory]}`}
                          >
                            {CATEGORY_LABELS[record.category as TimerCategory]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="font-mono">
                            {formatDuration(record.durationSeconds)}
                          </span>
                          <span>
                            {formatTimeRange(record.startedAt, record.endedAt)}
                          </span>
                          {record.isManual && (
                            <span className="text-gray-400">补录</span>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                            {record.notes}
                          </p>
                        )}
                      </div>
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => toggleMenu(record.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="更多操作"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {openMenuId === record.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-9 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-28">
                              <button
                                onClick={() => handleEdit(record)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 className="w-4 h-4" />
                                编辑
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(record.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                删除
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="h-4" />

        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">
            加载中...
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-400">
            没有更多了
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑记录</DialogTitle>
            <DialogDescription>
              修改计时记录的信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                任务名称
              </label>
              <Input
                value={editForm.taskName}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, taskName: e.target.value }))
                }
                className="h-11 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                分类
              </label>
              <Select
                value={editForm.category}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, category: v as TimerCategory }))
                }
              >
                <SelectTrigger className="w-full h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMER_CATEGORIES.map((cat: TimerCategory) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  开始时间
                </label>
                <Input
                  type="datetime-local"
                  value={editForm.startedAt}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, startedAt: e.target.value }))
                  }
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  结束时间
                </label>
                <Input
                  type="datetime-local"
                  value={editForm.endedAt}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, endedAt: e.target.value }))
                  }
                  className="h-11 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                备注
              </label>
              <Textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="min-h-[80px] rounded-lg resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingRecord(null)}
              disabled={savingEdit}
            >
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              删除后无法恢复，确定要删除这条记录吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryTab;
