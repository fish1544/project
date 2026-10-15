import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, X, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import * as userApi from '@client/src/api/user';
import { useAuth } from '@client/src/contexts/AuthContext';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Switch } from '@client/src/components/ui/switch';
import { Label } from '@client/src/components/ui/label';
import SecurityCard from './SecurityCard';
import { Image } from '@client/src/components/ui/image';
import ThemeSwitcher from '@client/src/components/ThemeSwitcher';
import HomeLayoutPicker from '@client/src/components/HomeLayoutPicker';
import { useHomeLayout } from '@client/src/contexts/HomeLayoutContext';

export default function ProfilePage() {
  const { user, updateUser, token } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [dailyEnergyLimit, setDailyEnergyLimit] = useState(100);
  const [growthDirections, setGrowthDirections] = useState<string[]>([]);
  const [newDirection, setNewDirection] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
    enabled: !!token,
  });

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
      setAvatarUrl(profile.avatarUrl || '');
      setBio(profile.bio || '');
      setDailyEnergyLimit(profile.dailyEnergyLimit || 100);
      setGrowthDirections(profile.growthDirections || []);
      setIsPublic(profile.isPublic);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedUser) => {
      toast.success('保存成功');
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast.error(`保存失败：${err.message}`);
    },
  });

  const handleSave = () => {
    const data: {
      nickname?: string;
      avatarUrl?: string;
      bio?: string;
      dailyEnergyLimit?: number;
      growthDirections?: string[];
      isPublic?: boolean;
    } = {};
    if (nickname !== (profile?.nickname || '')) data.nickname = nickname;
    if (avatarUrl !== (profile?.avatarUrl || '')) data.avatarUrl = avatarUrl;
    if (bio !== (profile?.bio || '')) data.bio = bio;
    if (dailyEnergyLimit !== profile?.dailyEnergyLimit)
      data.dailyEnergyLimit = dailyEnergyLimit;
    if (
      JSON.stringify(growthDirections) !==
      JSON.stringify(profile?.growthDirections || [])
    )
      data.growthDirections = growthDirections;
    if (isPublic !== profile?.isPublic) data.isPublic = isPublic;

    if (Object.keys(data).length === 0) {
      setIsEditing(false);
      return;
    }
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    if (profile) {
      setNickname(profile.nickname || '');
      setAvatarUrl(profile.avatarUrl || '');
      setBio(profile.bio || '');
      setDailyEnergyLimit(profile.dailyEnergyLimit || 100);
      setGrowthDirections(profile.growthDirections || []);
      setIsPublic(profile.isPublic);
    }
    setIsEditing(false);
  };

  const handleAddDirection = () => {
    const trimmed = newDirection.trim();
    if (!trimmed) return;
    if (growthDirections.includes(trimmed)) {
      toast.error('该方向已存在');
      return;
    }
    setGrowthDirections([...growthDirections, trimmed]);
    setNewDirection('');
  };

  const handleRemoveDirection = (dir: string) => {
    setGrowthDirections(growthDirections.filter((d) => d !== dir));
  };

  const displayUser = profile || user;
  const { currentLayout } = useHomeLayout();
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const initial =
    displayUser?.nickname?.charAt(0)?.toUpperCase() ||
    displayUser?.username?.charAt(0)?.toUpperCase() ||
    'U';

  // 精力环：以 100 为基准的百分比展示
  const energyPercent = Math.min(
    100,
    Math.max(0, ((dailyEnergyLimit || 100) / 200) * 100),
  );
  const ringSize = 64;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (energyPercent / 100) * circumference;

  return (
    <div className="p-3 md:p-5 space-y-4 bg-background min-h-full relative overflow-hidden">
      {/* 背景装饰：2 个光斑，克制 */}
      <div className="absolute top-0 -left-4 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-32 -right-4 w-40 h-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* 页面标题 */}
      <div className="relative">
        <h1 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight">
          个人手账
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          记录成长的模样，每一页都是你
        </p>
        <div className="absolute -left-2 top-1.5 ink-dot animate-breathe" />
      </div>

      {/* 主布局：左大右小非对称 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ========= 左侧：个人资料大卡 ========= */}
        <div className="lg:col-span-8">
          <div className="paper-card overflow-hidden relative">
            {/* 封面区：根据主页方案动态变化 */}
            <div
              className="relative h-24 md:h-32 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${currentLayout.cover.from} 0%, ${currentLayout.cover.via} 50%, ${currentLayout.cover.to} 100%)`,
              }}
            >
              {/* 方案特色装饰 */}
              {currentLayout.id === 'forest-dawn' && (
                <>
                  <div className="absolute top-4 right-6 w-6 h-6 rounded-full bg-white/25 blur-sm animate-drift" />
                  <div className="absolute bottom-2 left-6 w-10 h-4 rounded-full bg-emerald-700/15 blur-[2px]" />
                </>
              )}
              {currentLayout.id === 'warm-sunset' && (
                <>
                  <div className="absolute top-3 right-4 w-8 h-8 rounded-full bg-yellow-300/50 blur-[1px]" />
                  <div className="absolute bottom-1 left-4 right-6 h-2 rounded-full bg-orange-500/20" />
                </>
              )}
              {currentLayout.id === 'ocean-breeze' && (
                <>
                  <div className="absolute top-3 right-4 w-6 h-2.5 rounded-full bg-white/35 blur-[1px]" />
                  <div className="absolute bottom-2.5 left-4 right-6 h-1.5 bg-white/25 rounded-full" />
                  <div className="absolute bottom-5 left-8 right-10 h-0.5 bg-white/20 rounded-full" />
                </>
              )}
              {currentLayout.id === 'sakura-dream' && (
                <>
                  <div className="absolute top-2 right-5 w-2.5 h-2.5 rounded-full bg-pink-300/60 animate-breathe" />
                  <div className="absolute top-5 right-8 w-1.5 h-1.5 rounded-full bg-rose-400/50" />
                  <div className="absolute bottom-3 left-5 w-2 h-2 rounded-full bg-pink-300/60" />
                  <div className="absolute bottom-5 left-9 w-1 h-1 rounded-full bg-rose-400/40" />
                </>
              )}
              {currentLayout.id === 'starry-night' && (
                <>
                  <div className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-white/80 animate-breathe" />
                  <div className="absolute top-4 right-7 w-0.5 h-0.5 rounded-full bg-white/60" />
                  <div className="absolute top-5 left-4 w-2 h-2 rounded-full bg-white/70" />
                  <div className="absolute bottom-3 left-7 w-0.5 h-0.5 rounded-full bg-white/50" />
                  <div className="absolute bottom-4 right-5 w-1.5 h-1.5 rounded-full bg-violet-300/70" />
                </>
              )}
              {currentLayout.id === 'minimal-ink' && (
                <>
                  <div className="absolute top-3.5 right-4 w-8 h-px bg-stone-600/40" />
                  <div className="absolute top-5 right-4 w-5 h-px bg-stone-500/30" />
                  <div className="absolute bottom-3.5 left-4 w-4 h-4 rounded-full border border-stone-500/40" />
                </>
              )}
              {/* 有机波浪底边 */}
              <div className="absolute bottom-0 left-0 right-0 h-6 wave-divider opacity-70" />
            </div>

            {/* 编辑按钮 + 编辑主页按钮 */}
            {!isEditing && (
              <div className="absolute top-3 right-3 z-20 flex gap-2">
                <button
                  onClick={() => setShowLayoutPicker(true)}
                  className="h-9 px-3 text-xs rounded-lg bg-card/90 backdrop-blur-sm border border-border/60 text-foreground/80 hover:bg-card hover:text-foreground transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                  主页风格
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="bg-card/90 backdrop-blur-sm h-9 px-3.5 text-xs rounded-lg border-border shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
                  编辑资料
                </Button>
              </div>
            )}

            {/* 头像 + 信息区 */}
            <div className="relative px-4 md:px-5 pb-5 pt-0">
              {/* 头像：有机形状，层叠穿插在封面下方 */}
              <div className="relative -mt-8 md:-mt-10 mb-3 flex justify-center md:justify-start">
                <div className="relative">
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-secondary to-primary/20 flex items-center justify-center overflow-hidden ring-4 ring-card shadow-sm"
                    style={{
                      borderRadius: '60% 40% 55% 45% / 50% 55% 45% 50%',
                    }}
                  >
                    {displayUser?.avatarUrl ? (
                      <Image
                        src={displayUser.avatarUrl}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-semibold text-primary display-number">
                        {initial}
                      </span>
                    )}
                  </div>
                  {/* 小装饰点 */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-warning/70 border-2 border-card animate-breathe" />
                </div>
              </div>

              {/* 信息排版：昵称 + 用户名 + 简介 */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                  <h2 className="font-serif-display text-lg md:text-xl text-foreground tracking-tight">
                    {displayUser?.nickname || displayUser?.username || '用户'}
                  </h2>
                  {displayUser?.role === 'admin' && (
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border border-warning/30 bg-warning/10 text-warning">
                      管理员
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-serif italic tracking-wide">
                  @{displayUser?.username || ''}
                </p>
                <p className="text-sm text-foreground/80 mt-2 leading-relaxed max-w-xl">
                  {displayUser?.bio || (
                    <span className="italic text-muted-foreground">
                      这个人还没写下她的故事…
                    </span>
                  )}
                </p>
              </div>

              {/* ===== 非编辑态：成长方向 + 精力环 ===== */}
              {!isEditing && displayUser && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 成长方向（占 2 列） */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="ink-dot" />
                      <h3 className="eyebrow-label">
                        成长方向
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(displayUser.growthDirections || []).length > 0 ? (
                        displayUser.growthDirections.map(
                          (dir: string, idx: number) => (
                            <span
                              key={dir}
                              className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                                idx % 3 === 0
                                  ? 'text-primary bg-primary/5 border-primary/20'
                                  : idx % 3 === 1
                                    ? 'text-accent bg-accent/10 border-accent/25'
                                    : 'text-warning bg-warning/10 border-warning/25'
                              }`}
                            >
                              {dir}
                            </span>
                          ),
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          还没有设定成长方向
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 精力上限：圆形进度环（占 1 列） */}
                  <div className="flex flex-col items-center sm:items-end">
                    <div className="flex items-center gap-2 mb-2 self-stretch sm:self-auto justify-center sm:justify-end">
                      <span className="ink-dot" />
                      <h3 className="eyebrow-label">
                        精力上限
                      </h3>
                    </div>
                    <div className="relative" style={{ width: ringSize, height: ringSize }}>
                      <svg width={ringSize} height={ringSize} className="-rotate-90">
                        {/* 背景环 */}
                        <circle
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          r={radius}
                          stroke="hsl(var(--border))"
                          strokeWidth={strokeWidth}
                          fill="none"
                        />
                        {/* 进度环 */}
                        <circle
                          cx={ringSize / 2}
                          cy={ringSize / 2}
                          r={radius}
                          stroke="url(#energyGradient)"
                          strokeWidth={strokeWidth}
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
                        />
                        <defs>
                          <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--success))" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="display-number text-base text-foreground">
                          {displayUser.dailyEnergyLimit}
                        </span>
                        <span className="text-[10px] text-muted-foreground -mt-0.5">
                          点/日
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== 编辑模式 ===== */}
              {isEditing && (
                <div className="mt-5 space-y-4">
                  {/* 分隔装饰 */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 soft-divider" />
                    <span className="text-xs text-muted-foreground font-serif italic">
                      编辑你的手账
                    </span>
                    <div className="flex-1 soft-divider" />
                  </div>

                  {/* 昵称 + 头像 URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="nickname" className="text-xs text-foreground/80">
                        昵称
                      </Label>
                      <Input
                        id="nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="你的名字"
                        className="h-9 border-border/60 bg-muted/30 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="avatarUrl" className="text-xs text-foreground/80">
                        头像链接
                      </Label>
                      <Input
                        id="avatarUrl"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-9 border-border/60 bg-muted/30 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* 简介 */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bio" className="text-xs text-foreground/80">
                      个人简介
                    </Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="写下你此刻的心情..."
                      className="resize-none min-h-[72px] border-border/60 bg-muted/30 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
                    />
                  </div>

                  {/* 每日精力上限 */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="dailyEnergyLimit"
                      className="text-xs text-foreground/80"
                    >
                      每日精力上限
                    </Label>
                    <Input
                      id="dailyEnergyLimit"
                      type="number"
                      value={dailyEnergyLimit}
                      onChange={(e) =>
                        setDailyEnergyLimit(Number(e.target.value) || 100)
                      }
                      min={10}
                      max={500}
                      className="h-9 border-border/60 bg-muted/30 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
                    />
                    <p className="text-xs text-muted-foreground pl-1">
                      建议根据自己的实际情况设置，默认 100
                    </p>
                  </div>

                  {/* 成长方向 */}
                  <div className="space-y-2">
                    <Label className="text-xs text-foreground/80">成长方向</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {growthDirections.map((dir) => (
                        <span
                          key={dir}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border text-primary bg-primary/5 border-primary/20"
                        >
                          {dir}
                          <button
                            onClick={() => handleRemoveDirection(dir)}
                            className="ml-0.5 hover:text-primary/70 transition-colors"
                            aria-label={`删除${dir}`}
                          >
                            <X className="w-3 h-3" strokeWidth={1.75} />
                          </button>
                        </span>
                      ))}
                      {growthDirections.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          还没有添加
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newDirection}
                        onChange={(e) => setNewDirection(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDirection();
                          }
                        }}
                        placeholder="添加一个成长方向..."
                        className="flex-1 h-9 border-border/60 bg-muted/30 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:border-ring/50 focus:bg-background transition-all duration-200"
                      />
                      <Button
                        variant="default"
                        onClick={handleAddDirection}
                        type="button"
                        className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200"
                      >
                        <Plus className="w-4 h-4 mr-1" strokeWidth={1.75} />
                        添加
                      </Button>
                    </div>
                  </div>

                  {/* 公开开关 */}
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        公开资料
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        在匿名社区展示你的资料
                      </p>
                    </div>
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="h-9 px-5 text-sm rounded-lg border-border hover:bg-muted/30 transition-colors"
                    >
                      取消
                    </Button>
                    <Button
                      className="h-9 px-7 rounded-lg bg-primary text-primary-foreground text-sm shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                    >
                      保存
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========= 右侧：安全设置 + 主题设置 ========= */}
        <div className="lg:col-span-4 space-y-4">
          {/* 账号安全卡片 */}
          <div className="paper-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="ink-dot" />
                <h3 className="font-serif-display text-base text-foreground">
                  账号安全
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 pl-3.5">
                守护你的成长小窝
              </p>
            </div>
            <div className="p-4">
              <SecurityCard />
            </div>
          </div>

          {/* 主题设置：仅非编辑态显示 */}
          {!isEditing && (
            <div className="paper-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="ink-dot" />
                  <h3 className="font-serif-display text-base text-foreground">
                    主题风格
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 pl-3.5">
                  选一款你喜欢的林间色调
                </p>
              </div>
              <div className="p-4">
                <ThemeSwitcher layout="grid" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主页风格选择弹窗 */}
      {showLayoutPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-foreground/30 backdrop-blur-sm p-0 md:p-4"
          onClick={() => setShowLayoutPicker(false)}
        >
          <div
            className="w-full md:max-w-md paper-card rounded-t-2xl md:rounded-2xl p-4 md:p-5 max-h-[85vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif-display text-base text-foreground">
                  选择主页风格
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  选一款喜欢的风格，让你的手账更有温度
                </p>
              </div>
              <button
                onClick={() => setShowLayoutPicker(false)}
                className="w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
            <HomeLayoutPicker onClose={() => setShowLayoutPicker(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
