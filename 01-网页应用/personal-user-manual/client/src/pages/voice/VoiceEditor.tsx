import { useState, useEffect } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import type { VoiceRecord } from '@shared/api.interface';

interface VoiceEditorProps {
  mode: 'create' | 'edit';
  initialRecord?: VoiceRecord;
  onSave: (data: {
    durationSeconds: number;
    transcript: string;
    emotionTags: string[];
    eventTags: string[];
    timeMentions: string[];
    recordDate: string;
    audioUrl?: string;
  }) => void;
  onCancel: () => void;
  saving: boolean;
}

const POSITIVE_EMOTIONS = [
  '开心', '高兴', '愉快', '兴奋', '满足',
  '平静', '放松', '充实', '有成就感', '精力充沛',
];

const NEGATIVE_EMOTIONS = [
  '焦虑', '压力', '疲惫', '烦躁', '沮丧',
  '难过', '生气', '无聊', '孤独', '担心',
];

const EVENT_SUGGESTIONS = [
  '工作', '学习', '写作', '会议', '阅读',
  '运动', '健身', '做饭', '吃饭', '睡觉',
  '社交', '见朋友', '旅行', '出门', '在家',
  '追剧', '打游戏', '手工', '画画', '弹琴',
];

function extractEmotionTags(transcript: string): string[] {
  if (!transcript) return [];
  const hits: string[] = [];
  for (const word of [...POSITIVE_EMOTIONS, ...NEGATIVE_EMOTIONS]) {
    if (transcript.includes(word) && !hits.includes(word)) hits.push(word);
  }
  return hits;
}

function extractEventTags(transcript: string): string[] {
  if (!transcript) return [];
  const hits: string[] = [];
  for (const word of EVENT_SUGGESTIONS) {
    if (transcript.includes(word) && !hits.includes(word)) hits.push(word);
  }
  return hits;
}

function extractTimeMentions(transcript: string): string[] {
  if (!transcript) return [];
  const keywords = [
    '早上', '上午', '中午', '下午', '傍晚',
    '晚上', '深夜', '凌晨', '今天', '昨天', '明天',
    '周一', '周二', '周三', '周四', '周五', '周六', '周日',
  ];
  const hits: string[] = [];
  for (const word of keywords) {
    if (transcript.includes(word) && !hits.includes(word)) hits.push(word);
  }
  const matches = transcript.match(/\d{1,2}点(?:\d{1,2}分)?/g);
  if (matches) {
    for (const m of matches) {
      if (!hits.includes(m)) hits.push(m);
    }
  }
  return hits;
}

function todayStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

