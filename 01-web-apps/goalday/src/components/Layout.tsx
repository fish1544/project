import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, Flame, BookOpen, ListChecks, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';

const NAV_ITEMS = [
  { path: '/', label: '周计划', icon: CalendarDays },
  { path: '/habits', label: '习惯', icon: Flame },
  { path: '/journal', label: '日记', icon: BookOpen },
  { path: '/todo', label: '清单', icon: ListChecks },
];

export const Layout = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Target className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight">GoalDay</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3.5',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
};
