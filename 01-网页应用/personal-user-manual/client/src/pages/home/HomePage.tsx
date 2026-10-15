import { Link } from 'react-router-dom';
import {
  Mic,
  Timer,
  FileText,
  BookOpen,
  Zap,
  Target,
  Lightbulb,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

const HomePage = () => {
  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const featureCards = [
    {
      icon: Mic,
      title: '语音记录系统',
      desc: '随时随地点按录制，AI 自动提取情绪标签、事件标签和时间点，让记录零门槛。',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      icon: Timer,
      title: '多场景计时',
      desc: '工作、学习、创作、休息等 8 大分类，记录每段时间的去向，看清你的时间花在哪里。',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: FileText,
      title: 'AI 多维度复盘',
      desc: '日/周/月自动复盘，从成就感、压力源、触发点、行为模式四个维度深度剖析。',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: BookOpen,
      title: '个人使用说明书',
      desc: '基于你的数据生成专属说明书——能量节律、压力阈值、习惯建议，更了解自己。',
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  const designPrinciples = [
    {
      icon: Zap,
      title: '低门槛记录',
      desc: '语音一键录制，计时一键开始，不打断当下的状态，记录本身不成为负担。',
    },
    {
      icon: Target,
      title: '个性化分析',
      desc: '每个人的模式都不同。AI 基于你自己的数据建模，而不是套用通用模板。',
    },
    {
      icon: Lightbulb,
      title: '可落地建议',
      desc: '拒绝空泛鸡汤。每条建议都附带具体行动项，知道之后立刻就能做。',
    },
  ];

  return (
    <div className="bg-background">
      {/* Hero 区块 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              <span>你的个人内省工具</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              个人使用说明书
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed">
              不与自己对抗，只执行自己的脚本
            </p>
            <p className="mt-6 text-base text-muted-foreground max-w-xl mx-auto">
              用语音记录当下的感受，用计时追踪时间的去向，
              让 AI 帮你发现行为背后的规律，生成专属于你的使用说明书。
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                开始使用
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={scrollToFeatures}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-border bg-card text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
              >
                了解更多
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能区 */}
      <section id="features" className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">核心功能</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            从记录到分析再到行动，一套工具帮你完成自我探索的闭环
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-card rounded-xl p-5 md:p-6 shadow-sm border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 设计理念区 */}
      <section className="bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">设计理念</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              我们相信，工具应该服务于人，而不是反过来增加人的负担
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {designPrinciples.map((principle) => {
              const Icon = principle.icon;
              return (
                <div
                  key={principle.title}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border"
                >
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{principle.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {principle.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 价值主张区 */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-16 md:py-20">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold">
            从今天开始，真正了解自己
          </h2>
          <p className="mt-4 text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            很多人活了几十年，却并不真正了解自己——什么时候能量最高？什么情况下最容易崩溃？
            什么样的休息方式对自己最有效？<br className="hidden md:inline" />
            个人使用说明书，帮你用数据回答这些问题。
            当你越来越了解自己，就越来越少内耗，越来越从容。
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              免费开始使用
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              已有账号，去登录
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
