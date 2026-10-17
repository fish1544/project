import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import * as userApi from '@client/src/api/user';
import { useAuth } from '@client/src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';

function getPasswordStrength(pwd: string): {
  level: number;
  label: string;
  colorClass: string;
} {
  if (!pwd) return { level: 0, label: '', colorClass: '' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { level: 1, label: '弱', colorClass: 'bg-destructive' };
  if (score === 2) return { level: 2, label: '中等', colorClass: 'bg-warning' };
  if (score === 3) return { level: 3, label: '强', colorClass: 'bg-success' };
  return { level: 4, label: '非常强', colorClass: 'bg-primary' };
}

export default function SecurityCard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: ({ oldPwd, newPwd }: { oldPwd: string; newPwd: string }) =>
      userApi.changePassword(oldPwd, newPwd),
    onSuccess: () => {
      toast.success('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error) => {
      toast.error(`修改失败：${err.message}`);
    },
  });

  const handleChangePassword = () => {
    if (!oldPassword) {
      toast.error('请输入旧密码');
      return;
    }
    if (!newPassword) {
      toast.error('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('新密码至少 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }
    passwordMutation.mutate({ oldPwd: oldPassword, newPwd: newPassword });
  };

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
      navigate('/login');
    }
  };

  const pwdStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-5">
      {/* 修改密码 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
          <span className="font-serif-display text-sm text-foreground">修改密码</span>
        </div>

        <div className="space-y-2.5">
          <div className="relative">
            <Input
              type={showOldPwd ? 'text' : 'password'}
              placeholder="旧密码"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="h-9 pr-10 border-border/60 bg-muted/30 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowOldPwd(!showOldPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showOldPwd ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showNewPwd ? 'text' : 'password'}
              placeholder="新密码"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-9 pr-10 border-border/60 bg-muted/30 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowNewPwd(!showNewPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNewPwd ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
            </button>
          </div>

          {newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${
                      i <= pwdStrength.level ? pwdStrength.colorClass : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">密码强度：{pwdStrength.label}</p>
            </div>
          )}

          <div className="relative">
            <Input
              type={showConfirmPwd ? 'text' : 'password'}
              placeholder="确认新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-9 pr-10 border-border/60 bg-muted/30 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPwd ? (
                <EyeOff className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground rounded-lg h-9 px-4 text-sm font-medium shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200"
            onClick={handleChangePassword}
            disabled={passwordMutation.isPending}
          >
            修改密码
          </Button>
        </div>
      </div>

      {/* 退出登录 */}
      <div className="pt-4">
        <div className="soft-divider mb-4" />
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive rounded-lg h-9 text-sm transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" strokeWidth={1.75} />
          退出登录
        </Button>
      </div>
    </div>
  );
}
