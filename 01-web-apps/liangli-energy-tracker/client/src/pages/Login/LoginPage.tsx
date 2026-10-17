import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Leaf, ArrowRight, Eye, EyeOff, User, Lock } from 'lucide-react';
import { logger } from '../../utils/logger';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@client/src/components/ui/form';
import { Input } from '@client/src/components/ui/input';
import { useAuth } from '@client/src/contexts/AuthContext';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.username, data.password);
      toast.success('登录成功');
      navigate('/app');
    } catch (err: unknown) {
      logger.error('Login failed', err);
      const message =
        err instanceof Error ? err.message : '登录失败，请检查用户名和密码';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* 有机光斑装饰 */}
      <div className="absolute -top-32 -right-20 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl animate-[drift_20s_ease-in-out_infinite] pointer-events-none" />
      <div className="absolute top-1/3 -left-24 w-[340px] h-[340px] rounded-full bg-accent/10 blur-3xl animate-[drift_25s_ease-in-out_infinite_reverse] pointer-events-none" />

      {/* 有机小形状 */}
      <div
        className="absolute top-[12%] right-[8%] w-14 h-20 opacity-[0.06] animate-[drift_18s_ease-in-out_infinite] pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
          borderRadius: '60% 40% 50% 50% / 50% 60% 40% 50%',
        }}
      />

      {/* 主内容区 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm">
          {/* 品牌区 */}
          <div className="text-center mb-6 animate-[fadeInUp_0.6s_ease-out_both]">
            <div className="inline-flex items-center justify-center w-11 h-11 mb-3 organic-pill bg-gradient-to-br from-primary to-primary/70 shadow-sm">
              <Leaf className="w-5 h-5 text-primary-foreground" strokeWidth={1.75} />
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl text-foreground mb-1 tracking-tight">
              量力
            </h1>
            <p className="text-xs text-muted-foreground tracking-wide">
              量力而行，才是持续成长的开始
            </p>
          </div>

          {/* 表单卡片 */}
          <div className="relative organic-card bg-card border border-border/50 shadow-soft animate-[fadeInUp_0.6s_ease-out_0.08s_both]">
            {/* 卡片顶部装饰线 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="font-serif-display text-base sm:text-lg text-foreground leading-tight">
                  欢迎回来
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  登录你的账号，继续今天的成长
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-3.5"
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground/80 pl-1">用户名</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" strokeWidth={1.75} />
                            <Input
                              placeholder="请输入用户名"
                              className="h-9 text-sm border border-border/60 bg-muted/30 rounded-lg pl-9 pr-3 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground/80 pl-1">密码</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" strokeWidth={1.75} />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="请输入密码"
                              className="h-9 text-sm border border-border/60 bg-muted/30 rounded-lg pl-9 pr-9 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                              ) : (
                                <Eye className="w-4 h-4" strokeWidth={1.75} />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full h-9 text-sm rounded-lg bg-primary text-primary-foreground font-medium shadow-sm hover:shadow hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-1.5 group overflow-hidden"
                  >
                    <span className="relative z-10">
                      {isSubmitting ? '登录中...' : '登录'}
                    </span>
                    <ArrowRight
                      className="w-3.5 h-3.5 relative z-10 opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                      strokeWidth={1.75}
                    />
                  </button>
                </form>
              </Form>

              {/* 底部链接 */}
              <div className="mt-4 pt-3.5 border-t border-border/60 text-xs text-muted-foreground text-center">
                还没有账号？
                <Link
                  to="/register"
                  className="text-primary font-medium hover:text-primary/80 ml-1 inline-flex items-center gap-0.5 group"
                >
                  立即注册
                  <ArrowRight className="w-3 h-3 opacity-60 -translate-x-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all duration-200" strokeWidth={1.75} />
                </Link>
              </div>
            </div>
          </div>

          {/* 底部小字 */}
          <p className="text-[11px] text-muted-foreground/60 text-center mt-4">
            登录即表示你同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
