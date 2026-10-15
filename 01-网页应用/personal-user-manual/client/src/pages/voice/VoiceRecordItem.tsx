import { useState } from 'react';
import { Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { VoiceRecord } from '@shared/api.interface';

interface VoiceRecordItemProps {
  record: VoiceRecord;
  onEdit: (record: VoiceRecord) => void;
  onDelete: (id: string) => void;
}

const POSITIVE_EMOTIONS = [
  '开心', '高兴', '愉快', '兴奋', '满足',
  '平静', '放松', '充实', '有成就感', '精力充沛',
];

const NEGATIVE_EMOTIONS = [
  '焦虑', '压力', '疲惫', '烦躁', '沮丧',
  '难过', '生气', '无聊', '孤独', '担心',
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}秒`;
  if (s === 0) return `${m}分钟`;
  return `${m}分${s}秒`;
}

function truncate(text: string | null, maxLen: number): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

const VoiceRecordItem = ({ record, onEdit, onDelete }: VoiceRecordItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const emotionColor = (tag: string): string => {
    if (POSITIVE_EMOTIONS.includes(tag)) return 'bg-green-50 text-green-700 border-green-200';
    if (NEGATIVE_EMOTIONS.includes(tag)) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(record.id);
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 md:p-5 flex items-start gap-3"
      >
        {/* 时长角标 */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary">
          <Clock className="w-4 h-4 mb-0.5" />
          <span className="text-xs font-medium">{formatDuration(record.durationSeconds)}</span>
        </div>

        {/* 主体 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed line-clamp-2">
            {record.transcript || (
              <span className="text-muted-foreground italic">暂无转写内容</span>
            )}
          </p>

          {/* 标签预览 */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {record.emotionTags.slice(0, 3).map((tag: string) => (
              <span
                key={`e-${tag}`}
                className={`px-2 py-0.5 text-xs rounded-full border ${emotionColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {record.eventTags.slice(0, 3).map((tag: string) => (
              <span
                key={`ev-${tag}`}
                className="px-2 py-0.5 text-xs rounded-full border bg-amber-50 text-amber-700 border-amber-200"
              >
                {tag}
              </span>
            ))}
            {record.timeMentions.slice(0, 2).map((tag: string) => (
              <span
                key={`t-${tag}`}
                className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center text-muted-foreground">
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* 展开详情 */}
      {expanded && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-border pt-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">完整内容</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
               {record.transcript || '暂无转写内容'}
             </p>
          </div>

          {record.emotionTags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">情绪标签</p>
              <div className="flex flex-wrap gap-1.5">
                {record.emotionTags.map((tag: string) => (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 text-xs rounded-full border ${emotionColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {record.eventTags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">事件标签</p>
              <div className="flex flex-wrap gap-1.5">
                {record.eventTags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full border bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {record.timeMentions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">时间提及</p>
              <div className="flex flex-wrap gap-1.5">
                {record.timeMentions.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

           <div className="flex gap-3 pt-1 min-w-0">
            <button
              onClick={() => onEdit(record)}
              className="flex-1 h-10 text-sm border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              编辑
            </button>
            {showDeleteConfirm ? (
              <div className="flex-1 flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-10 text-sm border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 h-10 text-sm bg-destructive text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  确认删除
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 h-10 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecordItem;
// Re-export truncate for group headers
export { truncate };
