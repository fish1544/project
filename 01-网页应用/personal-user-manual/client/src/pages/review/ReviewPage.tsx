import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  AlertTriangle,
  Zap,
  Activity,
  FileText,
  Sparkles,
  Calendar,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { reviewApi } from '@client/src/api';
import type { ReviewReport, ReviewType } from '@shared/api.interface';

const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  daily: '日复盘',
  weekly: '周复盘',
  monthly: '月复盘',
};

const ReviewPage = () => {
  const [activeType, setActiveType] = useState<ReviewType>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [currentReport, setCurrentReport] = useState<ReviewReport | null>(null);
  const [historyList, setHistoryList] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // 根据类型计算时间段
  const getPeriodRange = useCallback((type: ReviewType, dateStr: string) => {
    const date = new Date(dateStr);
    if (type === 'daily') {
      return { start: dateStr, end: dateStr };
    }
    if (type === 'weekly') {
      const day = date.getDay();
      const diff = day === 0 ? 6 : day - 1; // 周一为一周开始
      const monday = new Date(date);
      monday.setDate(date.getDate() - diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().slice(0, 10),
        end: sunday.toISOString().slice(0, 10),
      };
    }
    // monthly
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().slice(0, 10),
      end: lastDay.toISOString().slice(0, 10),
    };
  }, []);

  const loadHistory = useCallback(async (type: ReviewType) => {
    setLoading(true);
    try {
      const res = await reviewApi.getReviewReports(1, 20);
      const filtered = res.items.filter((item) => item.reviewType === type);
      setHistoryList(filtered);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(activeType);
    setCurrentReport(null);
  }, [activeType, loadHistory]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { start, end } = getPeriodRange(activeType, selectedDate);
      const report = await reviewApi.generateReview({
        reviewType: activeType,
        periodStart: start,
        periodEnd: end,
      });
      setCurrentReport(report);
      loadHistory(activeType);
    } catch {
      // 静默失败
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = async (id: string) => {
    try {
      const report = await reviewApi.getReviewReport(id);
      setCurrentReport(report);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // 静默失败
    }
  };

  const periodLabel = (() => {
    const { start, end } = getPeriodRange(activeType, selectedDate);
    if (start === end) return start;
    return `${start} ~ ${end}`;
  })();

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">复盘报告</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 多维度复盘，从数据中发现你的行为模式
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['daily', 'weekly', 'monthly'] as ReviewType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-4 h-9 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeType === type
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {REVIEW_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* 日期选择 + 生成按钮 */}
      <Card className="mb-6">
        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-3 flex-1">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">当前周期</p>
              <p className="font-medium text-foreground">{periodLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-none h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成复盘
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 生成中状态 */}
      {generating && !currentReport && (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
             <h2 className="text-lg font-semibold text-foreground mb-2 break-words">AI 正在分析你的数据...</h2>
            <p className="text-sm text-muted-foreground">
              正在从语音记录和计时数据中挖掘你的行为模式
            </p>
          </CardContent>
        </Card>
      )}

      {/* 复盘结果展示 */}
      {currentReport && !generating && (
        <div className="space-y-5 mb-8" data-ai-section-type="card-list">
          {/* 成就 */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-emerald-700">成就亮点</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentReport.achievements.map((item, idx) => (
                   <li key={idx} className="flex items-start gap-2 text-foreground">
                     <span className="text-emerald-500 mt-1 flex-shrink-0">✓</span>
                     <span className="min-w-0 break-words">{item}</span>
                   </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 压力来源 */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-orange-700">压力来源</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentReport.stressSources.map((item, idx) => (
                   <li key={idx} className="flex items-start gap-2 text-foreground">
                     <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                     <span className="min-w-0 break-words">{item}</span>
                   </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 触发点 */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-amber-700">情绪触发点</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentReport.triggerPoints.map((item, idx) => (
                   <li key={idx} className="flex items-start gap-2 text-foreground">
                     <span className="text-amber-500 mt-1 flex-shrink-0">⚡</span>
                     <span className="min-w-0 break-words">{item}</span>
                   </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 行为规律 */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-blue-700">行为规律</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentReport.behaviorPatterns.map((item, idx) => (
                   <li key={idx} className="flex items-start gap-2 text-foreground">
                     <span className="text-blue-500 mt-1 flex-shrink-0">📊</span>
                     <span className="min-w-0 break-words">{item}</span>
                   </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 总结 */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-indigo-700">综合总结</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-foreground leading-relaxed whitespace-pre-line break-words">
                 {currentReport.summary}
               </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {!currentReport && !generating && historyList.length === 0 && !loading && (
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">暂无复盘报告</h2>
            <p className="text-sm text-muted-foreground mb-6">
              选择日期并点击「生成复盘」，AI 将基于你的语音和计时记录生成分析
            </p>
            <Button onClick={handleGenerate}>
              <Sparkles className="w-4 h-4" />
              生成复盘
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 历史复盘列表 */}
      {historyList.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">历史复盘</h2>
          <div className="space-y-3">
            {historyList.map((report) => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => handleViewReport(report.id)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {REVIEW_TYPE_LABELS[report.reviewType]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {report.periodStart}
                        {report.periodStart !== report.periodEnd && ` ~ ${report.periodEnd}`}
                      </span>
                    </div>
                    <p className="text-sm text-foreground truncate">
                      {report.summary || '查看详细复盘内容'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
