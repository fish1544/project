import { useTheme } from '@client/src/contexts/ThemeContext';
import { Check } from 'lucide-react';

interface ThemeSwitcherProps {
  layout?: 'row' | 'grid';
}

export default function ThemeSwitcher({
  layout = 'grid',
}: ThemeSwitcherProps) {
  const { theme, setTheme, themes } = useTheme();

  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-2 gap-3'
      : 'flex flex-row gap-3 flex-wrap';

  return (
    <div className={containerClass}>
      {themes.map((t) => {
        const isActive = theme === t.id;
        const [primary, background, accent] = t.colors;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`group relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ease-out ${
              isActive
                ? 'ring-2 ring-primary/60 bg-primary/5 shadow-soft scale-[1.02]'
                : 'bg-white/60 hover:bg-white hover:shadow-soft-sm border border-stone-100'
            }`}
            aria-pressed={isActive}
          >
            {/* 色卡预览：3 层有机堆叠 */}
            <div className="relative w-12 h-12 mb-2">
              {/* 底层：背景色 */}
              <div
                className="absolute inset-0 rounded-full shadow-inner"
                style={{ backgroundColor: background }}
              />
              {/* 中层：强调色（左下偏移的有机半圆） */}
              <div
                className="absolute bottom-0 left-0 w-8 h-5 rounded-bl-full rounded-tr-[60%] rounded-br-md"
                style={{ backgroundColor: accent, opacity: 0.85 }}
              />
              {/* 顶层：主色小圆 */}
              <div
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full shadow-sm"
                style={{ backgroundColor: primary }}
              />
              {/* 选中态勾选 */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* 名称 */}
            <span
              className={`text-xs font-medium transition-colors ${
                isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'
              }`}
            >
              {t.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
