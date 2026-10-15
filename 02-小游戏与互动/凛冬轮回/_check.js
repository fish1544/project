
/* ============================================================
   凛冬轮回 v2.0 · 重构引擎
   ============================================================ */

// ===== 工具 =====
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const rnd=n=>Math.floor(Math.random()*n);
const chance=p=>Math.random()<p;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[rnd(a.length)];
const save=()=>{try{localStorage.setItem('lidong_v2',JSON.stringify(G))}catch(e){}};
const load=()=>{try{const s=localStorage.getItem('lidong_v2');return s?JSON.parse(s):null}catch(e){return null}};

// ===== 音效系统（Web Audio 合成） =====
let audioCtx=null;
function beep(freq,dur=0.08,type='sine',vol=0.15){
  if(!G.settings.sound) return;
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;
    g.gain.setValueAtTime(vol,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.connect(g);g.connect(audioCtx.destination);
    o.start();o.stop(audioCtx.currentTime+dur);
  }catch(e){}
}
const sfx={
  click:()=>beep(600,.05,'sine',.08),
  good:()=>{beep(660,.08,'sine',.12);setTimeout(()=>beep(880,.1,'sine',.12),80)},
  bad:()=>{beep(200,.15,'sawtooth',.12);setTimeout(()=>beep(150,.2,'sawtooth',.1),100)},
  alert:()=>{beep(440,.1,'square',.1);setTimeout(()=>beep(440,.1,'square',.1),200)},
  buy:()=>{beep(880,.06,'sine',.1);setTimeout(()=>beep(1100,.08,'sine',.1),60)},
  hit:()=>beep(120,.15,'sawtooth',.2),
  win:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.15,'sine',.12),i*100))},
};

// ===== 默认状态 =====
const DEF={
  v:3,
  cycle:1, originPoints:0, phase:'start',
  prepDay:1, prepTotal:30, apocDay:0,
  money:1800000, attention:0, actionPoints:3,
  baseLevel:1, baseIntegrity:100, storageCap:80,
  res:{food:0,water:0,fuel:0,meds:0,building:0,weapons:0,ammo:0,clothes:0,scrap:0},
  hp:100, maxHp:100, temperature:-20, weather:'clear',
  score:{reserve:0,wall:0,survive:0,world:0},
  talents:{cold:0,intuition:0,wall:0,trade:0,body:0},
  talentsUsed:[], starter:null,
  items:{scoutMirror:0,hideArchive:0,storageBag:0,warmKit:0,archiveHidden:0,listener:0},
  board:[], boardTab:'total', playerRank:100,
  allies:[], rep:0,
  stats:{exploredRate:0,maxRank:100,raidDefeated:0,beastKilled:0,helped:0,killed:0,daysSurvived:0,crafts:0},
  achievements:[], unlockedEndings:[], currentEnding:null,
  log:[], marketTimer:0, marketList:[], integral:0, wandererCd:0,
  equipment:{weapon:{name:'拳头',damage:1,dur:0},armor:null},
  settings:{sound:true,shake:true},
  guideStep:0,
  endlessSaves:[], mainSave:null,
  playerTag:'幸存者-'+String(Math.floor(Math.random()*9000)+1000),
  season:1, seasonDay:0, seasonRewards:[],
  structDmg:0, mapMarked:[], behaviorTags:[],
  scoutOn:false, listenerOn:false,
  prepEventsSeen:[],
};
let G=load()||JSON.parse(JSON.stringify(DEF));

// ===== 成就定义 =====
const ACH=[
  {id:'first_step',name:'初入凛冬',desc:'完成第一世轮回',icon:'❄'},
  {id:'rich',name:'物资大亨',desc:'单局物资总数超过200',icon:'📦'},
  {id:'fortress',name:'坚不可摧',desc:'基地升到5级堡垒',icon:'🏰'},
  {id:'explorer',name:'探索者',desc:'地图探索率达到100%',icon:'🧭'},
  {id:'slayer',name:'异兽猎手',desc:'击杀5只寒变异兽',icon:'⚔'},
  {id:'savior',name:'善意回声',desc:'救助10名流浪者',icon:'🤝'},
  {id:'tyrant',name:'冻土暴君',desc:'掠夺5名流浪者',icon:'💀'},
  {id:'survivor',name:'百日生存',desc:'存活超过100天',icon:'📅'},
  {id:'top10',name:'跻身前十',desc:'排行榜进入前10',icon:'👑'},
  {id:'crafter',name:'工匠',desc:'制作5件物品',icon:'🔨'},
];
function unlockAch(id){
  if(G.achievements.includes(id)) return;
  G.achievements.push(id);
  const a=ACH.find(x=>x.id===id);
  const t=document.createElement('div');
  t.className='ach-toast';
  t.innerHTML=`<div style="font-size:28px">${a.icon}</div><div><div style="font-size:10px;color:var(--gold)">成就解锁</div><div style="font-size:14px;font-weight:700">${a.name}</div><div style="font-size:10px;color:var(--dim)">${a.desc}</div></div>`;
  document.body.appendChild(t);
  sfx.win();
  setTimeout(()=>t.remove(),3000);
  save();
}

// ===== 飘字 =====
function floatDmg(text,color){
  const d=document.createElement('div');
  d.className='dmg-float';d.textContent=text;
  d.style.color=color||'#ff5c5c';
  d.style.left=(40+Math.random()*20)+'%';d.style.top='40%';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),1000);
}

// ===== 日志 =====
function logMsg(m,type){
  G.log.unshift({d:G.phase==='apoc'?`末世${G.apocDay}d`:G.phase==='prep'?`灾前${G.prepDay}d`:'--',m,t:type||''});
  if(G.log.length>60)G.log.pop();
}
function renderLog(){
  if(!G.log.length)return'<div style="color:var(--faint);font-size:12px;text-align:center;padding:14px">暂无记录</div>';
  return G.log.slice(0,12).map(l=>`<div class="le ${l.t}"><span class="d">[${l.d}]</span>${l.m}</div>`).join('');
}

// ===== 顶栏 =====
function refreshTop(){
  $('#tb-cycle').textContent=G.cycle;
  $('#tb-origin').textContent=G.originPoints;
  $('#tb-time').textContent=G.phase==='prep'?`${G.prepDay}/30`:G.phase==='apoc'?`${G.apocDay}d`:'--';
  const bg=$('#bgimg');
  if(bg){
    const cls=G.phase==='prep'?'prep':G.phase==='apoc'?'apoc':'start';
    if(!bg.classList.contains(cls)){bg.className=cls}
  }
}

// ===== toast =====
function toast(m){
  const t=$('#toast');t.textContent=m;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1600);
}

/* ============================================================
   视图：启动页
   ============================================================ */
function viewStart(){
  refreshTop();
  const h=G.mainSave?`<span style="color:var(--ember)">主线存档：${G.mainSave.ending}</span>`:'无主线存档';
  $('#main').innerHTML=`
  <div class="hero">
    <svg class="snow" viewBox="0 0 24 24" fill="none" stroke="#5ec8f8" stroke-width="1.5"><path d="M12 2v20M3 6l18 12M21 6L3 18M12 2l-3 5m3-5 3 5M12 22l-3-5m3 5 3-5M5 9l-3-1m3 1 1-3M19 9l3-1m-3 1-1-3M5 15l-3 1m3-1 1 3M19 15l3 1m-3-1-1 3"/></svg>
    <h1>凛冬轮回</h1>
    <div class="sub">FROZEN REINCARNATION · 2047</div>
    <div class="lore">2047年盛夏，72小时全球暴跌至-45℃。电网瘫痪，城市冰封。<br>你是唯一拥有时间回溯权限的幸存者——<br>每一次死亡，都是下一次轮回的开始。</div>
    <div class="savecard">${h}<br>无尽存档：${G.endlessSaves.length}/3 · 成就：${G.achievements.length}/${ACH.length}<br>已解锁结局：${G.unlockedEndings.length}/6<br><span style="color:var(--ice)">代号：${G.playerTag}</span></div>
    <button class="btn ember" style="justify-content:center" onclick="enterShop()">▶ 开启第 ${G.cycle} 世轮回</button>
    <button class="btn" onclick="viewAch()">🏆 成就（${G.achievements.length}/${ACH.length}）</button>
    <button class="btn" onclick="viewEndings()">📖 结局图鉴（${G.unlockedEndings.length}/6）</button>
    <button class="btn" onclick="editTag()">✏ 修改代号</button>
    <button class="btn" onclick="viewRules()">📜 规则说明</button>
    <button class="btn" onclick="viewSettings()">⚙ 设置</button>
    ${G.endlessSaves.length?`<button class="btn" onclick="viewEndless()">💾 无尽存档（${G.endlessSaves.length}）</button>`:''}
  </div>`;
}

