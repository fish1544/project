import {
  CheckSquare,
  Lightbulb,
  Timer,
  BookOpen,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: <CheckSquare className="w-5 h-5" strokeWidth={1.75} />,
    title: '负荷系统',
    subtitle: 'Energy Load',
    description:
      '用精力值量化任务，实时负荷进度条让今日容量一目了然。不再盲目叠加，也不再假装充实。',
    iconBg: 'bg-secondary',
    iconColor: 'text-primary',
    number: '01',
  },
  {
    icon: <Lightbulb className="w-5 h-5" strokeWidth={1.75} />,
    title: '成长池',
    subtitle: 'Growth Pool',
    description:
      '灵感、想法、未准备好的目标先存进成长池。精力充足时再转化为行动，不流失，也不添负担。',
    iconBg: 'bg-warning/20',
    iconColor: 'text-warning',
    number: '02',
  },
  {
    icon: <Timer className="w-5 h-5" strokeWidth={1.75} />,
    title: '专注计时',
    subtitle: 'Focus Timer',
    description:
      '番茄钟与自由计时双模式，多维度数据看板呈现专注节奏。不比拼时长，找到自己的高效节律。',
    iconBg: 'bg-info/15',
    iconColor: 'text-info',
    number: '03',
  },
  {
    icon: <BookOpen className="w-5 h-5" strokeWidth={1.75} />,
    title: '周期复盘',
    subtitle: 'Weekly Review',
    description:
      '每周自动生成复盘报告，完成率、精力趋势、专注分布一目了然。看见轨迹，才能走得更稳。',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    number: '04',
  },
  {
    icon: <Users className="w-5 h-5" strokeWidth={1.75} />,
    title: '匿名社区',
    subtitle: 'Community',
    description:
      '看看别人正在为什么努力，打破信息茧房。严格隐私保护，你同意才公开。',
    iconBg: 'bg-success/15',
    iconColor: 'text-success',
    number: '05',
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="relative z-10 py-10 sm:py-12">
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
       <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 max-w-xl mx-auto">
           <span className="eyebrow-label mb-2 inline-block">核心功能</span>
          <h2 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight leading-tight">
            为真正的成长而设计
          </h2>
          <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
            五个核心模块，覆盖从想法到行动、从执行到复盘的完整成长链路
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {features.slice(0, 3).map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5 mt-3.5">
          {features.slice(3).map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  iconBg: string;
  iconColor: string;
  number: string;
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="paper-card paper-card-hover group relative p-4 overflow-hidden">
      <div className="absolute top-2 right-3 display-number text-2xl text-border/60 leading-none select-none">
        {feature.number}
      </div>
      <div className="flex gap-3.5 items-start">
        <div
          className={`w-9 h-9 rounded-lg ${feature.iconBg} ${feature.iconColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}
        >
          {feature.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="eyebrow-label mb-1">{feature.subtitle}</div>
          <h3 className="font-serif-display text-base text-foreground mb-1 leading-snug">
            {feature.title}
          </h3>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
}
