import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic, Plus, Sparkles } from 'lucide-react';
import { voiceApi } from '@client/src/api';
import VoiceEditor from './VoiceEditor';
import VoiceRecordItem from './VoiceRecordItem';
import type { VoiceRecord } from '@shared/api.interface';
import { toast } from 'sonner';

const VoicePage = () => {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VoiceRecord | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['voiceRecords', page, pageSize],
    queryFn: () => voiceApi.getVoiceRecords(page, pageSize),
  });

  const createMutation = useMutation({
    mutationFn: voiceApi.createVoiceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceRecords'] });
      setShowEditor(false);
      toast.success('记录已保存');
    },
    onError: () => {
      toast.error('保存失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof voiceApi.updateVoiceRecord>[1] }) =>
      voiceApi.updateVoiceRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceRecords'] });
      setEditingRecord(null);
      toast.success('修改已保存');
    },
    onError: () => {
      toast.error('修改失败，请重试');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: voiceApi.deleteVoiceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceRecords'] });
      toast.success('已删除');
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
  });

  const handleCreate = (data: {
    durationSeconds: number;
    transcript: string;
    emotionTags: string[];
    eventTags: string[];
    timeMentions: string[];
    recordDate: string;
  }) => {
    createMutation.mutate({
      durationSeconds: data.durationSeconds,
      recordDate: data.recordDate,
      transcript: data.transcript || undefined,
      emotionTags: data.emotionTags,
      eventTags: data.eventTags,
      timeMentions: data.timeMentions,
    });
  };

  const handleUpdate = (data: {
    durationSeconds: number;
    transcript: string;
    emotionTags: string[];
    eventTags: string[];
    timeMentions: string[];
    recordDate: string;
  }) => {
    if (!editingRecord) return;
    updateMutation.mutate({
      id: editingRecord.id,
      data: {
        transcript: data.transcript || undefined,
        emotionTags: data.emotionTags,
        eventTags: data.eventTags,
        timeMentions: data.timeMentions,
      },
    });
  };

  const handleEdit = (record: VoiceRecord) => {
    setEditingRecord(record);
    setShowEditor(false);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // 按日期分组
  const grouped: Record<string, VoiceRecord[]> = {};
  if (data?.items) {
    for (const item of data.items) {
      if (!grouped[item.recordDate]) {
        grouped[item.recordDate] = [];
      }
      grouped[item.recordDate].push(item);
    }
  }

  const formatDateLabel = (dateStr: string): string => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (a: Date, b: Date): boolean =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(d, today)) return '今天';
    if (isSameDay(d, yesterday)) return '昨天';

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  };

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground break-words">语音记录</h1>
         <p className="mt-1 text-sm text-muted-foreground break-words">
           用语音记录当下的感受和想法，自动帮你结构化
         </p>
      </div>

      {/* 录音入口卡片 / 编辑器 */}
      {showEditor || editingRecord ? (
        <div className="mb-8">
          <VoiceEditor
            mode={editingRecord ? 'edit' : 'create'}
            initialRecord={editingRecord ?? undefined}
            onSave={editingRecord ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowEditor(false);
              setEditingRecord(null);
            }}
            saving={
              editingRecord
                ? updateMutation.isPending
                : createMutation.isPending
            }
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl p-6 md:p-8 shadow-sm border border-border text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mic className="w-10 h-10 text-primary" />
          </div>
           <h2 className="text-lg font-semibold text-foreground mb-2 break-words">
             开始记录
           </h2>
           <p className="text-sm text-muted-foreground mb-6 break-words">
             点击下方按钮，开始录制你的语音笔记
           </p>
          <button
            onClick={() => setShowEditor(true)}
            className="w-full sm:w-auto px-8 h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            开始录制
          </button>
        </div>
      )}

      {/* 记录列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">历史记录</h3>
          {data && data.total > 0 && (
            <span className="text-xs text-muted-foreground">
              共 {data.total} 条
            </span>
          )}
        </div>

        {isLoading && (
          <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center">
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        )}

        {isError && (
          <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center">
            <p className="text-sm text-destructive">加载失败，请刷新重试</p>
          </div>
        )}

        {!isLoading && !isError && data && data.items.length === 0 && (
          <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary/40" />
            </div>
             <p className="text-sm text-muted-foreground mb-4 break-words">
               还没有记录，开始你的第一条语音笔记吧
             </p>
            <button
              onClick={() => setShowEditor(true)}
              className="text-sm text-primary hover:underline"
            >
              立即记录 →
            </button>
          </div>
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]: [string, VoiceRecord[]]) => (
              <div key={date}>
                <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                  {formatDateLabel(date)}
                </div>
                <div className="space-y-3">
                  {items.map((record: VoiceRecord) => (
                    <VoiceRecordItem
                      key={record.id}
                      record={record}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* 加载更多 */}
            {data.total > page * pageSize && (
              <button
                onClick={() => setPage(page + 1)}
                className="w-full h-11 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm"
              >
                加载更多
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoicePage;
