import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Heart, Sun, Moon, Zap, Timer } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';

const heroImage =
  '/spark/app/app_17edmw43ujk/runtime/api/v1/storage/object/bucket_aadkvypuhl6cw_static/static%2Faadkvzaqy7snw_ve_miaoda';

interface HeroSectionProps {
  scrollToFeatures: () => void;
}

export default function HeroSection({ scrollToFeatures }: HeroSectionProps) {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-12 sm:pt-12 sm:pb-16">
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-center">
        <div className="order-2 lg:order-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-border mb-4">
            <Sparkles className="w-3 h-3 text-warning" />
            <span className="text-[11px] font-medium text-muted-foreground">
              精力管理 · 可持续成长
            </span>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl text-foreground leading-[1.08] tracking-tight">
            量力而行，
            <br />
            <span className="relative inline-block mt-0.5">
              <span className="bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary)_/_0.98)] to-[hsl(var(--primary)_/_0.95)] bg-clip-text text-transparent">
                才是持续成长的开始
              </span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                height="8"
                viewBox="0 0 300 10"
                fill="none"
              >
                <path
                  d="M2 8 Q 75 2, 150 6 T 298 4"
                  stroke="hsl(var(--primary) / 0.5)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-4 text-sm text-foreground/80 leading-relaxed max-w-lg">
            一款以精力为核心的个人成长工具。
            摆脱假性自律的焦虑，找到属于自己的成长节奏——
            <span className="text-primary font-medium">
              不比较、不内耗，慢慢来，比较快。
            </span>
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200"
            >
              免费开始使用
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.75}
              />
            </Link>
            <button
              onClick={scrollToFeatures}
              className="bg-card text-foreground border border-border rounded-lg h-9 px-4 text-sm hover:bg-muted/30 transition-colors inline-flex items-center gap-1.5"
            >
              了解功能
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center">
                <Heart className="w-3 h-3 text-primary" strokeWidth={1.75} />
              </div>
              <span>温和无焦虑</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-warning/20 flex items-center justify-center">
                <Sun className="w-3 h-3 text-warning" strokeWidth={1.75} />
              </div>
              <span>可持续成长</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-info/15 flex items-center justify-center">
                <Moon className="w-3 h-3 text-info" strokeWidth={1.75} />
              </div>
              <span>量力不勉强</span>
            </div>
          </div>
        </div>

        {/* Hero visual */}
        <div className="order-1 lg:order-2 relative">
          {/* Glow layers — 克制版：2 个光斑 */}
          <div className="absolute -inset-5 bg-gradient-to-br from-primary/10 via-secondary/30 to-transparent rounded-[2.5rem] blur-3xl -z-10" />
          <div className="absolute top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-warning/30 to-transparent blur-2xl -z-10" />

          {/* Main image frame */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-card/80 to-background/80 rounded-[1.75rem] shadow-md -z-10" />
            <div className="overflow-hidden rounded-[1.25rem] paper-card relative">
               <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-black/10 pointer-events-none z-10" />
               <Image
                 src={heroImage}
                 alt="晨光森林"
                 className="w-full h-auto rounded-[1.25rem] object-cover transition-transform duration-700 hover:scale-105 brightness-[0.9] contrast-[1.05]"
               />
             </div>

            {/* Floating card - energy */}
            <div className="absolute left-2 sm:-left-3 top-6 sm:top-10 backdrop-blur-md bg-card/60 border border-border/50 rounded-xl p-2 flex items-center gap-2 animate-[float_6s_ease-in-out_infinite] shadow-lg shadow-foreground/5 z-20">
              <div className="w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center flex-shrink-0">
                <Zap className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="eyebrow-label leading-none">今日负荷</div>
                <div className="text-xs font-semibold text-foreground mt-0.5">舒适区 · 68%</div>
              </div>
            </div>

            {/* Floating card - focus */}
            <div className="absolute right-2 sm:-right-2 bottom-8 sm:bottom-16 backdrop-blur-md bg-card/60 border border-border/50 rounded-xl p-2 flex items-center gap-2 animate-[float_6s_ease-in-out_infinite] [animation-delay:-2s] shadow-lg shadow-foreground/5 z-20">
              <div className="w-7 h-7 rounded-lg bg-warning/30 flex items-center justify-center flex-shrink-0">
                <Timer className="w-3.5 h-3.5 text-warning" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="eyebrow-label leading-none">本周专注</div>
                <div className="text-xs font-semibold text-foreground mt-0.5">12h 30m</div>
              </div>
            </div>

            {/* Floating stat pill */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 backdrop-blur-md bg-card/70 border border-border/50 rounded-full shadow-lg shadow-foreground/5 px-3 py-1 text-xs text-muted-foreground flex items-center gap-1.5 z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              连续成长
              <span className="display-number text-sm font-semibold text-foreground">14</span>
              天
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
