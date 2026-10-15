import { useState, useEffect } from 'react';
import {
  BookOpen,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Coffee,
  RefreshCw,
  Sparkles,
  Heart,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@client/src/components/ui/accordion';
import { manualApi } from '@client/src/api';
import type { UserManual, StressThreshold, HabitSuggestion } from '@shared/api.interface';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  工作: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  休息: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  运动: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  睡眠: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  社交: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  自我觉察: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['自我觉察'];
}

function getTimeIcon(text: string) {
  if (text.includes('上午') || text.includes('早晨')) return <Sunrise className="w-5 h-5" />;
  if (text.includes('下午') || text.includes('中午')) return <Sun className="w-5 h-5" />;
  if (text.includes('晚上') || text.includes('晚间') || text.includes('傍晚')) return <Sunset className="w-5 h-5" />;
  if (text.includes('深夜') || text.includes('凌晨') || text.includes('夜里'))
    return <Moon className="w-5 h-5" />;
  return <Clock className="w-5 h-5" />;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ManualPage = () => {
  const [manual, setManual] = useState<UserManual | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadLatest();
  }, []);

  const loadLatest = async () => {
    setLoading(true);
    try {
      const data = await manualApi.getLatestManual();
      setManual(data);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (force = false) => {
    setGenerating(true);
    try {
      const data = await manualApi.generateManual(force);
      setManual(data);
    } catch {
      // 静默失败
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // 空状态
  if (!manual) {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">个人使用说明书</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            基于你的数据生成的专属说明书，更了解你自己
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">尚未生成说明书</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              基于你最近 30 天的语音记录和计时数据，生成一份专属于你的个人使用说明书。
              了解你的精力节律、压力阈值和优化建议。
            </p>
            <Button onClick={() => handleGenerate(false)} disabled={generating} size="lg">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成我的使用说明书
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Sun, title: '能量节律', desc: '了解你一天中什么时候状态最好', color: 'from-amber-100 to-orange-100 text-amber-600' },
            { icon: AlertCircle, title: '压力阈值', desc: '识别你的压力信号和应对方式', color: 'from-rose-100 to-pink-100 text-rose-600' },
            { icon: Lightbulb, title: '习惯建议', desc: '基于数据的个性化行动建议', color: 'from-indigo-100 to-purple-100 text-indigo-600' },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-6 md:py-8">
      {/* 头部 */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">个人使用说明书</h1>
           <p className="mt-1 text-sm text-muted-foreground break-words">
             第 {manual.version} 版 · 生成于 {formatDate(manual.generatedAt)}
           </p>
        </div>
        <Button
          variant="outline"
          onClick={() => handleGenerate(true)}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              重新生成中
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              重新生成
            </>
          )}
        </Button>
      </div>

      {/* 精力节律表 - 时间轴样式 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-600" />
            </div>
            <span>精力节律表</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            {/* 时间轴竖线 */}
            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-amber-300 via-orange-300 to-indigo-300 rounded-full" />
            <div className="space-y-4">
              {manual.energyRhythm.map((rhythm, idx) => {
                const colorClass =
                  rhythm.includes('上午') || rhythm.includes('黄金')
                    ? 'bg-amber-500'
                    : rhythm.includes('下午') || rhythm.includes('回落')
                      ? 'bg-orange-500'
                      : rhythm.includes('晚上') || rhythm.includes('创意')
                        ? 'bg-indigo-500'
                        : 'bg-gray-400';
                return (
                  <div key={idx} className="relative">
                    {/* 圆点 */}
                    <div
                      className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full ${colorClass} border-2 border-white shadow-sm`}
                    />
                    <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                       <div className="flex items-start gap-3 min-w-0">
                         <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                           {getTimeIcon(rhythm)}
                         </div>
                         <p className="text-sm text-foreground leading-relaxed break-words min-w-0">{rhythm}</p>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 压力阈值清单 - Accordion */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <span>压力阈值清单</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            {manual.stressThresholds.map((item: StressThreshold, idx: number) => (
              <AccordionItem key={idx} value={`threshold-${idx}`}>
                   <AccordionTrigger className="py-3">
                     <div className="flex items-center gap-3 min-w-0">
                       <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                         <span className="text-xs text-rose-600 font-medium">{idx + 1}</span>
                       </div>
                       <span className="text-foreground font-medium text-left truncate min-w-0">{item.threshold}</span>
                     </div>
                   </AccordionTrigger>
                <AccordionContent className="pl-9">
                  <div className="space-y-3 pb-2">
                     <div className="flex gap-3 min-w-0">
                       <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                         <AlertCircle className="w-3 h-3 text-amber-600" />
                       </div>
                       <div className="min-w-0">
                         <p className="text-xs font-medium text-muted-foreground mb-0.5">症状表现</p>
                         <p className="text-sm text-foreground break-words">{item.symptom}</p>
                       </div>
                     </div>
                     <div className="flex gap-3 min-w-0">
                       <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                         <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                       </div>
                       <div className="min-w-0">
                         <p className="text-xs font-medium text-muted-foreground mb-0.5">应对方案</p>
                         <p className="text-sm text-foreground break-words">{item.solution}</p>
                       </div>
                     </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* 习惯优化建议 - Grid 布局 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-indigo-600" />
            </div>
            <span>习惯优化建议</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {manual.habitSuggestions.map((item: HabitSuggestion, idx: number) => {
              const colors = getCategoryColor(item.category);
              return (
                <div
                  key={idx}
                  className={`rounded-xl p-4 border ${colors.border} ${colors.bg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                >
                  <Badge
                    variant="secondary"
                    className={`mb-3 ${colors.bg} ${colors.text} border border-transparent`}
                  >
                    {item.category}
                  </Badge>
                   <h3 className={`font-semibold ${colors.text} mb-2 break-words`}>{item.suggestion}</h3>
                   <div className="flex items-start gap-2 min-w-0">
                     <Coffee className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                     <p className="text-sm text-foreground/80 break-words min-w-0">{item.action}</p>
                   </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 个人洞察 - 引用样式 */}
      <Card className="bg-gradient-to-br from-rose-50 via-amber-50 to-indigo-50 border-rose-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-rose-700">个人洞察</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
           <blockquote className="text-foreground/80 italic leading-relaxed whitespace-pre-line text-base border-l-4 border-rose-300 pl-4 break-words">
             {manual.personalInsights}
           </blockquote>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualPage;
