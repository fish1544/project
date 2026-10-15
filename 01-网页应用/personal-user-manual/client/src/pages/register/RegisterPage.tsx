import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@client/src/contexts/AuthContext';
import { authApi } from '@client/src/api';
import { logger } from '@lark-apaas/client-toolkit/logger';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 用户名查重
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'too-short'
  >('idle');
  const debounceRef = useRef<number | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 用户名实时查重（输入停止 500ms 后）
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!username) {
      setUsernameStatus('idle');
      return;
    }

    if (username.length < 3) {
      setUsernameStatus('too-short');
      return;
    }

    setUsernameStatus('checking');
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(username);
        setUsernameStatus(res.available ? 'available' : 'taken');
      } catch (err) {
        logger.error('检查用户名失败', err);
        setUsernameStatus('idle');
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [username]);

  // 密码强度
  const passwordStrong = password.length >= 6;
  const passwordMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('用户名至少 3 个字符');
      return;
    }
    if (!passwordStrong) {
      setError('密码至少 6 位');
      return;
    }
    if (!passwordMatch) {
      setError('两次输入的密码不一致');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('该用户名已被注册');
      return;
    }

    setSubmitting(true);
    try {
      await register(username, password, displayName || undefined);
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/dashboard', { replace: true });
    } catch (err: unknown) {
      logger.error('注册失败', err);
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message || '注册失败，请稍后重试';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getUsernameHelper = () => {
    switch (usernameStatus) {
      case 'too-short':
        return { text: '用户名至少 3 个字符', ok: false };
      case 'checking':
        return { text: '检查中...', ok: null };
      case 'available':
        return { text: '用户名可用', ok: true };
      case 'taken':
        return { text: '该用户名已被注册', ok: false };
      default:
        return null;
    }
  };

  const usernameHelper = getUsernameHelper();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">创建账号</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            加入我们，开启你的自我探索之旅
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-foreground"
              >
                用户名
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请设置用户名（3-50 字符）"
                  className="w-full h-11 px-3 pr-10 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {usernameStatus === 'checking' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
                {usernameStatus === 'available' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                {usernameStatus === 'taken' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                    <X className="w-5 h-5" />
                  </div>
                )}
              </div>
              {usernameHelper && (
                <p
                  className={`text-xs ${
                    usernameHelper.ok === null
                      ? 'text-muted-foreground'
                      : usernameHelper.ok
                        ? 'text-success'
                        : 'text-destructive'
                  }`}
                >
                  {usernameHelper.text}
                </p>
              )}
            </div>

            {/* 显示名 */}
            <div className="space-y-2">
              <label
                htmlFor="displayName"
                className="text-sm font-medium text-foreground"
              >
                显示名
                <span className="text-muted-foreground font-normal ml-1">
                  （可选）
                </span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="你希望别人怎么称呼你"
                className="w-full h-11 px-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请设置密码（至少 6 位）"
                  className="w-full h-11 px-3 pr-10 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <p
                  className={`text-xs ${passwordStrong ? 'text-success' : 'text-muted-foreground'}`}
                >
                  {passwordStrong ? '✓ 密码强度符合要求' : '密码至少 6 位'}
                </p>
              )}
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                确认密码
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="w-full h-11 px-3 pr-10 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showConfirmPassword ? '隐藏密码' : '显示密码'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordMismatch && (
                <p className="text-xs text-destructive">两次输入的密码不一致</p>
              )}
              {passwordMatch && (
                <p className="text-xs text-success">✓ 密码一致</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                !username ||
                !password ||
                !confirmPassword ||
                usernameStatus === 'taken' ||
                usernameStatus === 'too-short' ||
                !passwordStrong ||
                !passwordMatch
              }
              className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            已有账号？{' '}
            <Link to="/login" className="text-primary hover:underline">
              去登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