const VoiceEditor = ({
  mode,
  initialRecord,
  onSave,
  onCancel,
  saving,
}: VoiceEditorProps) => {
  const [step, setStep] = useState<'record' | 'edit'>(
    mode === 'edit' ? 'edit' : 'record',
  );
  const [durationSeconds, setDurationSeconds] = useState(
    initialRecord?.durationSeconds ?? 0,
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(
    initialRecord?.audioUrl ?? null,
  );
  const [transcript, setTranscript] = useState(
    initialRecord?.transcript ?? '',
  );
  const [emotionTags, setEmotionTags] = useState<string[]>(
    initialRecord?.emotionTags ?? [],
  );
  const [eventTags, setEventTags] = useState<string[]>(
    initialRecord?.eventTags ?? [],
  );
  const [timeMentions, setTimeMentions] = useState<string[]>(
    initialRecord?.timeMentions ?? [],
  );
  const [recordDate, setRecordDate] = useState(
    initialRecord?.recordDate ?? todayStr(),
  );
  const [customTagInput, setCustomTagInput] = useState('');
  const [activeTagSection, setActiveTagSection] = useState<
    'emotion' | 'event' | 'time' | null
  >(null);

  // 转写变化时自动提取标签（仅创建模式、用户未手动修改过标签的情况）
  const [tagsTouched, setTagsTouched] = useState(mode === 'edit');
  useEffect(() => {
    if (tagsTouched || !transcript) return;
    setEmotionTags(extractEmotionTags(transcript));
    setEventTags(extractEventTags(transcript));
    setTimeMentions(extractTimeMentions(transcript));
  }, [transcript, tagsTouched]);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setDurationSeconds(duration);
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    }
    setStep('edit');
  };

  const handleTagToggle = (
    tag: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setTagsTouched(true);
    if (current.includes(tag)) {
      setter(current.filter((t: string) => t !== tag));
    } else {
      setter([...current, tag]);
    }
  };

  const handleAddCustomTag = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[],
  ) => {
    const tag = customTagInput.trim();
    if (!tag || current.includes(tag)) return;
    setTagsTouched(true);
    setter([...current, tag]);
    setCustomTagInput('');
  };

  const emotionColor = (tag: string): string => {
    if (POSITIVE_EMOTIONS.includes(tag)) return 'bg-green-50 text-green-700 border-green-200';
    if (NEGATIVE_EMOTIONS.includes(tag)) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleSubmit = () => {
    onSave({
      durationSeconds,
      transcript,
      emotionTags,
      eventTags,
      timeMentions,
      recordDate,
      audioUrl: audioUrl ?? undefined,
    });
  };

  if (step === 'record') {
    return (
      <div className="bg-card rounded-xl p-6 md:p-8 shadow-sm border border-border">
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 md:p-6 shadow-sm border border-border space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground truncate min-w-0">
          {mode === 'edit' ? '编辑记录' : '记录详情'}
        </h3>
        <span className="text-sm text-muted-foreground flex-shrink-0">
          时长 {Math.floor(durationSeconds / 60)}分{durationSeconds % 60}秒
        </span>
      </div>

      {/* 音频播放 */}
       {audioUrl && (
         <div className="min-w-0">
           <audio controls src={audioUrl} className="w-full max-w-full" />
         </div>
       )}

      {/* 日期选择 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          记录日期
        </label>
        <input
          type="date"
          value={recordDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRecordDate(e.target.value)
          }
          className="w-full h-11 px-3 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground bg-background"
        />
      </div>

      {/* 转写文本 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          转写内容
        </label>
        <textarea
          value={transcript}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setTranscript(e.target.value)
          }
          placeholder="记录今天发生了什么、你的感受..."
          rows={5}
          className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground bg-background resize-none leading-relaxed"
        />
        {!tagsTouched && (
          <p className="mt-1 text-xs text-muted-foreground">
            系统将自动从文本中提取标签，你也可以手动调整
          </p>
        )}
      </div>

      {/* 情绪标签 */}
      <div>
        <button
          onClick={() =>
            setActiveTagSection(activeTagSection === 'emotion' ? null : 'emotion')
          }
          className="w-full flex items-center justify-between text-sm font-medium text-foreground mb-2"
        >
          <span>情绪标签 ({emotionTags.length})</span>
          <span className="text-primary">
            {activeTagSection === 'emotion' ? '收起' : '管理'}
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          {emotionTags.length === 0 ? (
            <span className="text-xs text-muted-foreground">暂无情绪标签</span>
          ) : (
            emotionTags.map((tag: string) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border ${emotionColor(tag)}`}
              >
                {tag}
                <button
                  onClick={() =>
                    handleTagToggle(tag, emotionTags, setEmotionTags)
                  }
                  className="hover:opacity-70"
                  aria-label={`删除${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        {activeTagSection === 'emotion' && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {[...POSITIVE_EMOTIONS, ...NEGATIVE_EMOTIONS].map((tag: string) => (
                <button
                  key={tag}
                  onClick={() =>
                    handleTagToggle(tag, emotionTags, setEmotionTags)
                  }
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    emotionTags.includes(tag)
                      ? emotionColor(tag)
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomTagInput(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag(setEmotionTags, emotionTags);
                  }
                }}
                placeholder="自定义情绪标签"
                className="flex-1 h-9 px-3 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-background"
              />
              <button
                onClick={() => handleAddCustomTag(setEmotionTags, emotionTags)}
                className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 事件标签 */}
      <div>
        <button
          onClick={() =>
            setActiveTagSection(activeTagSection === 'event' ? null : 'event')
          }
          className="w-full flex items-center justify-between text-sm font-medium text-foreground mb-2"
        >
          <span>事件标签 ({eventTags.length})</span>
          <span className="text-primary">
            {activeTagSection === 'event' ? '收起' : '管理'}
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          {eventTags.length === 0 ? (
            <span className="text-xs text-muted-foreground">暂无事件标签</span>
          ) : (
            eventTags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border bg-amber-50 text-amber-700 border-amber-200"
              >
                {tag}
                <button
                  onClick={() => handleTagToggle(tag, eventTags, setEventTags)}
                  className="hover:opacity-70"
                  aria-label={`删除${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        {activeTagSection === 'event' && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {EVENT_SUGGESTIONS.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag, eventTags, setEventTags)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    eventTags.includes(tag)
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomTagInput(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag(setEventTags, eventTags);
                  }
                }}
                placeholder="自定义事件标签"
                className="flex-1 h-9 px-3 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-background"
              />
              <button
                onClick={() => handleAddCustomTag(setEventTags, eventTags)}
                className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 时间提及 */}
      <div>
        <button
          onClick={() =>
            setActiveTagSection(activeTagSection === 'time' ? null : 'time')
          }
          className="w-full flex items-center justify-between text-sm font-medium text-foreground mb-2"
        >
          <span>时间提及 ({timeMentions.length})</span>
          <span className="text-primary">
            {activeTagSection === 'time' ? '收起' : '管理'}
          </span>
        </button>
        <div className="flex flex-wrap gap-2">
          {timeMentions.length === 0 ? (
            <span className="text-xs text-muted-foreground">暂无时间提及</span>
          ) : (
            timeMentions.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200"
              >
                {tag}
                <button
                  onClick={() =>
                    handleTagToggle(tag, timeMentions, setTimeMentions)
                  }
                  className="hover:opacity-70"
                  aria-label={`删除${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        {activeTagSection === 'time' && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomTagInput(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag(setTimeMentions, timeMentions);
                  }
                }}
                placeholder="自定义时间标签"
                className="flex-1 h-9 px-3 text-sm border border-border rounded-lg focus:outline-none focus:border-primary bg-background"
              />
              <button
                onClick={() => handleAddCustomTag(setTimeMentions, timeMentions)}
                className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 h-11 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          {mode === 'edit' ? '取消' : '放弃'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
        >
          {saving ? '保存中...' : mode === 'edit' ? '保存修改' : '保存记录'}
        </button>
      </div>
    </div>
  );
};

export default VoiceEditor;
