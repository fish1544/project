import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Lightbulb,
  Timer,
  BarChart3,
  BookOpen,
  Users,
  User,
  LogOut,
  Menu,
  Leaf,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@client/src/contexts/AuthContext';
import RequireAuth from '@client/src/components/RequireAuth';
import { useIsMobile } from '@client/src/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@client/src/components/ui/sheet';
import { Button } from '@client/src/components/ui/button';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/app', label: '首页', icon: <LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={1.75} /> },
  { to: '/app/tasks', label: '任务', icon: <CheckSquare className="w-[18px] h-[18px]" strokeWidth={1.75} /> },
  { to: '/app/growth', label: '成长池', icon: <Lightbulb className="w-[18px] h-[18px]" strokeWidth={1.75} /> },
  { to: '/app/focus', label: '专注', icon: <Timer className="w-[18px] h-[18px]" strokeWidth={1.75} /> },
  { to: '/app/stats', label: '数据', icon: <BarChart3 className="w-[18px] h-[18px]" strokeWidth={1.75} /> },
  { to: '/app/review', label: '复盘', icon: <BookOpen className="w-[18px] h-[18px]" strokeWidth={1.75} /> },
  { to: '/app/community', label: '社区', icon: <Users className="w-[18px] h-[18px]" strokeWidth={1.75} /> },
  { to: '/app/profile', label: '我的', icon: <User className="w-[18px] h-[18px]" strokeWidth={1.75} /> },
];

function SidebarContent({
  user,
  onLogout,
  onNavClick,
}: {
  user: ReturnType<typeof useAuth>['user'];
  onLogout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <div className="h-full flex flex-col bg-[hsl(var(--sidebar))] relative overflow-hidden">
      {/* 柔和光斑 + 噪点纹理背景 */}
      <div className="absolute inset-0 glow-forest pointer-events-none" />

      {/* 顶部有机装饰 */}
      <div className="relative flex-shrink-0">
        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-[hsl(var(--moss-50))]/40 to-transparent pointer-events-none" />
        <div className="absolute -top-8 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-[hsl(var(--moss-200))]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-3 -left-3 w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--sun-300))]/10 to-transparent blur-2xl pointer-events-none animate-drift-slow" />
      </div>

      {/* 品牌区 */}
      <div className="relative h-16 flex items-center px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-[20px_16px_24px_18px_/_18px_24px_16px_20px] bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--success))] flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--sun-300))] shadow-[0_0_0_2px_hsl(var(--sun-300)/0.25)] animate-breathe" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif-display text-[17px] text-foreground leading-none tracking-tight">量力</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="ink-dot !w-1 !h-1" />
              <span className="text-[10px] text-muted-foreground tracking-[0.18em] uppercase">
                Morning Forest
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 有机分割装饰 */}
      <div className="relative px-5 flex-shrink-0 z-10">
        <div className="h-px bg-gradient-to-r from-transparent via-[hsl(var(--border))]/50 to-transparent" />
      </div>

      {/* 导航区 */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto relative z-10">
        <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground tracking-[0.18em] uppercase mb-0.5">
          <Sparkles className="w-3 h-3 inline mr-1.5 -mt-0.5" strokeWidth={1.75} />
          成长路径
        </div>
        {navItems.map((item: NavItem) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app'}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-[8px] text-sm transition-all duration-200 ease-out relative ${
                isActive
                  ? 'nav-item-active text-primary font-medium bg-muted/50 rounded-[14px_18px_12px_20px_/_18px_12px_20px_14px]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-[14px_18px_12px_20px_/_18px_12px_20px_14px]'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 底部用户卡 + 退出 */}
      <div className="p-2.5 flex-shrink-0 relative z-10">
        <div className="paper-card p-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[16px_14px_18px_14px_/_14px_18px_14px_16px] bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--success))] flex items-center justify-center text-primary-foreground font-medium text-sm flex-shrink-0 shadow-sm">
              {user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate leading-tight">
                {user?.nickname || user?.username || '用户'}
              </div>
              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_0_2px_hsl(var(--success)/0.2)]" />
                @{user?.username || ''}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-[7px] rounded-[14px_18px_12px_20px_/_18px_12px_20px_14px] text-sm text-muted-foreground hover:text-destructive hover:bg-muted/30 transition-all duration-200 ease-out"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (isMobile) setSheetOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex w-[210px] flex flex-col flex-shrink-0 relative">
        {/* 柔和阴影过渡替代硬边框 */}
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-[hsl(var(--shadow-color)_/_0.04)] via-[hsl(var(--shadow-color)_/_0.01)] to-transparent pointer-events-none z-20" />
        <div className="absolute inset-0 shadow-[2px_0_20px_-10px_hsl(var(--shadow-color)_/_0.06)] pointer-events-none" />
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {isMobile && (
          <header className="md:hidden h-11 glass-warm border-b border-white/30 flex items-center px-4 flex-shrink-0 relative z-30">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5 text-foreground" strokeWidth={1.75} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0 border-r-0 bg-[hsl(var(--sidebar))] shadow-2xl">
                <SidebarContent
                  user={user}
                  onLogout={handleLogout}
                  onNavClick={handleNavClick}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-6 h-6 rounded-[14px_10px_16px_12px_/_12px_16px_10px_14px] bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--success))] flex items-center justify-center shadow-sm">
                <Leaf className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
              </div>
              <span className="font-serif-display text-sm text-foreground tracking-tight">量力</span>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-full min-w-0">
            <RequireAuth>
              <Outlet />
            </RequireAuth>
          </div>
        </div>
      </main>
    </div>
  );
}
