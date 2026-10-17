import { Zap, Shield, TrendingUp, Leaf } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';

const philosophy = [
  {
    icon: <Zap className="w-4 h-4" strokeWidth={1.75} />,
    title: '反假性自律',
    description:
      '不鼓励把日程填满。忙碌不等于高效，自律也不是自我消耗。关注精力上限，可持续成长才是真成长。',
  },
  {
    icon: <Shield className="w-4 h-4" strokeWidth={1.75} />,
    title: '低门槛记录',
    description:
      '成长池一键录入，无需复杂分类。想到就记，不给大脑添负担。记录的意义在于开始，而不是完美。',
  },
  {
    icon: <TrendingUp className="w-4 h-4" strokeWidth={1.75} />,
    title: '数据驱动成长',
    description:
      '可视化呈现成长轨迹——专注时长、完成进度、精力分布。每一点进步都看得见，行动有反馈。',
  },
];

const lifestyleImage =
  '/spark/app/app_17edmw43ujk/runtime/api/v1/storage/object/bucket_aadkvypuhl6cw_static/static%2Faadkvzfng6ghu_ve_miaoda';

const seedlingImage =
  '/spark/app/app_17edmw43ujk/runtime/api/v1/storage/object/bucket_aadkvypuhl6cw_static/static%2Faadkvzikiv4ds_ve_miaoda';

export default function PhilosophySection() {
  return (
    <>
       {/* Philosophy Section */}
       <section className="relative z-10 py-10 sm:py-12">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
         <div className="absolute inset-x-0 top-12 bottom-12 bg-gradient-to-b from-muted/0 via-muted/25 to-muted/0 pointer-events-none" />
         <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-10 items-start">
            <div className="lg:sticky lg:top-16">
              <span className="eyebrow-label mb-2 inline-block">设计理念</span>
              <h2 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight leading-tight">
                为什么选择量力？
              </h2>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                成长不是比谁更拼，而是比谁更懂自己。
                <br />
                真正的自律，是对自己诚实。
              </p>
              <div className="mt-5 flex items-center gap-2.5">
                <div className="flex -space-x-2">
                  {[
                    'bg-primary',
                    'bg-success',
                    'bg-warning',
                  ].map((cls, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full border-2 border-muted flex items-center justify-center text-primary-foreground text-[10px] font-medium ${cls}`}
                    >
                      {['静', '慢', '稳'][i]}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  和你一样，在慢慢成长
                </span>
              </div>
            </div>

             <div className="space-y-2.5">
              {philosophy.map((item, index) => (
                <div
                  key={item.title}
                  className="paper-card paper-card-hover group relative p-4"
                >
                  <div className="flex gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-secondary text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="display-number text-xs text-muted-foreground">
                          0{index + 1}
                        </span>
                        <h3 className="font-serif-display text-sm text-foreground">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

       {/* Lifestyle Showcase Section */}
       <section className="relative z-10 py-10 sm:py-12">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
               <span className="eyebrow-label mb-2 inline-block">
                 慢成长哲学
               </span>
              <h2 className="font-serif-display text-xl md:text-2xl text-foreground tracking-tight leading-tight">
                在快节奏的世界里，
                <br />
                <span className="text-primary">慢慢成长也没关系</span>
              </h2>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                不用赶在某个年纪前完成什么，不用和别人比较进度。
                <br />
                一杯茶、一页笔记、一次专注——每一个认真对待自己的时刻，都是成长。
              </p>
              <div className="mt-5 space-y-2">
                {[
                  '不做焦虑驱动的虚假忙碌',
                  '只和昨天的自己比较',
                  '让精力恢复和努力同样重要',
                ].map((item: string) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <Leaf
                        className="w-2.5 h-2.5 text-primary"
                        strokeWidth={1.75}
                      />
                    </div>
                    <span className="text-xs text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              {/* 克制版：2 个光斑 */}
              <div className="absolute -inset-4 bg-gradient-to-br from-warning/15 via-accent/10 to-transparent rounded-[2rem] blur-3xl -z-10" />
              <div className="absolute -bottom-3 -left-3 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl -z-10" />
              <div className="relative overflow-hidden rounded-xl shadow-sm">
                <Image
                  src={lifestyleImage}
                  alt="宁静的晨间时光"
                  className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
               {/* Small seedling badge */}
               <div className="absolute -bottom-3 right-2 sm:-right-3 backdrop-blur-md bg-card/70 border border-border/50 rounded-xl p-2 flex items-center gap-2 animate-[float_6s_ease-in-out_infinite] [animation-delay:-1s] shadow-lg shadow-foreground/5 z-20">
                 <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={seedlingImage}
                    alt="小嫩芽"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                   <div className="eyebrow-label leading-none">今日成长</div>
                   <div className="text-xs font-semibold text-foreground mt-0.5">
                     + 1 小步
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
