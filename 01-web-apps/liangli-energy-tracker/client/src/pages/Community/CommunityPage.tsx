import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Send, Trash2, User as UserIcon, Leaf, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import * as communityApi from '@client/src/api/community';
import { useAuth } from '@client/src/contexts/AuthContext';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { Switch } from '@client/src/components/ui/switch';
import { Label } from '@client/src/components/ui/label';
import { Image } from '@client/src/components/ui/image';

const categories = ['学习', '健身', '工作', '生活', '其他'];

const categoryBadgeVars: Record<string, string> = {
  '学习': '--success',
  '健身': '--warning',
  '工作': '--primary',
  '生活': '--chart-3',
  '其他': '--accent',
};

const getVar = (name: string): string =>
  typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'hsl(150 44% 48%)'
    : 'hsl(150 44% 48%)';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    goalCategory: string | null;
    likesCount: number;
    authorNickname: string;
    authorAvatarUrl: string | null;
    createdAt: string;
    isOwner?: boolean;
  };
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
}

function getCategoryVar(category: string | null): string {
  if (!category) return '--success';
  return categoryBadgeVars[category] || '--success';
}

function PostCard({ post, onLike, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likesCount);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLikes((prev) => prev + 1);
    onLike(post.id);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const initial = post.authorNickname?.charAt(0)?.toUpperCase() || '匿';
  const catVar = getCategoryVar(post.goalCategory);
  const catColor = `hsl(var(${catVar}))`;

  return (
    <article className="memo-card memo-card-hover group relative">
      {/* 分类彩色图钉 */}
      <div className="absolute -top-1.5 left-5 z-10">
        <div
          className="w-3 h-3 rounded-full shadow-sm"
          style={{
            backgroundColor: catColor,
            boxShadow: `0 1px 3px -1px hsl(var(${catVar}) / 0.4), inset 0 1px 1px hsl(var(--card) / 0.5)`,
          }}
        />
      </div>

      <div className="p-3.5 md:p-4 pt-4 space-y-2.5">
        {/* Author header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* 有机形状头像 */}
            <div
              className="relative overflow-hidden flex-shrink-0"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '60% 40% 50% 50% / 50% 55% 45% 50%',
              }}
            >
              {post.authorAvatarUrl ? (
                <Image
                  src={post.authorAvatarUrl}
                  alt={post.authorNickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs font-medium"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(${catVar}) / 0.15), hsl(var(${catVar}) / 0.25))`,
                    color: catColor,
                  }}
                >
                  {initial}
                </div>
              )}
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground font-serif-display">
                {post.authorNickname}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span className="ink-dot" style={{ background: 'hsl(var(--muted-foreground))' }} />
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          {post.isOwner && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-serif-display font-normal">
          {post.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1.5">
          <div>
            {post.goalCategory && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border"
                style={{
                  backgroundColor: `hsl(var(${catVar}) / 0.08)`,
                  color: catColor,
                  borderColor: `hsl(var(${catVar}) / 0.25)`,
                }}
              >
                <Leaf className="w-2.5 h-2.5" strokeWidth={1.75} />
                {post.goalCategory}
              </span>
            )}
          </div>
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-all duration-200 ${
              liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
            }`}
            style={{
              transform: liked ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-200 ${liked ? 'fill-current' : ''}`}
              strokeWidth={1.75}
            />
            <span className="text-[11px] font-medium">{likes}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CommunityPage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['communityPosts', page, pageSize, filterCategory],
    queryFn: () =>
      communityApi.getCommunityPosts({
        page,
        pageSize,
        category: filterCategory || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: communityApi.createPost,
    onSuccess: () => {
      toast.success('发布成功');
      setContent('');
      setCategory('');
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
    onError: (err: Error) => {
      toast.error(`发布失败：${err.message}`);
    },
  });

  const likeMutation = useMutation({
    mutationFn: communityApi.likePost,
    onError: () => {
      toast.error('点赞失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: communityApi.deletePost,
    onSuccess: () => {
      toast.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
    onError: (err: Error) => {
      toast.error(`删除失败：${err.message}`);
    },
  });

  const handleSubmit = () => {
    if (!token) {
      toast.error('请先登录');
      return;
    }
    if (!content.trim()) {
      toast.error('请输入内容');
      return;
    }
    createMutation.mutate({
      content: content.trim(),
      goalCategory: category || undefined,
      isPublic,
    });
  };

  const handleFilterChange = (cat: string) => {
    setFilterCategory(filterCategory === cat ? '' : cat);
    setPage(1);
  };

  const handleLike = (id: string) => {
    if (!token) {
      toast.error('请先登录');
      return;
    }
    likeMutation.mutate(id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定删除这条帖子吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="relative p-3 md:p-5 space-y-4 max-w-3xl mx-auto min-h-full overflow-hidden bg-background">
      {/* 背景装饰：2 个光斑 */}
      <div className="absolute top-0 -left-8 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-32 -right-4 w-40 h-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* 标题区 */}
      <header className="relative text-center py-3 md:py-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <Leaf className="w-4 h-4 text-success/30" strokeWidth={1.75} />
        </div>
        <h1 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight mb-1">
          林间树洞
        </h1>
        <p className="text-xs text-muted-foreground font-serif-display italic">
          写下此刻的心情，让风把它带去远方
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="w-6 h-px bg-border" />
          <span className="w-1 h-1 rounded-full bg-primary/30" />
          <span className="w-6 h-px bg-border" />
        </div>
      </header>

      {/* 发帖便签卡片 */}
      <div className="memo-card">
        <div className="p-3.5 md:p-4 space-y-3">
          {!token ? (
            <div className="text-center py-5">
              <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-secondary/50 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-success" strokeWidth={1.75} />
              </div>
              <p className="text-xs text-muted-foreground font-serif-display">登录后才能投递便签哦</p>
            </div>
          ) : (
            <>
              {/* 便签标题小条 */}
              <div className="flex items-center gap-1.5">
                <span className="ink-dot" style={{ background: 'hsl(var(--warning))' }} />
                <span className="eyebrow-label">
                  今日便签 · {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </span>
              </div>

              {/* 手账便签输入框 */}
              <div className="relative rounded-xl bg-muted/30 border border-border/60">
                <Textarea
                  placeholder="今天有什么想分享的..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[70px] bg-transparent border-none shadow-none resize-none text-foreground/80 placeholder:text-muted-foreground/60 font-serif-display leading-relaxed text-sm focus-visible:ring-0 focus-visible:ring-offset-0 p-2.5"
                />
                {/* 纸张折角装饰 */}
                <div className="absolute top-0 right-0 w-5 h-5 overflow-hidden rounded-tr-xl">
                  <div
                    className="absolute top-0 right-0 w-full h-full"
                    style={{
                      background: 'linear-gradient(135deg, transparent 50%, hsl(var(--muted)) 50%)',
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* 分类选择 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categories.map((cat) => {
                    const active = category === cat;
                    const catVarLocal = categoryBadgeVars[cat] || '--success';
                    const catColorLocal = `hsl(var(${catVarLocal}))`;
                    return (
                      <button
                        key={cat}
                        onClick={() =>
                          setCategory(category === cat ? '' : cat)
                        }
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all duration-200 ${
                          active ? '' : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: active ? catColorLocal : `hsl(var(${catVarLocal}) / 0.08)`,
                          color: active ? 'hsl(var(--card))' : catColorLocal,
                          borderColor: active ? catColorLocal : `hsl(var(${catVarLocal}) / 0.25)`,
                          boxShadow: active
                            ? `0 2px 8px -4px hsl(var(${catVarLocal}) / 0.4)`
                            : 'none',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* 发布按钮 + 公开开关 */}
                <div className="flex items-center gap-2.5">
                  {/* 公开开关 */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/60">
                    <Switch
                      id="public-toggle"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label
                      htmlFor="public-toggle"
                      className="text-[11px] text-muted-foreground cursor-pointer select-none"
                    >
                      {isPublic ? '公开' : '匿名'}
                    </Label>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || createMutation.isPending}
                    className="h-9 px-4 pl-3.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow hover:-translate-y-px transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none text-sm font-medium"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
                    投递
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

       {/* 列表分类筛选 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => handleFilterChange('')}
          className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
            filterCategory === ''
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-muted-foreground border-border/60 hover:text-foreground hover:border-border'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => {
          const active = filterCategory === cat;
          const catVarLocal = categoryBadgeVars[cat] || '--success';
          const catColorLocal = `hsl(var(${catVarLocal}))`;
          return (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-200 ${
                active ? '' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: active ? catColorLocal : `hsl(var(${catVarLocal}) / 0.08)`,
                color: active ? 'hsl(var(--card))' : catColorLocal,
                borderColor: active ? catColorLocal : `hsl(var(${catVarLocal}) / 0.25)`,
                boxShadow: active
                  ? `0 2px 8px -4px hsl(var(${catVarLocal}) / 0.4)`
                  : 'none',
              }}
            >
              {active && <Check className="w-3 h-3" strokeWidth={2.5} />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* 帖子列表 */}
      <div className="relative space-y-3">
        {/* 列表前装饰分隔 */}
        <div className="flex items-center justify-center gap-3 py-1">
          <span className="w-12 h-px bg-border" />
          <Leaf className="w-3.5 h-3.5 text-primary/30" strokeWidth={1.75} />
          <span className="w-12 h-px bg-border" />
        </div>

        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-breathe inline-block">
              <Leaf className="w-5 h-5 mx-auto mb-2 text-success/60" strokeWidth={1.75} />
            </div>
            <p className="text-xs font-serif-display">正在收集林间的便签...</p>
          </div>
        )}

        {!isLoading && data?.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 paper-card">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-foreground/80">还没有人分享</p>
            <p className="text-xs text-muted-foreground max-w-[240px] text-center">
              成为第一个分享的人吧，你的成长也许能给别人带来力量。
            </p>
          </div>
        )}

        {data?.items.map((post, index) => (
          <div
            key={post.id}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${index * 80}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <PostCard
              post={{
                ...post,
                isOwner: user?.username === post.authorNickname,
              }}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>

      {/* 分页 */}
      {data && data.total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-4 rounded-full border-border bg-card text-foreground hover:bg-muted/30 transition-colors text-xs font-serif-display"
          >
            上一页
          </Button>
          <span className="text-xs text-muted-foreground px-1.5 font-serif-display flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary/40" />
            第 {page} / {totalPages} 页
            <span className="w-1 h-1 rounded-full bg-primary/40" />
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-8 px-4 rounded-full border-border bg-card text-foreground hover:bg-muted/30 transition-colors text-xs font-serif-display"
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