/* ============================================================
   规则
   ============================================================ */
function viewRules(){
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">规则速查</div>
  <div style="font-size:13px;line-height:2;color:var(--dim)">
  <b style="color:var(--gold)">灾前30天</b>：3行动点/天。囤货、卖房、扩基地、侦察。关注度越高，末世越危险。<br>
  <b style="color:var(--ember)">末世生存</b>：-45℃恒定。每天食5/水3/燃2。天气：晴/暴雪/寒潮/融冰。<br>
  <b style="color:var(--ice)">战斗</b>：遭遇袭时二选一——固守（低风险少收益）/强攻（高风险高收益）。<br>
  <b style="color:var(--gold)">四维评分</b>：储备/壁垒/存续/世域各25。主动恶行扣分，自卫不扣。<br>
  <b style="color:var(--ember)">轮回</b>：总分1:1兑换本源点，购买永久天赋与开局道具。<br>
  <b style="color:var(--green)">成就</b>：10个成就等你解锁，累计本源点奖励。
  </div><button class="btn" onclick="viewStart()">← 返回</button></div>`;
}

/* ============================================================
   结局图鉴
   ============================================================ */
const ENDINGS=[
  {id:'survive',name:'寒岁苟活',desc:'存活62天+，低调求存，不滥杀无辜。'},
  {id:'lord',name:'冻土领主',desc:'基地5级堡垒，盟友≥2，雄霸一方。'},
  {id:'lone',name:'荒世独行',desc:'探索率70%+，无盟友，独来独往。'},
  {id:'tyrant',name:'烬世枭主',desc:'世域≤5，掠夺流浪者≥3，击退掠夺≥5。'},
  {id:'eternal',name:'静域长生',desc:'存活100天+，基地≥3级，从未倒下。'},
  {id:'death',name:'冰封寂灭',desc:'死亡结局。所有失败都归此处。'},
];
function viewEndings(){
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">结局图鉴</div>
  ${ENDINGS.map(e=>{const u=G.unlockedEndings.includes(e.id);
    return `<div class="shop-item" style="${u?'':'opacity:.45'}">
    <div class="nm">${u?e.name:'？？？'}<span class="lv">${u?'已解锁':'未解锁'}</span></div>
    <div class="ds">${u?e.desc:'未知结局'}</div></div>`}).join('')}
  <button class="btn" onclick="viewStart()">← 返回</button></div>`;
}

/* ============================================================
   设置
   ============================================================ */
function viewSettings(){
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">设置</div>
  <div class="srow"><span class="k">音效</span><span class="v">${G.settings.sound?'开':'关'}</span></div>
  <button class="btn mini" onclick="toggleSound()">${G.settings.sound?'🔇 关闭音效':'🔊 开启音效'}</button>
  <div style="margin-top:14px;padding:12px;background:rgba(255,92,92,.1);border-radius:8px;border:1px solid rgba(255,92,92,.3)">
    <div style="font-size:12px;color:var(--red);font-weight:700;margin-bottom:6px">⚠ 危险操作</div>
    <button class="btn mini danger" onclick="wipeSave()">清空所有存档与进度</button>
  </div>
  <button class="btn" onclick="viewStart()">← 返回</button></div>`;
}
function toggleSound(){G.settings.sound=!G.settings.sound;save();viewSettings();if(G.settings.sound)sfx.click()}
function editTag(){
  const n=prompt('输入你的代号（4-12字）：',G.playerTag);
  if(!n)return;
  const clean=n.replace(/[<>"'&]/g,'').trim().slice(0,12);
  if(clean.length<2){toast('代号至少2字');return}
  G.playerTag=clean;save();viewStart();toast('代号已更新');
}
function wipeSave(){
  if(confirm('确定要清空所有存档、成就、本源点吗？此操作不可撤销。')){
    localStorage.removeItem('lidong_v2');
    G=JSON.parse(JSON.stringify(DEF));
    save();viewStart();toast('已重置');
  }
}

/* ============================================================
   无尽存档
   ============================================================ */
function viewEndless(){
  if(!G.endlessSaves.length){toast('暂无无尽存档');return}
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">无尽养老存档</div>
  ${G.endlessSaves.map((s,i)=>`<div class="shop-item">
  <div class="nm">存档${i+1} · ${s.ending}</div>
  <div class="ds">轮回${s.cycle} · 存活${s.apocDay}天 · 基地${s.baseLevel}级 · 总分${s.score}</div>
  <div class="ds">${s.time}</div>
  <button class="btn mini danger" onclick="delEndless(${i})">删除</button></div>`).join('')}
  <button class="btn" onclick="viewStart()">← 返回</button></div>`;
}
function delEndless(i){G.endlessSaves.splice(i,1);save();viewEndless();toast('已删除')}

/* ============================================================
   本源商店
   ============================================================ */
const TALENTS=[
  {key:'cold',name:'极寒抗性',desc:'每级-20%低温伤害'},
  {key:'intuition',name:'资源直觉',desc:'每级+15%探索稀有物资'},
  {key:'wall',name:'壁垒天赋',desc:'每级基地初始防御+10%'},
  {key:'trade',name:'交易洞察',desc:'每级+8%交易优惠'},
  {key:'body',name:'生存体魄',desc:'每级+15生命上限'},
];
const STARTER={
  food:{name:'物资补给包',desc:'食物80/净水60/药品20/衣服10'},
  base:{name:'基建速成套件',desc:'建材60/武器3/弹药10/初始完整+20'},
  survive:{name:'绝境保命结晶',desc:'药品30/燃料40/保温套件x1'},
};
const CONSUMABLES=[
  {key:'scoutMirror',name:'侦查窥镜',desc:'解锁袭击一级预警',cost:30},
  {key:'hideArchive',name:'档案隐藏药剂',desc:'隐藏榜单15天',cost:40},
  {key:'storageBag',name:'临时储物包',desc:'库存上限+40',cost:20},
];

function enterShop(){G.phase='shop';refreshTop();renderShop()}
function renderShop(){
  refreshTop();
  const uc=G.talentsUsed.length;
  $('#main').innerHTML=`
  <div class="panel"><div class="ptitle">重生本源商店 <span class="right">第${G.cycle}世</span></div>
  <div style="text-align:center;padding:8px 0">
    <div style="font-size:11px;color:var(--dim)">当前本源点</div>
    <div style="font-size:32px;font-weight:900;color:var(--gold);font-family:monospace">${G.originPoints}</div>
    <div style="font-size:10px;color:var(--faint)">本轮回已升级天赋 ${uc}/2</div>
  </div></div>
  <div class="panel"><div class="ptitle">永久天赋</div>
  ${TALENTS.map(t=>{const lv=G.talents[t.key],mx=lv>=5,ut=G.talentsUsed.includes(t.key),cost=50*(lv+1);
    const can=!mx&&(uc<2||ut)&&G.originPoints>=cost;
    return `<div class="shop-item ${mx?'maxed':''}">
    <div class="nm">${t.name}<span class="lv">Lv.${lv}/5${ut?' · 本轮回已升':''}</span></div>
    <div class="ds">${t.desc}</div>
    ${mx?'<div class="cost" style="color:var(--green)">已满级</div>':`<div class="cost">升级：${cost} 本源点</div>
    <button class="btn mini ${can?'ember':''}" ${can?'':'disabled'} onclick="buyTalent('${t.key}')">升级</button>`}
    </div>`}).join('')}</div>
  <div class="panel"><div class="ptitle">开局三选一</div>
  ${Object.keys(STARTER).map(k=>{const p=STARTER[k],c=G.starter===k;
    return `<button class="btn ${c?'ember':''}" ${G.starter&&!c?'disabled':''} onclick="chooseStarter('${k}')">
    ${p.name}${c?' ✓':''}<span class="bd">${p.desc}</span></button>`}).join('')}</div>
  <div class="panel"><div class="ptitle">消耗道具</div>
  ${CONSUMABLES.map(c=>{const o=G.items[c.key]||0,can=G.originPoints>=c.cost;
    return `<div class="shop-item ${o?'maxed':''}">
    <div class="nm">${c.name}${o?`<span class="lv">x${o}</span>`:''}</div>
    <div class="ds">${c.desc}</div>
    <div class="cost">${c.cost} 本源点</div>
    <button class="btn mini" ${can?'':'disabled'} onclick="buyCons('${c.key}',${c.cost})">购买</button></div>`}).join('')}</div>
  <button class="btn ember" ${G.starter?'':'disabled'} onclick="enterPrep()">${G.starter?'✓ 进入灾前30天':'请先选择开局礼包'}</button>
  <button class="btn" onclick="viewStart()">← 返回</button>`;
}
function buyTalent(k){
  const lv=G.talents[k],cost=50*(lv+1);
  if(G.originPoints<cost){toast('本源点不足');sfx.bad();return}
  if(!G.talentsUsed.includes(k)&&G.talentsUsed.length>=2){toast('本轮回最多升2种天赋');return}
  G.originPoints-=cost;G.talents[k]++;
  if(!G.talentsUsed.includes(k))G.talentsUsed.push(k);
  sfx.buy();save();renderShop();toast('升级成功');
}
function buyCons(k,c){
  if(G.originPoints<c){toast('本源点不足');return}
  G.originPoints-=c;G.items[k]=(G.items[k]||0)+1;sfx.buy();save();renderShop();
}
function chooseStarter(k){G.starter=k;save();renderShop();sfx.click()}
function enterPrep(){
  if(G.starter==='food'){G.res.food=80;G.res.water=60;G.res.meds=20;G.res.clothes=10}
  else if(G.starter==='base'){G.res.building=60;G.res.weapons=3;G.res.ammo=10;G.baseIntegrity=120}
  else{G.res.meds=30;G.res.fuel=40;G.items.warmKit=(G.items.warmKit||0)+1}
  if(G.items.storageBag)G.storageCap+=40;
  if(G.talents.wall>0)G.baseIntegrity+=G.talents.wall*10;
  G.maxHp=100+G.talents.body*15;G.hp=G.maxHp;
  G.phase='prep';G.prepDay=1;G.actionPoints=3+(G.talents.body>0?1:0);
  logMsg(`第${G.cycle}世轮回开启，灾前30天倒计时启动`,'ice');
  save();viewPrep();
}

