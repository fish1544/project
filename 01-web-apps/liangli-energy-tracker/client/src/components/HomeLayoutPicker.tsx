import { useHomeLayout } from '@client/src/contexts/HomeLayoutContext';
import { Check, Sparkles } from 'lucide-react';

interface HomeLayoutPickerProps {
  onClose?: () => void;
}

export default function HomeLayoutPicker({ onClose }: HomeLayoutPickerProps) {
  const { layout, setLayout, layouts } = useHomeLayout();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {layouts.map((l) => {
          const isActive = layout === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setLayout(l.id)}
              className={`group relative overflow-hidden rounded-xl transition-all duration-300 text-left ${
                isActive
                  ? 'ring-2 ring-primary shadow-soft scale-[1.02]'
                  : 'border border-border/60 hover:border-border hover:shadow-sm'
              }`}
            >
              {/* 封面预览 */}
              <div
                className="relative h-20 w-full"
                style={{
                  background: `linear-gradient(135deg, ${l.cover.from} 0%, ${l.cover.via} 50%, ${l.cover.to} 100%)`,
                }}
              >
                {/* 装饰元素 */}
                {l.id === 'forest-dawn' && (
                  <>
                    <div className="absolute top-2 right-3 w-4 h-4 rounded-full bg-white/30 blur-sm" />
                    <div className="absolute bottom-1.5 left-3 w-6 h-3 rounded-full bg-emerald-600/20 blur-[2px]" />
                  </>
                )}
                {l.id === 'warm-sunset' && (
                  <>
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-yellow-300/60 blur-[1px]" />
                    <div className="absolute bottom-1 left-2 right-2 h-1.5 rounded-full bg-orange-400/30" />
                  </>
                )}
                {l.id === 'ocean-breeze' && (
                  <>
                    <div className="absolute top-2 right-2 w-4 h-2 rounded-full bg-white/40 blur-[1px]" />
                    <div className="absolute bottom-2 left-2 right-3 h-1 bg-white/25 rounded-full" />
                    <div className="absolute bottom-3.5 left-4 right-5 h-0.5 bg-white/20 rounded-full" />
                  </>
                )}
                {l.id === 'sakura-dream' && (
                  <>
                    <div className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-pink-300/60" />
                    <div className="absolute top-4 right-6 w-1.5 h-1.5 rounded-full bg-pink-400/50" />
                    <div className="absolute bottom-2 left-3 w-1.5 h-1.5 rounded-full bg-rose-300/60" />
                    <div className="absolute bottom-3 left-6 w-1 h-1 rounded-full bg-pink-400/40" />
                  </>
                )}
                {l.id === 'starry-night' && (
                  <>
                    <div className="absolute top-1.5 right-2 w-1 h-1 rounded-full bg-white/80" />
                    <div className="absolute top-3 right-6 w-0.5 h-0.5 rounded-full bg-white/60" />
                    <div className="absolute top-4 left-3 w-1.5 h-1.5 rounded-full bg-white/70" />
                    <div className="absolute bottom-2 left-5 w-0.5 h-0.5 rounded-full bg-white/50" />
                    <div className="absolute bottom-3 right-4 w-1 h-1 rounded-full bg-violet-300/70" />
                  </>
                )}
                {l.id === 'minimal-ink' && (
                  <>
                    <div className="absolute top-2.5 right-3 w-6 h-px bg-stone-500/40" />
                    <div className="absolute top-4 right-3 w-4 h-px bg-stone-400/30" />
                    <div className="absolute bottom-2.5 left-3 w-3 h-3 rounded-full border border-stone-400/40" />
                  </>
                )}

                {/* 选中态勾选 */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                  </div>
                )}
              </div>

              {/* 名称 + 描述 */}
              <div className="p-2.5 bg-card">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles
                    className={`w-3 h-3 ${
                      isActive ? 'text-primary' : 'text-muted-foreground/50'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-foreground' : 'text-foreground/80'
                    }`}
                  >
                    {l.name}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-1">
                  {l.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        点击方案立即切换，自动保存
      </p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-full h-9 text-sm rounded-lg bg-muted/40 text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          完成
        </button>
      )}
    </div>
  );
}
