import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Mic,
  Timer,
  FileText,
  BookOpen,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const appNavItems: NavItem[] = [
  { path: '/dashboard', label: '工作台', icon: Home },
  { path: '/voice', label: '语音', icon: Mic },
  { path: '/timer', label: '计时', icon: Timer },
  { path: '/review', label: '复盘', icon: FileText },
  { path: '/manual', label: '说明书', icon: BookOpen },
];

/**
 * 公开页面布局：顶部导航栏（Logo + 登录/注册按钮）
 */
const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">个人使用说明书</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              登录
            </Link>
            <Link
              to="/register"
              className="text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity px-4 py-1.5 rounded-lg font-medium"
            >
              注册
            </Link>
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 底部 */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>个人使用说明书 · 不与自己对抗，只执行自己的脚本</p>
          <p className="mt-1">
            <Link to="/feedback" className="hover:text-foreground transition-colors">
              提交反馈
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

/**
 * 登录后布局：桌面端左侧侧边栏，移动端底部 Tab 导航
 */
export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* 桌面端侧边栏 - 仅 md 以上显示 */}
        <aside className="hidden md:flex md:flex-col md:w-56 md:h-screen md:sticky md:top-0 border-r border-border bg-card">
          <div className="h-14 flex items-center px-4 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">使用说明书</span>
            </Link>
          </div>
          <nav className="flex-1 py-4 px-2 space-y-1">
            {appNavItems.map((item: NavItem) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="p-3 border-t border-border space-y-1">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user?.displayName || user?.username}
                </div>
                <div className="text-xs text-muted-foreground truncate">@{user?.username}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* 移动端顶部栏 */}
          <header className="md:hidden sticky top-0 z-40 bg-card border-b border-border">
            <div className="h-12 flex items-center justify-between px-4">
              <div className="w-8" />
              <span className="font-semibold text-foreground text-sm">个人使用说明书</span>
              <button
                onClick={handleLogout}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 内容区 - 底部给移动端 Tab 栏留空间 */}
          <main className="flex-1 pb-20 md:pb-0">
            <Outlet />
          </main>

          {/* 移动端底部 Tab 导航 - 仅 md 以下显示 */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
            <div className="flex items-center justify-around h-16 px-2">
              {appNavItems.map((item: NavItem) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-xs transition-colors ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default PublicLayout;