/* ============================================================
   灾前筹备
   ============================================================ */
function viewPrep(){
  refreshTop();const ap=G.actionPoints;
  $('#main').innerHTML=`
  <span class="ph-tag prep">灾前筹备 · 第${G.prepDay}/30天</span>
  <div class="panel"><div class="ptitle">基础面板</div>
    <div class="srow"><span class="k">资金</span><span class="v gold">¥${(G.money/10000).toFixed(1)}万</span></div>
    <div class="srow"><span class="k">关注度</span><span class="v ${G.attention>30?'warn':''}">${G.attention}/100</span></div>
    <div style="margin:8px 0"><div class="bar"><i class="attn" style="width:${G.attention}%"></i><div class="bar-lb">${G.attention}</div></div></div>
    <div class="srow"><span class="k">基地</span><span class="v ice">${['','毛坯','简易','保温','完整','堡垒'][G.baseLevel]} · 上限${G.storageCap}</span></div>
    <div style="margin-top:10px"><div style="font-size:10px;color:var(--faint);margin-bottom:4px">今日行动点</div>
    <div class="ap-row">${Array.from({length:3+(G.talents.body>0?1:0)},(_,i)=>`<div class="ap ${i<ap?'on':''}">${i<ap?'●':'○'}</div>`).join('')}</div></div>
  </div>
  <div class="panel"><div class="ptitle">今日行动</div>
    <button class="btn" onclick="prepAct('business')">💼 经营门店<span class="bd">每日+2万</span></button>
    <button class="btn" onclick="prepAct('sellHouse')">🏠 变卖房产<span class="bd">+50万，关注+15（前10天）</span></button>
    <div style="font-size:10px;color:var(--faint);margin:8px 0 4px;letter-spacing:1px">—— 囤货渠道 ——</div>
    <button class="btn" onclick="prepAct('buyOnline')">📱 线上电商<span class="bd">食30/水20/药5 · 10万 · 无关注</span></button>
    <button class="btn" onclick="prepAct('buyStore')">🏪 线下门店<span class="bd">衣10/建材10/工具 · 8万 · 无关注</span></button>
    <button class="btn" onclick="prepAct('buySecond')">♻ 二手市场<span class="bd">食45/水30/燃15 · 5万 · 关注+2</span></button>
    <button class="btn" onclick="prepAct('buySite')">🏗 工地尾料<span class="bd">建材30/武器1 · 3万 · 关注+3</span></button>
    <button class="btn" onclick="prepAct('buyWholesale')">📦 批发仓库<span class="bd">食60/水40/药10/燃20 · 9万 · 关注+5</span></button>
    <div style="font-size:10px;color:var(--faint);margin:8px 0 4px;letter-spacing:1px">—— 基地 & 情报 ——</div>
    <button class="btn" onclick="prepAct('expand')">🏗 扩建储物<span class="bd">上限+30，8万</span></button>
    <button class="btn" onclick="prepAct('upgrade')">🔨 升级基地<span class="bd">15万，等级+1</span></button>
    <button class="btn" onclick="prepAct('mask')">👤 伪装降关注<span class="bd">关注-8</span></button>
    <button class="btn" onclick="prepAct('scout')">🗺 侦察地图<span class="bd">标记3个资源点，探索率+10%</span></button>
    ${ap<=0?'<button class="btn ember" onclick="endPrepDay()">结束今日 → 第'+(G.prepDay+1)+'天</button>':''}
  </div>
  <div class="panel"><div class="ptitle">日志</div><div id="logbox">${renderLog()}</div></div>`;
}
function prepAct(t){
  if(G.actionPoints<=0){toast('行动点已用完');return}
  let msg='',c='';
  if(t==='business'){G.money+=20000;msg='门店+2万';c='good'}
  else if(t==='sellHouse'){
    if(G.prepDay>10){toast('已过最佳时机');return}
    G.money+=500000;G.attention=clamp(G.attention+15,0,100);
    msg='卖房+50万，关注+15';c='warn';
  }
  else if(t==='buyOnline'){
    if(G.money<100000){toast('资金不足');return}
    G.money-=100000;G.res.food+=30;G.res.water+=20;G.res.meds+=5;
    msg='线上电商：食30/水20/药5';c='ice';
  }
  else if(t==='buyStore'){
    if(G.money<80000){toast('资金不足');return}
    G.money-=80000;G.res.clothes+=10;G.res.building+=10;
    msg='线下门店：衣10/建材10';c='ice';
  }
  else if(t==='buySecond'){
    if(G.money<50000){toast('资金不足');return}
    G.money-=50000;G.res.food+=45;G.res.water+=30;G.res.fuel+=15;
    G.attention=clamp(G.attention+2,0,100);msg='二手市场：食45/水30/燃15，关注+2';c='warn';
  }
  else if(t==='buySite'){
    if(G.money<30000){toast('资金不足');return}
    G.money-=30000;G.res.building+=30;G.res.weapons+=1;
    G.attention=clamp(G.attention+3,0,100);msg='工地尾料：建材30/武器1，关注+3';c='warn';
  }
  else if(t==='buyWholesale'){
    if(G.money<90000){toast('资金不足');return}
    G.money-=90000;G.res.food+=60;G.res.water+=40;G.res.meds+=10;G.res.fuel+=20;
    G.attention=clamp(G.attention+5,0,100);msg='批发仓库：食60/水40/药10/燃20，关注+5';c='warn';
  }
  else if(t==='expand'){
    if(G.money<80000){toast('资金不足');return}
    G.money-=80000;G.storageCap+=30;msg='储物上限+30';c='ice';
  }
  else if(t==='upgrade'){
    if(G.baseLevel>=5){toast('已满级');return}
    if(G.money<150000){toast('资金不足');return}
    G.money-=150000;G.baseLevel++;
    msg='基地升为：'+['','毛坯','简易','保温','完整','堡垒'][G.baseLevel];c='good';
  }
  else if(t==='mask'){
    if(G.attention<=0){toast('关注已为0');G.actionPoints++;return}
    G.attention=clamp(G.attention-8,0,100);msg='伪装，关注-8';c='good';
  }
  else if(t==='scout'){
    G.stats.exploredRate=clamp(G.stats.exploredRate+10,0,100);
    msg='侦察完成，探索率+10%';c='ice';
  }
  G.actionPoints--;logMsg(msg,c);sfx.click();save();viewPrep();toast(msg);
}
function endPrepDay(){
  if(G.attention>0)G.attention=clamp(G.attention-1,0,100);
  prepEvent();
  G.prepDay++;G.actionPoints=3+(G.talents.body>0?1:0);
  if(G.prepDay>G.prepTotal)triggerApoc();
  else{save();viewPrep()}
}
function prepEvent(){
  if(!chance(0.5))return;
  const ev=[
    ()=>{G.money+=50000;logMsg('【事件】理财收益+5万','good')},
    ()=>{G.money-=30000;logMsg('【事件】汽车维修-3万','bad')},
    ()=>{G.res.food+=20;logMsg('【事件】超市打折食物+20','good')},
    ()=>{G.attention=clamp(G.attention+3,0,100);logMsg('【事件】邻居注意到你，关注+3','warn')},
    ()=>{G.res.meds+=5;logMsg('【事件】药店清仓，药品+5','good')},
    ()=>{G.res.scrap+=10;logMsg('【事件】捡到电子废料+10','ice')},
    ()=>{G.money+=80000;logMsg('【事件】股票意外收益+8万','good')},
    ()=>{G.res.clothes+=10;logMsg('【事件】外贸店清仓，衣物+10','good')},
    ()=>{G.res.fuel+=15;logMsg('【事件】加油站促销，燃料+15','good')},
    ()=>{G.attention=clamp(G.attention+5,0,100);logMsg('【事件】快递频繁上门，关注+5','warn')},
    ()=>{G.res.water+=25;logMsg('【事件】囤到特价瓶装水+25','good')},
    ()=>{G.money-=20000;logMsg('【事件】房东突然涨租-2万','bad')},
    ()=>{G.res.building+=15;logMsg('【事件】建材市场尾货，建材+15','good')},
    ()=>{G.res.weapons+=1;logMsg('【事件】网购到货一把砍刀','ice')},
    ()=>{G.attention=clamp(G.attention-2,0,100);logMsg('【事件】小区没人注意你','good')},
    ()=>{G.res.ammo+=8;logMsg('【事件】户外店弹药特价+8','ice')},
    ()=>{G.money+=30000;G.attention=clamp(G.attention+4,0,100);logMsg('【事件】二手平台倒卖赚3万，但被人盯上','warn')},
    ()=>{G.res.food-=10;logMsg('【事件】冰箱坏了，食物-10','bad')},
  ];
  pick(ev)();
}

