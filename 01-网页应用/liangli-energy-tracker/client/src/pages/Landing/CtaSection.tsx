import { Link } from 'react-router-dom';
import { Leaf, ArrowRight } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="relative z-10 pt-2 pb-10 sm:pb-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden memo-card bg-card text-card-foreground border border-border/60 shadow-sm">
          {/* Accent glow blobs — 克制版：2 个 */}
          <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-5 px-5 py-4.5 sm:px-7 sm:py-5">
            {/* Left: brand mark + text */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                  <Leaf
                    className="w-5 h-5 text-primary-foreground"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent/40 blur-sm" />
              </div>
              <div className="min-w-0">
                <div className="eyebrow-label mb-0.5">Start Your Journey</div>
                <h2 className="font-serif-display text-base sm:text-lg text-foreground leading-tight">
                  从今天起，和自己好好相处
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 hidden sm:block">
                  免费注册，无套路，不催进度。慢慢走，比较快。
                </p>
              </div>
            </div>

            {/* Divider (desktop) */}
            <div className="hidden sm:block w-px h-10 bg-border/70" />

            {/* Right: actions */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2.5 sm:gap-2 flex-shrink-0">
              <Link
                to="/register"
                className="group inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 w-full sm:w-auto justify-center"
              >
                立即注册
                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                />
              </Link>
              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md px-2 py-1 transition-colors text-xs"
              >
                已有账号？去登录
              </Link>
            </div>
          </div>

          {/* Mobile subtitle */}
          <p className="sm:hidden text-xs text-muted-foreground leading-relaxed px-5 pb-4 -mt-1">
            免费注册，无套路，不催进度。慢慢走，比较快。
          </p>
        </div>
      </div>
    </section>
  );
}
