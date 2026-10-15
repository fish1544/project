import { useState, useCallback } from 'react';
import { Star, MessageCircleHeart, Check, Loader2 } from 'lucide-react';
import { feedbackApi } from '@client/src/api';
import { toast } from 'sonner';

interface RatingItem {
  key:
    | 'voiceRecognitionRating'
    | 'aiReviewAccuracyRating'
    | 'timerUsabilityRating'
    | 'overallRating';
  title: string;
  subtitle: string;
}

const ratingItems: RatingItem[] = [
  {
    key: 'voiceRecognitionRating',
    title: '语音识别准确率',
    subtitle: '语音转文字的准确度如何？',
  },
  {
    key: 'aiReviewAccuracyRating',
    title: 'AI 复盘精准度',
    subtitle: 'AI 分析是否说到了你心里？',
  },
  {
    key: 'timerUsabilityRating',
    title: '计时功能实用性',
    subtitle: '计时功能对你有帮助吗？',
  },
  {
    key: 'overallRating',
    title: '整体满意度',
    subtitle: '整体使用体验怎么样？',
  },
];

function getRatingLabel(rating: number): string {
  if (rating === 0) return '请评分';
  if (rating <= 2) return '还有待改进，我们会努力';
  if (rating === 3) return '一般般，还有提升空间';
  return '很棒！感谢你的认可';
}

function getRatingLabelColor(rating: number): string {
  if (rating === 0) return 'text-gray-400';
  if (rating <= 2) return 'text-red-500';
  if (rating === 3) return 'text-amber-500';
  return 'text-emerald-500';
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className="w-11 h-11 flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            aria-label={`${star} 星`}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

const FeedbackPage = () => {
  const [ratings, setRatings] = useState<Record<string, number>>({
    voiceRecognitionRating: 0,
    aiReviewAccuracyRating: 0,
    timerUsabilityRating: 0,
    overallRating: 0,
  });
  const [suggestions, setSuggestions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasAnyContent =
    ratings.voiceRecognitionRating > 0 ||
    ratings.aiReviewAccuracyRating > 0 ||
    ratings.timerUsabilityRating > 0 ||
    ratings.overallRating > 0 ||
    suggestions.trim().length > 0;

  const handleRatingChange = useCallback((key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasAnyContent || submitting) return;

      setSubmitting(true);
      try {
        await feedbackApi.submitFeedback({
          voiceRecognitionRating:
            ratings.voiceRecognitionRating > 0
              ? ratings.voiceRecognitionRating
              : undefined,
          aiReviewAccuracyRating:
            ratings.aiReviewAccuracyRating > 0
              ? ratings.aiReviewAccuracyRating
              : undefined,
          timerUsabilityRating:
            ratings.timerUsabilityRating > 0
              ? ratings.timerUsabilityRating
              : undefined,
          overallRating:
            ratings.overallRating > 0 ? ratings.overallRating : undefined,
          suggestions: suggestions.trim() || undefined,
        });
        setSubmitted(true);
      } catch (error) {
        toast.error('提交失败，请稍后再试');
      } finally {
        setSubmitting(false);
      }
    },
    [hasAnyContent, submitting, ratings, suggestions],
  );

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 md:px-6 lg:px-8 py-12 md:py-20">
        <div className="bg-white rounded-xl p-8 md:p-10 shadow-sm border border-gray-200 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-emerald-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">感谢你的反馈！</h2>
          <p className="mt-3 text-gray-500 leading-relaxed">
            你的每一条建议都很珍贵，
            <br />
            我们会认真倾听，持续打磨产品。
          </p>
          <div className="mt-8 text-sm text-gray-400">
            愿你每天都更懂自己一点 ✨
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 md:px-6 lg:px-8 py-8 md:py-12">
      {/* 标题区 */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-md">
          <MessageCircleHeart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">内测反馈</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          你的每一条建议，都能让产品更懂自己
          <br />
          （也更懂你）
        </p>
      </div>

      {/* 评分区 + 建议区 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-200 space-y-6"
      >
        {ratingItems.map((item) => (
          <div key={item.key} className="space-y-2">
            <div>
              <label className="text-sm font-semibold text-gray-800">
                {item.title}
              </label>
              <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
            </div>
            <StarRating
              value={ratings[item.key]}
              onChange={(v) => handleRatingChange(item.key, v)}
            />
            <p
              className={`text-xs font-medium ${getRatingLabelColor(
                ratings[item.key],
              )}`}
            >
              {getRatingLabel(ratings[item.key])}
            </p>
          </div>
        ))}

        <div className="h-px bg-gray-100" />

        {/* 建议区 */}
        <div className="space-y-2">
          <label
            htmlFor="suggestions"
            className="text-sm font-semibold text-gray-800"
          >
            想对我们说的话
          </label>
          <textarea
            id="suggestions"
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value.slice(0, 2000))}
            placeholder="有什么想对我们说的？功能建议、使用痛点、喜欢的地方...都可以"
            rows={5}
            maxLength={2000}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none text-sm leading-relaxed"
          />
          <div className="text-right text-xs text-gray-400">
            {suggestions.length}/2000
          </div>
        </div>

        {/* 提交区 */}
        <button
          type="submit"
          disabled={!hasAnyContent || submitting}
          className="w-full h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-indigo-500 disabled:hover:to-indigo-600 flex items-center justify-center gap-2 shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              提交中...
            </>
          ) : (
            '提交反馈'
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        你的反馈将匿名保存，仅用于产品改进
      </p>
    </div>
  );
};

export default FeedbackPage;