/* ============================================================
   末世触发
   ============================================================ */
function triggerApoc(){
  G.phase='apoc';G.apocDay=1;G.weather='clear';
  generateBoard();
  logMsg('灾变！72小时暴跌至-45℃','bad');
  logMsg('解锁：探索/商城/战斗/榜单/种植','ice');
  save();
  showModal(`
  <h3 class="ember">⚠ 骤然凛冬 ⚠</h3>
  <div style="font-size:13px;line-height:2;color:var(--dim);text-align:center">
    2047年7月15日，盛夏正午。<br>
    气温在72小时内从38℃暴跌至<b style="color:var(--ice)">-45℃</b>。<br><br>
    电网瘫痪。供水冻结。城市冰封。<br>
    你的避难所室内：<b style="color:var(--ember)">${G.temperature}℃</b><br>
    <b style="color:var(--gold)">你不是唯一的幸存者。</b>
  </div>
  <button class="btn ember" style="margin-top:16px" onclick="closeModal();viewApoc()">进入凛冬 →</button>`);
}

/* ============================================================
   末世生存
   ============================================================ */
function viewApoc(){
  refreshTop();
  const hpPct=G.hp/G.maxHp*100;
  const integPct=clamp(G.baseIntegrity,0,100);
  const ts=totalScore();
  const fm=G.weather==='cold'?2:1;
  const wn={clear:'晴朗',snow:'暴雪',cold:'寒潮',ice:'融冰'}[G.weather];
  $('#main').innerHTML=`
  <span class="ph-tag apoc">末世第${G.apocDay}天 · ${wn}</span>
  <div class="panel"><div class="ptitle">生存面板</div>
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="color:var(--dim)">生命</span><span style="font-family:monospace;color:var(--ember);font-weight:700">${G.hp}/${G.maxHp}</span></div>
      <div class="bar"><i class="hp" style="width:${hpPct}%"></i><div class="bar-lb">${Math.round(hpPct)}%</div></div>
    </div>
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="color:var(--dim)">基地完整度</span><span style="font-family:monospace;color:var(--ice);font-weight:700">${Math.round(G.baseIntegrity)}%</span></div>
      <div class="bar"><i class="integ" style="width:${integPct}%"></i><div class="bar-lb">${Math.round(integPct)}%</div></div>
    </div>
    <div class="srow"><span class="k">室内温度</span><span class="v ember">${G.temperature}℃</span></div>
    <div class="srow"><span class="k">日耗</span><span class="v">食5 水3 燃${2*fm}</span></div>
    <div class="srow"><span class="k">危险度</span><span class="v ${G.attention>50?'warn':''}">${G.attention}%</span></div>
    <div class="srow"><span class="k">排名</span><span class="v ice">#${G.playerRank}</span></div>
    <div class="srow"><span class="k">积分</span><span class="v gold">${G.integral}</span></div>
    <div class="srow"><span class="k">四维总分</span><span class="v gold">${ts}/100</span></div>
    <div class="ap-row">${Array.from({length:3},(_,i)=>`<div class="ap ${i<G.actionPoints?'on':''}">${i<G.actionPoints?'●':'○'}</div>`).join('')}<span style="font-size:10px;color:var(--faint)">行动点</span></div>
  </div>
  ${G.allies.length?`<div class="panel"><div class="ptitle">盟友（${G.allies.length}/2）</div>
  ${G.allies.map((a,i)=>`<div class="srow"><span class="k">🤝 ${a.name}</span><span class="v ${a.trust>50?'good':'warn'}">信任${a.trust}/100</span></div>`).join('')}
  </div>`:''}
  <div class="panel"><div class="ptitle">今日行动</div>
    <button class="btn" onclick="apocAct('repair')">🔧 维修供暖<span class="bd">建材5/燃3，完整+15</span></button>
    <button class="btn" onclick="apocAct('exploreSuburb')">🧭 近郊探索<span class="bd">低风险 · 食5-10/水3-6</span></button>
    <button class="btn" onclick="apocAct('exploreCity')">🏙 城区探索<span class="bd">中风险 · 食10-18/建材5-10</span></button>
    <button class="btn" onclick="apocAct('exploreDeep')">❄ 冻土深处<span class="bd">高风险 · 稀有物资/武器</span></button>
    <button class="btn" onclick="apocAct('market')">🛒 天衍商城<span class="bd">每10天轮换</span></button>
    <button class="btn" onclick="apocAct('craft')">🔨 制作台<span class="bd">合成物品</span></button>
    <button class="btn" onclick="apocAct('wanderer')">🚶 流浪者<span class="bd">救助/无视/掠夺/结盟</span></button>
    <button class="btn" onclick="apocAct('farm')">🌾 种植采收<span class="bd">需2级基地</span></button>
    <button class="btn" onclick="apocAct('meds')">💊 使用药品<span class="bd">恢复20+生命</span></button>
    ${G.actionPoints<=0?'<button class="btn ember" onclick="endApocDay()">结束今日 → 第'+(G.apocDay+1)+'天</button>':''}
  </div>
  <div class="panel"><div class="ptitle">日志</div><div id="logbox">${renderLog()}</div></div>`;
}
function totalScore(){return clamp(G.score.reserve+G.score.wall+G.score.survive+G.score.world,0,100)}

