import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import HeroSection from './HeroSection';
import FeatureSection from './FeatureSection';
import PhilosophySection from './PhilosophySection';
import CtaSection from './CtaSection';

export default function LandingPage() {
  const scrollToFeatures = () => {
    document
      .getElementById('features')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative text-foreground">
      {/* Background decorative layers — 克制版：2 个光斑 */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
        <div className="absolute top-[200px] left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-warning/10 to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50">
        <div className="bg-background/60 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-sm group-hover:shadow transition-all duration-200">
                <Leaf className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.75} />
              </div>
              <span className="font-serif-display text-sm text-foreground tracking-tight">
                量力
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: '功能', action: scrollToFeatures },
                { label: '理念', action: () => {} },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="bg-primary text-primary-foreground rounded-lg h-9 px-3.5 text-xs font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 inline-flex items-center"
              >
                免费开始
              </Link>
            </div>
          </div>
        </div>
      </header>

      <HeroSection scrollToFeatures={scrollToFeatures} />
       <div className="relative z-10 h-px max-w-xs mx-auto bg-gradient-to-r from-transparent via-border/60 to-transparent" />
       <FeatureSection />
       <PhilosophySection />
       <CtaSection />

      {/* Footer */}
      <footer className="relative z-10 py-4 border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-primary to-success flex items-center justify-center">
                <Leaf className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={1.75} />
              </div>
              <span className="font-serif-display text-sm text-foreground">量力</span>
            </div>
            <div className="text-xs text-muted-foreground">
              让成长更可持续 · © 2025 量力
            </div>
          </div>
        </div>
      </footer>

      {/* Custom keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