function apocAct(t){
  if(G.actionPoints<=0){toast('行动点已用完');return}
  let msg='',c='';
  if(t==='repair'){
    if(G.res.building<5||G.res.fuel<3){toast('资源不足');return}
    G.res.building-=5;G.res.fuel-=3;
    const h=15+G.talents.wall*5;
    G.baseIntegrity=clamp(G.baseIntegrity+h,0,120);
    G.temperature=clamp(G.temperature+5,-30,-5);
    msg=`维修+${h}%，温度${G.temperature}℃`;c='good';sfx.buy();
  }
  else if(t==='exploreSuburb'||t==='exploreCity'||t==='exploreDeep'){
    const risk=t==='exploreSuburb'?0:t==='exploreCity'?1:2;
    const zones=['近郊','城区','冻土深处'],danger=[.12,.3,.55][risk];
    const fg=[6,12,22][risk]+G.talents.intuition*2,wg=[4,8,15][risk],bg=[2,6,12][risk];
    G.res.food+=fg;G.res.water+=wg;G.res.building+=bg;G.res.scrap+=rnd(3+risk*2);
    if(risk===2){G.res.weapons+=chance(.3)?1:0;G.res.ammo+=chance(.4)?4:0}
    G.stats.exploredRate=clamp(G.stats.exploredRate+[3,6,10][risk],0,100);
    if(G.stats.exploredRate>=100)unlockAch('explorer');
    msg=`探索${zones[risk]}：食+${fg} 水+${wg} 建材+${bg}`;
    if(chance(danger)){
      if(chance(.5)){msg+='；遭遇异兽！';c='warn';G.actionPoints--;triggerBeast();save();viewApoc();return}
      else{const d=[4,8,18][risk];G.hp=clamp(G.hp-d,0,G.maxHp);msg+=`；冻伤-${d}`;c='bad';floatDmg('-'+d,'#ff5c5c')}
    }else c='ice';
  }
  else if(t==='market'){openMarket();return}
  else if(t==='craft'){openCraft();return}
  else if(t==='wanderer'){triggerWanderer();return}
  else if(t==='farm'){
    if(G.baseLevel<2){toast('需2级基地');return}
    const f=6+G.baseLevel*2,m=chance(.5)?2:0;
    G.res.food+=f;G.res.meds+=m;
    msg=`种植：食物+${f}${m?` 药+${m}`:''}`;c='good';
  }
  else if(t==='meds'){
    if(G.res.meds<1){toast('无药品');return}
    G.res.meds--;const h=20+G.talents.body*5;
    G.hp=clamp(G.hp+h,0,G.maxHp);
    msg=`用药+${h}生命`;c='good';floatDmg('+'+h,'#5ed19a');sfx.good();
  }
  G.actionPoints--;logMsg(msg,c);save();viewApoc();toast(msg);
}

/* ===== 制作台 ===== */
const RECIPES=[
  {key:'bandage',name:'简易绷带',need:{meds:1,scrap:2},give:{meds:3},desc:'药品1+废料2 → 药品3'},
  {key:'fuel',name:'燃料块',need:{scrap:3,building:1},give:{fuel:5},desc:'废料3+建材1 → 燃料5'},
  {key:'ammo',name:'简易弹药',need:{scrap:4,building:2},give:{ammo:6},desc:'废料4+建材2 → 弹药6'},
  {key:'trap',name:'防御陷阱',need:{building:5,scrap:3},give:{},custom:'trap',desc:'建材5+废料3 → 基地防御+10%'},
];
function openCraft(){
  showModal(`<h3>🔨 制作台</h3>
  <div style="font-size:11px;color:var(--faint);text-align:center;margin-bottom:10px">废料：${G.res.scrap} · 建材：${G.res.building}</div>
  ${RECIPES.map((r,i)=>{
    const can=Object.entries(r.need).every(([k,v])=>(G.res[k]||0)>=v);
    return `<div class="shop-item">
    <div class="nm">${r.name}</div><div class="ds">${r.desc}</div>
    <button class="btn mini ${can?'ember':''}" ${can?'':'disabled'} onclick="doCraft(${i})">制作</button></div>`}).join('')}
  <button class="btn" onclick="closeModal()">关闭</button>`);
}
function doCraft(i){
  const r=RECIPES[i];
  for(const[k,v]of Object.entries(r.need))G.res[k]-=v;
  if(r.custom==='trap'){G.baseIntegrity=clamp(G.baseIntegrity+10,0,120);logMsg('布置防御陷阱，基地+10%','good')}
  else{for(const[k,v]of Object.entries(r.give))G.res[k]=(G.res[k]||0)+v;logMsg(`制作${r.name}完成`,'good')}
  G.stats.crafts++;if(G.stats.crafts>=5)unlockAch('crafter');
  sfx.buy();save();closeModal();openCraft();
}

/* ===== 商城 ===== */
function openMarket(){
  if(G.marketTimer<=0||!G.marketList.length){
    const items=[
      {key:'food',name:'压缩食物',q:15,price:800},{key:'water',name:'净水片',q:12,price:600},
      {key:'fuel',name:'燃料桶',q:10,price:1000},{key:'meds',name:'医疗包',q:4,price:1500},
      {key:'building',name:'建材包',q:10,price:900},{key:'weapons',name:'冷兵器',q:1,price:2000},
      {key:'ammo',name:'弹药盒',q:8,price:1200},{key:'scrap',name:'电子废料',q:8,price:500},
    ];
    G.marketList=items.sort(()=>Math.random()-.5).slice(0,4);G.marketTimer=10;
  }
  const td=1-G.talents.trade*.08;
  showModal(`<h3>🛒 天衍商城</h3>
  <div style="font-size:10px;color:var(--faint);text-align:center;margin-bottom:8px">轮换倒计时：${G.marketTimer}天</div>
  ${G.marketList.map((it,i)=>`<div class="shop-item">
  <div class="nm">${it.name} <span class="lv">x${it.q}</span></div>
  <div class="cost">${Math.round(it.price*td)} 积分</div>
  <button class="btn mini" onclick="buyMarket(${i})">购买</button></div>`).join('')}
  <div style="text-align:center;font-size:12px;margin:8px 0;color:var(--dim)">积分：<b style="color:var(--gold)">${G.integral}</b></div>
  <button class="btn" onclick="closeModal()">关闭</button>`);
}
function buyMarket(i){
  const it=G.marketList[i],p=Math.round(it.price*(1-G.talents.trade*.08));
  if(G.integral<p){toast('积分不足');return}
  G.integral-=p;G.res[it.key]=(G.res[it.key]||0)+it.q;
  logMsg(`购入${it.name}x${it.q}`,'good');sfx.buy();
  save();closeModal();openMarket();
}

/* ===== 流浪者 ===== */
function triggerWanderer(){
  if(G.wandererCd>0){toast('附近无流浪者');return}
  const f=chance(.6),canAlly=f&&G.allies.length<2;
  const wname=pick(['冻土拾荒者','雪区旅人','冰原猎人','废墟医生','寒潮行者'])+'-'+String(rnd(99)).padStart(2,'0');
  showModal(`<h3>${f?'遇到友善流浪者':'遇到中立流浪者'}</h3>
  <div style="font-size:13px;color:var(--dim);text-align:center;margin:10px 0">${f?`一个叫<b style="color:var(--ice)">${wname}</b>的幸存者请求食物。`:'一个流浪者警惕地观察你的避难所。'}</div>
  ${f?`<button class="btn" onclick="wandererAct('help','${wname}')">🤝 救助（食5，换声望）</button>`:''}
  ${canAlly?`<button class="btn" onclick="wandererAct('ally','${wname}')">⚔ 提议结盟（信任60，需食10）</button>`:''}
  <button class="btn" onclick="wandererAct('ignore')">🚪 无视</button>
  <button class="btn danger" onclick="wandererAct('rob')">💀 掠夺（世域-5）</button>`);
}
function wandererAct(a){
  G.wandererCd=3;
function wandererAct(a,wname){
  G.wandererCd=3;
  if(a==='help'){
    if(G.res.food<5){toast('食物不足');return}
    G.res.food-=5;G.rep=clamp(G.rep+2,-10,10);G.score.world=clamp(G.score.world+1,0,25);
    if(chance(.7)){const r=rnd(3);
      if(r===0){G.res.meds+=3;logMsg('流浪者赠医疗包x3','good')}
      else if(r===1){G.res.building+=8;logMsg('流浪者赠建材x8','good')}
      else{G.res.ammo+=5;logMsg('流浪者赠弹药x5','good')}}
    G.stats.helped++;
    if(G.stats.helped>=10)unlockAch('savior');
    logMsg('救助了流浪者','good');
  }else if(a==='ally'){
    if(G.allies.length>=2){toast('盟友已满');return}
    if(G.res.food<10){toast('食物不足');return}
    G.res.food-=10;
    G.allies.push({name:wname,trust:60});
    G.rep=clamp(G.rep+3,-10,10);
    logMsg(`与${wname}结盟，信任60`,'good');sfx.good();
  }else if(a==='ignore'){logMsg('闭门不见','')}
  else{
    G.res.food+=15;G.res.water+=8;G.score.world=clamp(G.score.world-5,0,25);
    G.rep=clamp(G.rep-3,-10,10);G.stats.killed++;
    if(G.stats.killed>=5)unlockAch('tyrant');
    logMsg('掠夺流浪者，世域-5','bad');sfx.bad();
  }
  G.actionPoints--;save();closeModal();viewApoc();
}

/* ===== 战斗 ===== */
function triggerBeast(){
  showModal(`<h3 class="ember">⚔ 寒变异兽袭击！</h3>
  <div style="text-align:center;color:var(--dim);font-size:13px;margin:10px 0">畸变兽撞向你的外墙！</div>
  <button class="btn" onclick="battle('defend','beast')">🛡 固守<span class="bd">燃8建材4，低风险少收益</span></button>
  <button class="btn danger" onclick="battle('attack','beast')">⚔ 强攻<span class="bd">武器2弹药6，高风险高收益</span></button>`);
}
function battle(mode,enemy){
  closeModal();
  let win=false,msg='',c='';
  if(mode==='defend'){
    if(G.res.fuel<8||G.res.building<4){toast('资源不足');viewApoc();return}
    G.res.fuel-=8;G.res.building-=4;win=chance(.85);
    if(win){G.res.food+=5;G.res.water+=3;msg=`固守${enemy==='beast'?'异兽':'掠夺者'}胜利`;c='good'}
    else{G.baseIntegrity=clamp(G.baseIntegrity-10,0,100);G.hp=clamp(G.hp-10,0,G.maxHp);msg='固守失败，-10HP';c='bad';floatDmg('-10')}
  }else{
    if(G.res.weapons<2||G.res.ammo<6){toast('武器/弹药不足');viewApoc();return}
    G.res.weapons-=2;G.res.ammo-=6;
    win=chance(clamp(.5+G.res.weapons*.03+G.talents.body*.02,0,.95));
    if(win){
      if(enemy==='beast'){G.res.food+=15;G.res.meds+=3;G.res.building+=5;G.stats.beastKilled++;if(G.stats.beastKilled>=5)unlockAch('slayer')}
      else{G.res.food+=22;G.res.water+=10;G.res.building+=8;G.stats.raidDefeated++}
      msg=`强攻胜利！击退${enemy==='beast'?'异兽':'掠夺者'}`;c='good';sfx.hit();floatDmg('胜利！','#ffd56a');
    }else{
      G.baseIntegrity=clamp(G.baseIntegrity-25,0,100);G.hp=clamp(G.hp-30,0,G.maxHp);
      msg='强攻惨败！-25%基地，-30HP';c='bad';floatDmg('-30');sfx.bad();
    }
  }
  logMsg(msg,c);
  if(G.hp<=0)setTimeout(()=>gameOver('death'),500);
  save();viewApoc();
}

/* ===== 排行榜 ===== */
function generateBoard(){
  const names=['冻土拾荒者','冰原独行者','雪区守墙人','寒潮旅人','废土猎手','冰封守望','极寒漫游者','冻土商队','雪原浪人','冰穴隐者','寒域游骑','雪线猎手','冰封行者','冰原流浪者','霜堡领主','雪原孤魂','冻土信使','寒区幸存者','暴雪过客','冻土拾荒者-07'];
  G.board=Array.from({length:100},(_,i)=>({
    name:pick(names)+'-'+String(rnd(99)).padStart(2,'0'),
    score:clamp(100-i-rnd(10),0,100),
    type:chance(.4)?'raid':(chance(.5)?'order':'lone'),
  }));
  G.playerRank=80+rnd(15);G.stats.maxRank=G.playerRank;
}
function viewBoard(){
  refreshTop();
  const tabs=[{k:'total',n:'综合'},{k:'reserve',n:'储备'},{k:'wall',n:'壁垒'},{k:'survive',n:'存续'},{k:'world',n:'探索'}];
  const dimMap={total:totalScore,reserve:()=>G.score.reserve,wall:()=>G.score.wall,survive:()=>G.score.survive,world:()=>G.stats.exploredRate};
  const myScore=dimMap[G.boardTab]();
  // 生成当前Tab的榜单（基于总分偏移）
  const offset={total:0,reserve:-15,wall:-10,survive:-20,world:-25}[G.boardTab];
  const b=G.board.map(r=>({...r,score:clamp(r.score+offset+rnd(8)-4,0,100)}));
  const meRank=Math.max(1,Math.min(100,b.findIndex(r=>r.score<myScore)+1));
  const top=b.slice(0,meRank+5).concat([{name:G.playerTag,score:myScore,type:'me',isMe:true}]).sort((a,c)=>c.score-a.score).slice(Math.max(0,meRank-8),meRank+5);
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">天衍排行榜<span class="right">第${G.season}赛季 · ${G.seasonDay}/120天</span></div>
  <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap">
  ${tabs.map(t=>`<button class="btn mini" style="flex:1;min-width:60px;text-align:center;justify-content:center;${G.boardTab===t.k?'background:rgba(94,200,248,.2);border-color:var(--ice);color:var(--ice)':''}" onclick="G.boardTab='${t.k}';save();viewBoard()">${t.n}</button>`).join('')}
  </div>
  ${G.items.archiveHidden>0?`<div style="text-align:center;font-size:11px;color:var(--ice);margin-bottom:6px">档案隐藏中（${G.items.archiveHidden}天）</div>`:''}
  <div style="max-height:380px;overflow-y:auto">
  ${top.map((r,i)=>{
    const rk=Math.max(1,meRank-8)+i;
    return `<div class="lb ${r.isMe?'me':''}">
    <div class="rk ${rk===1?'t1':rk===2?'t2':rk===3?'t3':''}">${rk}</div>
    <div class="nm">${r.name}${r.type==='raid'?'<span class="tg raid">掠夺</span>':r.type==='order'?'<span class="tg order">守序</span>':r.type==='lone'?'<span class="tg lone">独行</span>':''}${r.isMe?' <span style="color:var(--ice);font-size:10px">(你)</span>':''}</div>
    <div class="sc">${r.score}</div></div>`}).join('')}
  </div>
  <div style="margin-top:8px;font-size:10px;color:var(--faint);text-align:center">你的排名：#${meRank} · 代号：${G.playerTag}</div>
  <button class="btn" onclick="viewApoc()">← 返回</button></div>`;
}

/* ===== 库存 ===== */
function viewInventory(){
  refreshTop();
  const items=[['food','食物'],['water','净水'],['fuel','燃料'],['meds','药品'],['building','建材'],['weapons','武器'],['ammo','弹药'],['clothes','衣物'],['scrap','废料']];
  const total=Object.values(G.res).reduce((a,b)=>a+b,0);
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">物资（${total}/${G.storageCap}）</div>
  <div class="inv-grid">${items.map(([k,n])=>`<div class="icell"><span class="n">${n}</span><span class="q">${G.res[k]||0}</span></div>`).join('')}</div></div>
  <div class="panel"><div class="ptitle">道具</div>
  <div class="inv-grid">
  <div class="icell"><span class="n">侦查窥镜</span><span class="q">${G.items.scoutMirror||0}</span></div>
  <div class="icell"><span class="n">隐藏药剂</span><span class="q">${G.items.hideArchive||0}</span></div>
  <div class="icell"><span class="n">储物包</span><span class="q">${G.items.storageBag||0}</span></div>
  <div class="icell"><span class="n">保温套件</span><span class="q">${G.items.warmKit||0}</span></div>
  </div>
  ${G.items.scoutMirror>0?'<button class="btn mini" onclick="useScout()">使用窥镜</button>':''}
  ${G.items.hideArchive>0?'<button class="btn mini" onclick="useHide()">使用隐藏药剂</button>':''}
  </div>
  <button class="btn" onclick="${backNav()}">← 返回</button>`;
}
function useScout(){G.items.scoutMirror--;G.scoutOn=true;logMsg('窥镜已激活','ice');save();viewInventory();toast('预警已解锁')}
function useHide(){G.items.hideArchive--;G.items.archiveHidden=15;logMsg('档案隐藏15天','ice');save();viewInventory();toast('已隐藏')}

/* ===== 基地 ===== */
function viewBase(){
  refreshTop();
  const bn=['','毛坯','简易','保温','完整','堡垒'];
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">基地详情</div>
  <div class="srow"><span class="k">等级</span><span class="v ice">${G.baseLevel}级 · ${bn[G.baseLevel]}</span></div>
  <div class="srow"><span class="k">完整度</span><span class="v">${Math.round(G.baseIntegrity)}%</span></div>
  <div class="srow"><span class="k">库存</span><span class="v">${G.storageCap}</span></div>
  <div class="srow"><span class="k">温度</span><span class="v ember">${G.temperature}℃</span></div>
  <div class="srow"><span class="k">种植</span><span class="v">${G.baseLevel>=2?'有':'无'}</span></div>
  <div class="srow"><span class="k">防御天赋</span><span class="v ice">+${G.talents.wall*10}%</span></div>
  ${G.baseLevel>=5?unlockAch('fortress'):''}
  ${G.baseIntegrity<30?'<div style="margin-top:10px;padding:10px;background:rgba(255,92,92,.1);border-radius:8px;color:var(--red);font-size:12px">⚠ 基地破损严重！</div>':''}
  </div><button class="btn" onclick="${backNav()}">← 返回</button></div>`;
}

/* ===== 状态/四维 ===== */
function viewStatus(){
  refreshTop();const t=totalScore();
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">四维评分</div>
  <div class="score-grid">
  <div class="scell"><div class="dn">储备</div><div class="num">${G.score.reserve}</div><div class="mx">/25</div></div>
  <div class="scell"><div class="dn">壁垒</div><div class="num">${G.score.wall}</div><div class="mx">/25</div></div>
  <div class="scell"><div class="dn">存续</div><div class="num">${G.score.survive}</div><div class="mx">/25</div></div>
  <div class="scell"><div class="dn">世域</div><div class="num">${G.score.world}</div><div class="mx">/25</div></div>
  </div>
  <div style="text-align:center;padding:12px;background:rgba(0,0,0,.3);border-radius:8px">
  <div style="font-size:11px;color:var(--faint)">总分</div>
  <div style="font-size:36px;font-weight:900;color:var(--gold);font-family:monospace">${t}<span style="font-size:14px;color:var(--faint)">/100</span></div></div>
  </div>
  <div class="panel"><div class="ptitle">本局数据</div>
  <div class="srow"><span class="k">存活</span><span class="v ice">${G.apocDay}天</span></div>
  <div class="srow"><span class="k">基地</span><span class="v">${G.baseLevel}级</span></div>
  <div class="srow"><span class="k">探索率</span><span class="v">${G.stats.exploredRate}%</span></div>
  <div class="srow"><span class="k">最高排名</span><span class="v ice">#${G.stats.maxRank}</span></div>
  <div class="srow"><span class="k">击退掠夺</span><span class="v">${G.stats.raidDefeated}</span></div>
  <div class="srow"><span class="k">击杀异兽</span><span class="v">${G.stats.beastKilled}</span></div>
  <div class="srow"><span class="k">救助</span><span class="v good">${G.stats.helped}</span></div>
  <div class="srow"><span class="k">掠夺</span><span class="v ${G.stats.killed>0?'warn':''}">${G.stats.killed}</span></div>
  <div class="srow"><span class="k">声望</span><span class="v ${G.rep>=0?'good':'warn'}">${G.rep>=0?'友善':'恶名'} ${G.rep}</span></div>
  </div>
  <button class="btn" onclick="${backNav()}">← 返回</button></div>`;
}

/* ===== 成就 ===== */
function viewAch(){
  refreshTop();
  $('#main').innerHTML=`<div class="panel"><div class="ptitle">成就（${G.achievements.length}/${ACH.length}）</div>
  ${ACH.map(a=>{const u=G.achievements.includes(a.id);
    return `<div class="ach-item ${u?'':'locked'}">
    <div class="ic">${a.icon}</div>
    <div class="info"><div class="t">${a.name}</div><div class="d">${a.desc}</div></div>
    <div style="color:${u?'var(--gold)':'var(--faint)'};font-size:11px">${u?'✓':'🔒'}</div></div>`}).join('')}
  <button class="btn" onclick="${backNav()}">← 返回</button></div>`;
}

function backNav(){return G.phase==='apoc'?'viewApoc()':G.phase==='prep'?'viewPrep()':'viewStart()'}

/* ===== 末日结束一天 ===== */
function endApocDay(){
  const fm=G.weather==='cold'?2:1;
  G.res.food-=5;G.res.water-=3;G.res.fuel-=2*fm;
  let dmg=0;
  if(G.res.food<0){dmg+=8;G.res.food=0}
  if(G.res.water<0){dmg+=8;G.res.water=0}
  if(G.res.fuel<0){dmg+=5;G.res.fuel=0;G.temperature=clamp(G.temperature-5,-40,-5)}
  dmg=Math.max(0,dmg*(1-G.talents.cold*.2));
  if(dmg>0){G.hp=clamp(G.hp-dmg,0,G.maxHp);logMsg(`物资短缺-${Math.round(dmg)}HP`,'bad');G.score.survive=clamp(G.score.survive-1,0,25)}
  rollWeather();
  if(G.weather==='snow'&&chance(.3)){G.baseIntegrity=clamp(G.baseIntegrity-5,0,100);logMsg('暴雪压顶-5%','warn')}
  if(G.weather==='ice'&&chance(.3)){G.baseIntegrity=clamp(G.baseIntegrity-4,0,100);logMsg('融冰渗水-4%','warn')}
  if(G.baseIntegrity<30){
    G.structDmg++;
    if(G.structDmg>=3){
      G.baseIntegrity=clamp(G.baseIntegrity-15,0,100);
      logMsg('连锁破损爆发！-15%完整度','bad');sfx.bad();
      G.structDmg=0;
    }
  }else{G.structDmg=0}
  // 盟友每日结算
  G.allies.forEach(a=>{
    a.trust=clamp(a.trust-2,0,100);
    if(chance(.15)){
      if(G.res.food>=5){G.res.food-=5;a.trust=clamp(a.trust+5,0,100);logMsg(`${a.name}索要食物，已供给`,'good')}
      else{a.trust=clamp(a.trust-10,0,100);logMsg(`${a.name}因缺物资信任下降`,'warn')}
    }
  });
  G.allies=G.allies.filter(a=>{
    if(a.trust<=0){logMsg(`${a.name}断盟离开`,'bad');return false}
    return true;
  });
  // 动态评分
  const totalItems=Object.values(G.res).reduce((a,b)=>a+b,0);
  G.score.reserve=clamp(5+Math.floor(totalItems/10),0,25);
  G.score.wall=clamp(G.baseLevel*4+Math.floor(G.baseIntegrity/25),0,25);
  if(totalItems>=200)unlockAch('rich');
  if(G.attention>0)G.attention=clamp(G.attention-2,0,100);
  if(G.marketTimer>0)G.marketTimer--;
  if(G.items.archiveHidden>0)G.items.archiveHidden--;
  if(G.wandererCd>0)G.wandererCd--;
  G.integral+=10+G.baseLevel*2+(G.weather==='clear'?5:0);
  G.seasonDay++;
  if(G.seasonDay>=120){G.season++;G.seasonDay=0;logMsg(`第${G.season}赛季开始`,'ice')}
  G.apocDay++;G.actionPoints=3;
  G.stats.daysSurvived=G.apocDay;
  if(G.apocDay>=100)unlockAch('survivor');
  if(G.playerRank<=10)unlockAch('top10');
  if(G.hp<=0){gameOver('death');return}
  raiderAttack();
  apocRandomEvent();
  checkEnding();save();viewApoc();
}
function apocRandomEvent(){
  if(!chance(0.35))return;
  const ev=[
    ()=>{G.res.food+=8;logMsg('【末世事件】废弃便利店搜刮到食物+8','good')},
    ()=>{G.res.water+=6;logMsg('【末世事件】融化积雪得到净水+6','good')},
    ()=>{G.res.scrap+=8;logMsg('【末世事件】废墟捡到电子废料+8','ice')},
    ()=>{G.baseIntegrity=clamp(G.baseIntegrity-6,0,100);logMsg('【末世事件】墙体出现裂缝-6%','warn')},
    ()=>{G.attention=clamp(G.attention+3,0,100);logMsg('【末世事件】炊烟被远处的人看到','warn')},
    ()=>{G.res.meds+=3;logMsg('【末世事件】找到急救箱，药品+3','good')},
    ()=>{G.res.ammo+=5;logMsg('【末世事件】废弃警车里找到弹药+5','ice')},
    ()=>{G.res.building+=8;logMsg('【末世事件】拆废车得到建材+8','good')},
    ()=>{G.hp=clamp(G.hp-8,0,G.maxHp);logMsg('【末世事件】夜间温度骤降-8HP','bad');floatDmg('-8')},
    ()=>{G.res.fuel+=10;logMsg('【末世事件】油罐车残骸抽到燃料+10','good')},
    ()=>{G.integral+=15;logMsg('【末世事件】天衍商城优惠券+15积分','ice')},
    ()=>{G.attention=clamp(G.attention-3,0,100);logMsg('【末世事件】暴雪掩盖了你的痕迹','good')},
  ];
  pick(ev)();
}
function rollWeather(){
  const r=Math.random();
  G.weather=r<.5?'clear':r<.75?'snow':r<.9?'cold':'ice';
}
function raiderAttack(){
  if(G.items.archiveHidden>0)return;
  const rc=G.attention/200+(G.playerRank<20?.05:0);
  if(!chance(rc))return;
  const e=G.board[Math.max(0,G.playerRank-2)];
  if(!e||e.type!=='raid')return;
  sfx.alert();
  if(G.scoutOn||G.items.scoutMirror>0){
    showModal(`<h3 class="ember">⚠ 袭击预警</h3>
    <div style="text-align:center;color:var(--dim);margin:10px 0">${e.name} 正在靠近！</div>
    <button class="btn ember" onclick="closeModal();triggerRaider('${e.name}')">迎击</button>`);
  }else{
    logMsg(`${e.name} 的掠夺小队突袭！`,'bad');
    setTimeout(()=>triggerRaider(e.name),800);
  }
}
function triggerRaider(name){
  showModal(`<h3 class="ember">${name} 进攻！</h3>
  <div style="text-align:center;color:var(--dim);margin:10px 0">掠夺小队破门而入！</div>
  <button class="btn" onclick="battle('defend','raider')">🛡 固守<span class="bd">燃10建材5</span></button>
  <button class="btn danger" onclick="battle('attack','raider')">⚔ 强攻<span class="bd">武器3弹药5</span></button>`);
}

/* ===== 结局判定 ===== */
function checkEnding(){
  let e=null;
  if(G.apocDay>=62&&G.stats.killed===0&&G.playerRank>30)e='survive';
  if(G.baseLevel>=5&&G.allies.length>=2)e='lord';
  if(G.stats.exploredRate>=70&&G.allies.length===0&&G.apocDay>=40)e='lone';
  if(G.score.world<=5&&G.stats.killed>=3&&G.stats.raidDefeated>=5)e='tyrant';
  if(G.apocDay>=100&&G.baseLevel>=3)e='eternal';
  if(e)gameOver(e);
}
function gameOver(eid){
  const e=ENDINGS.find(x=>x.id===eid),t=totalScore();
  const first=!G.unlockedEndings.includes(eid),bonus=first?20:5;
  G.currentEnding=eid;G.unlockedEndings.push(eid);
  G.originPoints+=t+bonus;
  G.phase='ending';
  unlockAch('first_step');
  save();
  const color=eid==='death'?'ember':eid==='tyrant'?'ember':eid==='eternal'?'gold':'ice';
  $('#main').innerHTML=`
  <div class="ending-hero">
    <div class="tag">— 轮回结算 —</div>
    <h2 class="${color}">${e.name}</h2>
    <p>${e.desc}</p>
  </div>
  <div class="panel">
    <div class="score-grid">
    <div class="scell"><div class="dn">储备</div><div class="num">${G.score.reserve}</div></div>
    <div class="scell"><div class="dn">壁垒</div><div class="num">${G.score.wall}</div></div>
    <div class="scell"><div class="dn">存续</div><div class="num">${G.score.survive}</div></div>
    <div class="scell"><div class="dn">世域</div><div class="num">${G.score.world}</div></div>
    </div>
    <div class="srow"><span class="k">总分</span><span class="v gold">${t}/100</span></div>
    <div class="srow"><span class="k">本源点</span><span class="v ice">+${t}</span></div>
    <div class="srow"><span class="k">${first?'首通奖励':'重复奖励'}</span><span class="v good">+${bonus}</span></div>
    <div class="srow" style="border-top:2px solid var(--ice)"><span class="k">累计本源</span><span class="v gold">${G.originPoints}</span></div>
  </div>
  <div class="panel"><div class="ptitle">本局数据</div>
  <div class="srow"><span class="k">存活</span><span class="v ice">${G.apocDay}天</span></div>
  <div class="srow"><span class="k">基地</span><span class="v">${G.baseLevel}级</span></div>
  <div class="srow"><span class="k">探索率</span><span class="v">${G.stats.exploredRate}%</span></div>
  <div class="srow"><span class="k">最高排名</span><span class="v">#${G.stats.maxRank}</span></div>
  <div class="srow"><span class="k">救助/掠夺</span><span class="v">${G.stats.helped} / ${G.stats.killed}</span></div>
  <div class="srow"><span class="k">盟友</span><span class="v">${G.allies.length}人</span></div>
  <div style="margin-top:10px;padding:10px;background:rgba(94,200,248,.06);border-radius:8px">
  <div style="font-size:10px;color:var(--faint);margin-bottom:6px">行为标签</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px">
  ${genTags().map(t=>`<span style="font-size:11px;padding:3px 10px;background:rgba(94,200,248,.15);border-radius:12px;color:var(--ice)">${t}</span>`).join('')}
  </div></div>
  </div>
  <button class="btn ember" onclick="newCycle()">固化存档，开启第${G.cycle+1}世</button>
  ${eid!=='death'&&G.endlessSaves.length<3?'<button class="btn" onclick="saveEndless()">存入无尽存档</button>':''}`;
}
function genTags(){
  const tags=[];
  if(G.apocDay>=100)tags.push('百日求生');
  else if(G.apocDay>=60)tags.push('老油条');
  else if(G.apocDay>=30)tags.push('勉强活过');
  else tags.push('短命鬼');
  if(G.stats.killed>=3)tags.push('掠夺者');
  else if(G.stats.helped>=5)tags.push('善人');
  else tags.push('独行者');
  if(G.baseLevel>=4)tags.push('基建狂魔');
  if(G.stats.exploredRate>=70)tags.push('地图全开');
  if(G.allies.length>=2)tags.push('社交牛X');
  if(G.attention>50)tags.push('招摇过市');
  else if(G.attention<10)tags.push('低调潜行');
  if(G.stats.raidDefeated>=3)tags.push('击退掠夺');
  if(G.score.world<=5)tags.push('世域崩坏');
  return tags;
}
function saveEndless(){
  G.endlessSaves.push({cycle:G.cycle,ending:ENDINGS.find(e=>e.id===G.currentEnding).name,apocDay:G.apocDay,baseLevel:G.baseLevel,score:totalScore(),time:new Date().toLocaleString('zh-CN')});
  save();toast('已存入无尽存档');resetStart();
}
function newCycle(){
  G.cycle++;
  const keep={cycle:G.cycle,originPoints:G.originPoints,talents:G.talents,unlockedEndings:G.unlockedEndings,endlessSaves:G.endlessSaves,achievements:G.achievements,settings:G.settings,mainSave:{cycle:G.cycle-1,ending:G.currentEnding}};
  G=Object.assign(JSON.parse(JSON.stringify(DEF)),keep);
  G.talentsUsed=[];G.starter=null;save();enterShop();
}
function resetStart(){
  const keep={cycle:G.cycle,originPoints:G.originPoints,talents:G.talents,unlockedEndings:G.unlockedEndings,endlessSaves:G.endlessSaves,achievements:G.achievements,settings:G.settings};
  G=Object.assign(JSON.parse(JSON.stringify(DEF)),keep);save();viewStart();
}

/* ===== 模态 ===== */
function showModal(h){
  const m=document.createElement('div');m.className='mmask';m.id='mmask';
  m.innerHTML=`<div class="modal">${h}</div>`;document.body.appendChild(m);
}
function closeModal(){const m=$('#mmask');if(m)m.remove()}

/* ===== 底栏导航 ===== */
$$('#bottombar .navb').forEach(b=>{
  b.addEventListener('click',()=>{
    $$('#bottombar .navb').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');sfx.click();
    const n=b.dataset.nav;
    if(G.phase==='shop'){toast('商店阶段');return}
    if(n==='inventory')viewInventory();
    else if(n==='base')viewBase();
    else if(n==='leaderboard'){if(G.phase==='apoc')viewBoard();else toast('末世解锁榜单')}
    else if(n==='shop'){
      if(G.phase==='shop'||G.phase==='start')enterShop();
      else if(G.phase==='prep')toast('本轮采购期已过');
      else toast('末世阶段商店关闭，每轮回仅开局一次');
    }
    else if(n==='status')viewStatus();
  });
});

viewStart();
