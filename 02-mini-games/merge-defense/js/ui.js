/*
 * ui.js — 渲染、输入与界面层。所有规则/数值来自 js/engine.js 的同一份 CFG，
 * 本文件不复制任何数值，只负责表现与操作。
 */
(function () {
  'use strict';

  var E = window.Engine, CFG = E.CFG;
  var W = 1000, H = 520;
  var STEP = 1 / 60;

  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');

  var $ = function (id) { return document.getElementById(id); };
  var hudRound = $('hudRound'), hudPhase = $('hudPhase'), hudTimer = $('hudTimer'),
    hudGold = $('hudGold'), hudBase = $('hudBase'), preview = $('preview'),
    shopEl = $('shop'), slotTip = $('slotTip'), overlay = $('overlay'),
    toastsEl = $('toasts'), dbgGrid = $('dbgGrid'), btnFight = $('btnFight'),
    btnPause = $('btnPause'), btnSpeed = $('btnSpeed'), btnRules = $('btnRules'),
    btnReroll = $('btnReroll'), chkMerge = $('chkMergeCombat'), btnSeed = $('btnResetSeed');

  var game = null;
  var ui = { modal: null, drag: null, hover: null, selected: null, moved: false, userPaused: false };
  var last = 0, acc = 0, dbgAt = 0;
  var cache = { shopKey: '', previewKey: '', baseSeg: -1, hearts: null };

  /* ---------------------------------------------------------------- 声音 */
  var actx = null;
  function sfx(kind) {
    try {
      if (!actx) return;
      var t = actx.currentTime;
      var o = actx.createOscillator(), g = actx.createGain();
      var map = { buy: [520, .06, .05], merge: [740, .12, .06], sell: [300, .08, .05], leak: [150, .18, .07], win: [880, .5, .08], lose: [110, .5, .08] };
      var cfg = map[kind] || map.buy;
      o.type = kind === 'leak' || kind === 'lose' ? 'sawtooth' : 'triangle';
      o.frequency.setValueAtTime(cfg[0], t);
      if (kind === 'merge') o.frequency.exponentialRampToValueAtTime(cfg[0] * 1.6, t + cfg[1]);
      g.gain.setValueAtTime(cfg[2], t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + cfg[1]);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + cfg[1] + .02);
    } catch (err) { /* 声音不是必需 */ }
  }
  function initAudio() {
    if (actx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    } catch (err) { actx = null; }
  }

  /* ------------------------------------------------------------ 工具函数 */
  function rgba(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* -------------------------------------------------------------- 新开一局 */
  function newRun(seed) {
    game = E.createGame({ seed: seed || CFG.seed });
    ui.drag = null; ui.hover = null; ui.selected = null; ui.modal = null; ui.userPaused = false;
    cache.shopKey = ''; cache.previewKey = ''; cache.baseSeg = -1;
    acc = 0; last = performance.now();
    chkMerge.checked = game.allowMergeInCombat;
    $('debug').open = false;
    return game;
  }

  /* ---------------------------------------------------------------- 弹层 */
  function openModal(kind, html) {
    ui.modal = kind;
    game.paused = true;
    overlay.innerHTML = html;
    overlay.classList.add('show');
    bindModal(kind);
  }
  function closeModal() {
    ui.modal = null;
    overlay.classList.remove('show');
    overlay.innerHTML = '';
    if (game) game.paused = ui.userPaused;
  }
  function bindModal(kind) {
    var b;
    if (kind === 'start' && (b = $('mStart'))) b.onclick = function () { initAudio(); closeModal(); };
    if (kind === 'start' && (b = $('mRules'))) b.onclick = function () { openModal('rules', rulesHTML(true)); };
    if (kind === 'rules') {
      if ((b = $('mClose'))) b.onclick = function () {
        if (game.over) { showOver(); return; }
        if (game.phase === 'settle') { showSettle(); return; }
        if (game.round === 1 && game.stats.buys === 0) { openModal('start', startHTML()); return; }
        closeModal();
      };
    }
    if (kind === 'settle' && (b = $('mNext'))) b.onclick = function () {
      var res = E.nextRound(game);
      if (!res.ok) { toast(res.reason, 'warn'); return; }
      closeModal();
    };
    if (kind === 'over') {
      if ((b = $('mRestart'))) b.onclick = function () { newRun(CFG.seed); closeModal(); };
      if ((b = $('mRules2'))) b.onclick = function () { openModal('rules', rulesHTML(false)); };
    }
  }

  function startHTML() {
    return '' +
      '<div class="sheet">' +
      '<h2>合成防线 · Merge Defense</h2>' +
      '<div class="sub">合成 + 防守 · 最小可玩版本（ruleset ' + CFG.ruleset_id + '）</div>' +
      '<div class="body">' +
      '<p>30 秒布防 → 60 秒自动交战 → 击杀回收金币 → 下一波更强。守住 10 波即通关。</p>' +
      '<h3>三步上手</h3>' +
      '<ul>' +
      '<li><b>买</b>：点下方商店卡片，单位自动落进空槽（金币有限，买完会补货）</li>' +
      '<li><b>合</b>：把一个单位拖到<b>同型同级</b>单位上 → 升 1 级，伤害/生命 ×2，只占 1 格</li>' +
      '<li><b>守</b>：敌人分两路从右侧推进，走到基地就扣血；单位只打自己那一路</li>' +
      '</ul>' +
      '<h3>核心取舍（本 Demo 要验证的东西）</h3>' +
      '<p>合成本身<b>不增加总火力</b>，它只是把同样的火力压进更少的槽位。槽位只有 10 个，所以真正的决策是：' +
      '继续攒同类、卖掉异类换位置、还是把火力堆在单路赌另一路只漏几只。</p>' +
      '<div class="actions"><button class="primary" id="mStart">开始试玩</button><button id="mRules">完整规则</button></div>' +
      '</div></div>';
  }

  function rulesHTML(fromStart) {
    var units = '', keys = Object.keys(CFG.units), i;
    for (i = 0; i < keys.length; i++) {
      var k = keys[i], d = CFG.units[k];
      units += '<tr><td>' + d.name + '</td><td class="num">' + d.cost + '</td><td class="num">' +
        (d.dmg ? (d.dmg / d.interval).toFixed(1) + ' DPS' : d.hp + ' HP') + '</td><td>' + d.desc + '</td></tr>';
    }
    var waves = '';
    for (i = 0; i < CFG.waves.length; i++) {
      var w = CFG.waves[i];
      var mix = w.mix.map(function (m) { return CFG.enemies[m[0]].name + '×' + m[1]; }).join(' / ');
      waves += '<tr><td class="num">第 ' + (i + 1) + ' 波</td><td class="num">' + w.count + (w.boss ? '+' + w.boss : '') +
        '</td><td class="num">' + w.hp + '</td><td>' + mix + '</td></tr>';
    }
    return '' +
      '<div class="sheet">' +
      '<h2>规则（当前版本）</h2>' +
      '<div class="sub">ruleset ' + CFG.ruleset_id + ' · 页面、调试面板与测试共用这份配置</div>' +
      '<div class="body">' +
      '<h3>阶段</h3>' +
      '<ul>' +
      '<li>准备 <b>30 秒</b>：可以购买、刷新商店、移动、合成、卖出。倒计时归零自动开战，也可按 F 立即开战。</li>' +
      '<li>战斗 <b>最多 60 秒</b>：全自动。敌人全部清空则提前结束，剩余时间每 10 秒折 1 金币（最多 3）。' +
      '若 60 秒仍有敌人存活，存活的敌人各对基地结算一次伤害。最终波（第 10 波）必须在 60 秒内清空，否则判负。</li>' +
      '<li>结算：显示击杀、漏怪、承伤、本波收入与下一波预告，点继续进入下一轮。</li>' +
      '</ul>' +
      '<h3>合成</h3>' +
      '<ul>' +
      '<li>两个<b>同类型、同等级</b>单位拖到一起 → 目标升 1 级，来源消失。等级上限 L' + CFG.maxLevel + '。</li>' +
      '<li>每升 1 级：伤害 ×' + CFG.levelMul + '、生命 ×' + CFG.levelMul + '，攻速/射程不变，合成后满血重建。</li>' +
      '<li>合成不额外增伤，价值来自<b>槽位压缩</b>：2 格火力 → 1 格。</li>' +
      '<li>卖出回收累计投入的 ' + (CFG.econ.sellRate * 100) + '%（L1 弓手 2 金币 → 回 1）。</li>' +
      '</ul>' +
      '<h3>单位（L1 数值）</h3>' +
      '<table><tr><th>单位</th><th>价格</th><th>L1 战力</th><th>特性</th></tr>' + units + '</table>' +
      '<h3>敌人</h3>' +
      '<table><tr><th>类型</th><th>血量</th><th>速度</th><th>扣基地</th><th>掉金币</th></tr>' +
      '<tr><td>步兵</td><td>1.0×</td><td>55</td><td>1</td><td>1</td></tr>' +
      '<tr><td>疾行</td><td>0.6×</td><td>88</td><td>1</td><td>1</td></tr>' +
      '<tr><td>重甲</td><td>2.4×</td><td>38</td><td>2</td><td>2</td></tr>' +
      '<tr><td>首领</td><td>4.0×</td><td>32</td><td>3</td><td>5</td></tr>' +
      '</table>' +
      '<p class="sub">血量按波次基准 ×倍率；两路交替出怪，单位只作用于本路。</p>' +
      '<h3>波次</h3>' +
      '<table><tr><th>波次</th><th>数量</th><th>基准血</th><th>构成权重</th></tr>' + waves + '</table>' +
      '<h3>经济</h3>' +
      '<ul>' +
      '<li>初始 ' + CFG.econ.startGold + ' 金币；击杀金币如表中；清波奖励 ' + CFG.econ.clearBonusBase + ' + 波次号。</li>' +
      '<li>刷新商店 ' + CFG.econ.rerollCost + ' 金币；基地 ' + CFG.base.hp + ' 点生命，扣光即失败。</li>' +
      '</ul>' +
      '<div class="actions"><button class="primary" id="mClose">' + (fromStart ? '返回' : '关闭') + '</button></div>' +
      '</div></div>';
  }

  function showSettle() {
    var s = game.waveResult || {};
    var pv = E.wavePreview({ cfg: CFG, wave: game.waveNext || game.wave, round: game.round + 1 });
    var clear = s.reason === 'clear';
    openModal('settle', '' +
      '<div class="sheet">' +
      '<h2>第 ' + game.round + ' 波 · ' + (clear ? '清空' : '超时') + '</h2>' +
      '<div class="sub">' + (clear ? '用时 ' + s.duration + 's，提前结束奖励 +' + (s.early || 0) + ' 金币' : '60 秒内没有清空，剩余敌人已结算伤害') + '</div>' +
      '<div class="result-grid">' +
      '<div><div class="k">击杀</div><div class="v good">' + s.kills + '</div></div>' +
      '<div><div class="k">漏怪</div><div class="v ' + (s.leaks ? 'bad' : '') + '">' + s.leaks + '</div></div>' +
      '<div><div class="k">基地损失</div><div class="v ' + (s.damage ? 'bad' : '') + '">' + s.damage + '</div></div>' +
      '<div><div class="k">本波收入</div><div class="v">+' + s.bonus + '</div></div>' +
      '<div><div class="k">基地剩余</div><div class="v">' + game.baseHp + ' / ' + game.baseHpMax + '</div></div>' +
      '<div><div class="k">出战 DPS</div><div class="v">' + (s.dpsStart || 0) + '</div></div>' +
      '</div>' +
      '<div class="body">' +
      '<h3>下一波预告 · 第 ' + (game.round + 1) + ' 波</h3>' +
      '<p>' + pv.list.map(function (e) { return e.name + ' ×' + e.count + '（单体 ' + e.hp + ' 血）'; }).join('，') +
      '<br/>总血量 <b>' + pv.totalHp + '</b> · 左路 ' + pv.laneCount[0] + ' / 右路 ' + pv.laneCount[1] +
      (pv.boss ? ' · <b>含首领 ×' + pv.boss + '</b>' : '') + '</p>' +
      '<p class="hint">' + waveHint(pv) + '</p>' +
      '</div>' +
      '<div class="actions"><button class="primary" id="mNext">继续 · 进入布防</button></div>' +
      '</div></div>');
  }

  function showOver() {
    var g = game, st = g.stats;
    var title = g.win ? '通关' : '失守';
    var sub = g.win ? '10 波全部清空，基地还剩 ' + g.baseHp + ' 点' : '基地被打穿，止步第 ' + g.round + ' 波';
    openModal('over', '' +
      '<div class="sheet">' +
      '<h2>' + title + ' · ' + sub + '</h2>' +
      '<div class="sub">ruleset ' + CFG.ruleset_id + ' · 种子 ' + g.seed + '</div>' +
      '<div class="result-grid">' +
      '<div><div class="k">到达波次</div><div class="v">' + g.round + ' / ' + CFG.waves.length + '</div></div>' +
      '<div><div class="k">总击杀</div><div class="v">' + st.kills + '</div></div>' +
      '<div><div class="k">总漏怪</div><div class="v ' + (st.leaks ? 'bad' : '') + '">' + st.leaks + '</div></div>' +
      '<div><div class="k">合成次数</div><div class="v">' + st.merges + '</div></div>' +
      '<div><div class="k">最高等级</div><div class="v">L' + st.maxLevel + '</div></div>' +
      '<div><div class="k">卖出</div><div class="v">' + st.sells + '</div></div>' +
      '<div><div class="k">满槽无效购买</div><div class="v">' + st.fullSlotMisses + '</div></div>' +
      '<div><div class="k">累计收入 / 支出</div><div class="v">' + Math.round(st.goldEarned) + ' / ' + Math.round(st.goldSpent) + '</div></div>' +
      '</div>' +
      '<div class="body"><p class="sub">这些计数就是本次试玩要观察的信号：合成次数高、满槽无效购买低，说明合成规则读得懂；' +
      '若满槽无效购买次数高，说明槽位/合成提示还不够清楚。</p></div>' +
      '<div class="actions"><button class="primary" id="mRestart">再来一局</button><button id="mRules2">看规则</button></div>' +
      '</div></div>');
    sfx(g.win ? 'win' : 'lose');
  }

  function toast(text, kind) {
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = text;
    toastsEl.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .25s';
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }, 1500);
  }

  /* -------------------------------------------------------------- 预告条 */
  function waveHint(pv) {
    var tanks = 0, runners = 0, i;
    for (i = 0; i < pv.list.length; i++) {
      if (pv.list[i].type === 'tank') tanks += pv.list[i].count;
      if (pv.list[i].type === 'runner') runners += pv.list[i].count;
    }
    if (pv.boss) return '首领波：至少留一路壁垒顶住，别让首领走完全程。';
    if (tanks >= 4) return '重甲偏多：火炮溅射一次打 3 个，比弓手划算。';
    if (runners >= 5) return '疾行偏多：冰霜减速能把它们压回射程里。';
    return '常规波：弓手铺两路最稳，省下的金币去攒同类合成。';
  }

  function renderPreview() {
    var g = game, pv = E.wavePreview(g);
    var key = g.round + '|' + pv.totalHp + '|' + pv.list.map(function (e) { return e.type + e.count; }).join(',');
    if (key === cache.previewKey) return;
    cache.previewKey = key;
    var parts = ['<b>第 ' + g.round + ' 波</b>'];
    pv.list.forEach(function (e) {
      var color = CFG.enemies[e.type].color;
      parts.push('<span class="pip"><span class="dot" style="background:' + color + '"></span>' + e.name + ' ×' + e.count + '</span>');
    });
    parts.push('<span>总血量 <b>' + pv.totalHp + '</b></span>');
    parts.push('<span>左路 ' + pv.laneCount[0] + ' / 右路 ' + pv.laneCount[1] + '</span>');
    parts.push('<span class="hint">' + waveHint(pv) + '</span>');
    preview.innerHTML = parts.join('');
  }

  /* -------------------------------------------------------------- 商店 UI */
  function statText(type) {
    var d = CFG.units[type];
    if (d.dmg) return (d.dmg / d.interval).toFixed(1) + ' DPS · 射程 ' + d.range;
    return d.hp + ' HP · 阻挡';
  }
  function renderShop() {
    if (game.phase !== 'prep') {
      if (cache.shopKey !== 'locked') {
        cache.shopKey = 'locked';
        var n = CFG.shopSize, html = '';
        for (var i = 0; i < n; i++) html += '<button class="card" disabled><span class="glyph">—</span><span class="name">战斗中</span><span class="meta">不可购买</span></button>';
        shopEl.innerHTML = html;
      }
      return;
    }
    var key = game.offers.map(function (o) { return o.id + ':' + o.type; }).join(',') + '|' + game.gold;
    if (key === cache.shopKey) return;
    cache.shopKey = key;
    var html = '';
    game.offers.forEach(function (o, idx) {
      var d = CFG.units[o.type];
      html += '<button class="card' + (game.gold < o.price ? ' poor' : '') + '" data-idx="' + idx + '">' +
        '<span class="glyph" style="color:' + d.color + ';border-color:' + rgba(d.color, .5) + '">' + d.short + '</span>' +
        '<span class="name">' + d.name + '</span>' +
        '<span class="meta">' + statText(o.type) + '</span>' +
        '<span class="cost">' + o.price + ' 金</span>' +
        '</button>';
    });
    shopEl.innerHTML = html;
    Array.prototype.forEach.call(shopEl.querySelectorAll('.card'), function (btn) {
      btn.onclick = function () { doBuy(parseInt(btn.getAttribute('data-idx'), 10)); };
    });
  }
  function doBuy(idx) {
    var res = E.buy(game, idx);
    if (!res.ok) { if (res.reason !== '槽位已满') toast(res.reason, 'warn'); return; }
    sfx('buy');
    cache.shopKey = '';
  }

  /* ------------------------------------------------------------- HUD 同步 */
  function syncHud() {
    var g = game;
    hudRound.textContent = g.round + ' / ' + CFG.waves.length;
    var preparing = g.phase === 'prep';
    hudPhase.textContent = preparing ? '准备' : (g.phase === 'combat' ? '交战' : '结算');
    hudPhase.className = 'phase-badge ' + (preparing ? 'prep' : (g.phase === 'combat' ? 'combat' : ''));
    hudTimer.textContent = g.timer.toFixed(1) + 's';
    hudTimer.className = 'v timer' + (g.timer <= 10 && g.phase !== 'settle' ? ' warn' : '');
    hudGold.textContent = Math.round(g.gold);
    btnFight.disabled = !preparing;
    btnPause.textContent = g.paused && !ui.modal ? '继续' : '暂停';
    btnSpeed.textContent = '×' + g.speed;

    if (cache.baseSeg !== g.baseHpMax) {
      cache.baseSeg = g.baseHpMax;
      var segs = '';
      for (var i = 0; i < g.baseHpMax; i++) segs += '<span class="seg"></span>';
      hudBase.innerHTML = segs;
      cache.hearts = Array.prototype.slice.call(hudBase.querySelectorAll('.seg'));
    }
    if (cache.hearts) {
      for (var j = 0; j < cache.hearts.length; j++) {
        cache.hearts[j].className = 'seg' + (j < g.baseHp ? '' : ' off');
      }
    }
    slotTip.textContent = '槽位 ' + g.units.length + ' / ' + (CFG.board.lanes * CFG.board.slots);
  }

  function renderDebug() {
    var g = game, d = E.boardDps(g);
    var left = Math.round(d.lanes[0] || 0), right = Math.round(d.lanes[1] || 0);
    var remainHp = 0, i;
    for (i = 0; i < g.enemies.length; i++) remainHp += Math.max(0, g.enemies[i].hp);
    for (i = 0; i < g.spawnQueue.length; i++) remainHp += g.spawnQueue[i].hp;
    var cells = [
      ['左路 DPS', left], ['右路 DPS', right], ['合计 DPS', Math.round(d.total)],
      ['剩余敌方血量', Math.round(remainHp)], ['场上敌人', g.enemies.length], ['待生成', g.spawnQueue.length],
      ['合成次数', g.stats.merges], ['最高等级', 'L' + g.stats.maxLevel],
      ['卖出', g.stats.sells], ['满槽无效购买', g.stats.fullSlotMisses],
      ['累计收入', Math.round(g.stats.goldEarned)], ['累计支出', Math.round(g.stats.goldSpent)],
      ['种子', g.seed], ['规则集', CFG.ruleset_id]
    ];
    dbgGrid.innerHTML = cells.map(function (c) {
      return '<div class="dbg-cell"><div class="k">' + c[0] + '</div><div class="v">' + c[1] + '</div></div>';
    }).join('');
  }

  /* ---------------------------------------------------------------- 绘制 */
  function draw() {
    var g = game;
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d151d');
    bg.addColorStop(0.5, '#0a1118');
    bg.addColorStop(1, '#0c141b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawFloor();
    drawBase();
    drawGate();
    drawSlots();
    drawSellZone();
    drawUnits();
    drawEnemies();
    drawFx();
    drawDragGhost();
    drawLegend();
  }

  function laneBand(l) {
    var cfg = CFG.board;
    var top = cfg.laneTop + l * (cfg.laneH + cfg.laneGap);
    return { top: top, h: cfg.laneH, cy: top + cfg.laneH / 2 };
  }

  function drawFloor() {
    var cfg = CFG.board, l;
    for (l = 0; l < cfg.lanes; l++) {
      var b = laneBand(l);
      ctx.fillStyle = l === 0 ? 'rgba(255,255,255,.022)' : 'rgba(255,255,255,.012)';
      ctx.fillRect(cfg.baseX, b.top, cfg.spawnX - cfg.baseX, b.h);
      ctx.strokeStyle = 'rgba(255,255,255,.055)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cfg.baseX, b.top); ctx.lineTo(cfg.spawnX, b.top);
      ctx.moveTo(cfg.baseX, b.top + b.h); ctx.lineTo(cfg.spawnX, b.top + b.h);
      ctx.stroke();
      /* 行进方向虚线 */
      ctx.strokeStyle = 'rgba(255,255,255,.045)';
      ctx.setLineDash([10, 16]);
      ctx.beginPath();
      ctx.moveTo(cfg.baseX, b.cy); ctx.lineTo(cfg.spawnX, b.cy);
      ctx.stroke();
      ctx.setLineDash([]);
      /* 路标 */
      ctx.fillStyle = 'rgba(255,255,255,.20)';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(l === 0 ? '上路' : '下路', cfg.baseX + 8, b.top + 16);
    }
  }

  function drawBase() {
    var cfg = CFG.board, g = game;
    var top = cfg.laneTop, bottom = cfg.laneTop + cfg.lanes * cfg.laneH + (cfg.lanes - 1) * cfg.laneGap;
    var grad = ctx.createLinearGradient(0, 0, cfg.baseX - 24, 0);
    grad.addColorStop(0, 'rgba(226,167,69,.02)');
    grad.addColorStop(1, 'rgba(226,167,69,.14)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, top, cfg.baseX - 24, bottom - top);
    ctx.fillStyle = 'rgba(226,167,69,.4)';
    ctx.fillRect(cfg.baseX - 24, top, 3, bottom - top);
    ctx.save();
    ctx.translate(28, (top + bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(226,167,69,.55)';
    ctx.font = '600 13px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('基 地 ' + game.baseHp + ' / ' + game.baseHpMax, 0, 0);
    ctx.restore();
  }

  function drawGate() {
    var cfg = CFG.board, g = game, l;
    for (l = 0; l < cfg.lanes; l++) {
      var b = laneBand(l);
      ctx.strokeStyle = 'rgba(224,112,63,.35)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cfg.spawnX, b.top + 18);
      ctx.lineTo(cfg.spawnX, b.top + b.h - 18);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    /* 待生成计数 */
    var left = game.spawnQueue.length;
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('未出场 ' + left, cfg.spawnX, 16);
  }

  function drawSlots() {
    var cfg = CFG.board, l, s;
    for (l = 0; l < cfg.lanes; l++) {
      for (s = 0; s < cfg.slots; s++) {
        var cx = E.slotX(CFG, s), cy = E.laneY(CFG, l);
        var occupied = E.unitAt(game, l, s);
        var isHover = ui.hover && ui.hover.lane === l && ui.hover.slot === s;
        var dragTarget = ui.drag && isHover;
        var w = 70, h = 56;
        ctx.save();
        if (dragTarget) {
          var merge = occupied && ui.drag.unit && occupied.type === ui.drag.unit.type && occupied.level === ui.drag.unit.level && occupied.level < CFG.maxLevel;
          ctx.fillStyle = merge ? 'rgba(126,192,138,.20)' : (occupied ? 'rgba(224,75,47,.14)' : 'rgba(255,255,255,.07)');
          roundRect(cx - w / 2, cy - h / 2, w, h, 10);
          ctx.fill();
          ctx.strokeStyle = merge ? 'rgba(126,192,138,.75)' : (occupied ? 'rgba(224,75,47,.6)' : 'rgba(255,255,255,.5)');
          ctx.lineWidth = 1.5;
          ctx.stroke();
          if (merge) {
            ctx.fillStyle = 'rgba(126,192,138,.9)';
            ctx.font = '11px -apple-system, "PingFang SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('合成 → L' + (occupied.level + 1), cx, cy + h / 2 - 6);
          }
        } else if (!occupied) {
          ctx.strokeStyle = isHover ? 'rgba(255,255,255,.32)' : 'rgba(255,255,255,.10)';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1;
          roundRect(cx - w / 2, cy - h / 2, w, h, 10);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }
    }
  }

  function drawSellZone() {
    var z = CFG.board.sellZone, active = ui.drag;
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = active ? 'rgba(224,75,47,.8)' : 'rgba(224,75,47,.28)';
    ctx.fillStyle = active ? 'rgba(224,75,47,.14)' : 'rgba(224,75,47,.05)';
    ctx.lineWidth = 1.2;
    roundRect(z.x, z.y, z.w, z.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = active ? 'rgba(255,190,175,.95)' : 'rgba(255,255,255,.35)';
    ctx.font = '12px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('拖到这里卖出 · 回收 50%', z.x + z.w / 2, z.y + z.h / 2 + 4);
    ctx.restore();
  }

  function drawUnits() {
    var g = game, i, u;
    for (i = 0; i < g.units.length; i++) {
      u = g.units[i];
      var cx = E.slotX(CFG, u.slot), cy = E.laneY(CFG, u.lane);
      var st = E.unitStats(CFG, u.type, u.level);
      var d = st.def;
      var w = 64, h = 52;

      ctx.save();
      /* 地面投影 */
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      roundRect(cx - w / 2 + 2, cy - h / 2 + 4, w, h, 10);
      ctx.fill();

      /* 主体 */
      var grad = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
      grad.addColorStop(0, rgba(d.color, .34));
      grad.addColorStop(1, rgba(d.color, .12));
      ctx.fillStyle = grad;
      roundRect(cx - w / 2, cy - h / 2, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = rgba(d.color, ui.selected === u.id ? .95 : .55);
      ctx.lineWidth = ui.selected === u.id ? 2 : 1;
      ctx.stroke();

      /* 命中闪白 */
      if (u.hitT > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (u.hitT / 0.18 * 0.18) + ')';
        roundRect(cx - w / 2, cy - h / 2, w, h, 10);
        ctx.fill();
      }

      /* 图标 */
      ctx.fillStyle = d.color;
      ctx.font = '700 19px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.short, cx, cy + 1);

      /* 等级点 */
      var pips = u.level, pw = 5, gap = 3;
      var totalW = pips * pw + (pips - 1) * gap;
      for (var p = 0; p < pips; p++) {
        ctx.fillStyle = rgba(d.color, .85);
        ctx.fillRect(cx - totalW / 2 + p * (pw + gap), cy + h / 2 - 9, pw, 4);
      }

      /* 壁垒血条 */
      if (st.hp > 0 && u.hpCur > 0) {
        var ratio = clamp(u.hpCur / st.hp, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fillRect(cx - 22, cy - h / 2 - 8, 44, 4);
        ctx.fillStyle = ratio > .5 ? '#7ec08a' : (ratio > .25 ? '#e2a745' : '#e04b2f');
        ctx.fillRect(cx - 22, cy - h / 2 - 8, 44 * ratio, 4);
      }
      ctx.restore();
    }
  }

  function drawEnemies() {
    var g = game, i, e, cfg = CFG;
    for (i = 0; i < g.enemies.length; i++) {
      e = g.enemies[i];
      if (e.hp <= 0 || e.escaped) continue;
      var d = cfg.enemies[e.type];
      var y = E.laneY(CFG, e.lane);
      var s = d.size;
      ctx.save();
      ctx.translate(e.x, y);
      var tint = e.slowT > 0 ? 'rgba(76,182,196,' : null;
      var fill = e.slowT > 0 ? '#5ec9d8' : d.color;

      if (e.type === 'grunt') {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0);
        ctx.closePath(); ctx.fill();
      } else if (e.type === 'runner') {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(-s, 0); ctx.lineTo(s * .7, -s * .9); ctx.lineTo(s * .7, s * .9);
        ctx.closePath(); ctx.fill();
      } else if (e.type === 'tank') {
        ctx.fillStyle = fill;
        roundRect(-s, -s, s * 2, s * 2, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.22)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-s + 3, -s + 3, s * 2 - 6, s * 2 - 6);
      } else {
        ctx.fillStyle = fill;
        ctx.beginPath();
        for (var k = 0; k < 6; k++) {
          var ang = Math.PI / 6 + k * Math.PI / 3;
          var px = Math.cos(ang) * s, py = Math.sin(ang) * s;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (e.hitT > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (e.hitT / 0.16 * 0.5) + ')';
        ctx.beginPath(); ctx.arc(0, 0, s + 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      /* 血条 */
      var bw = Math.max(26, s * 2.6);
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(e.x - bw / 2, y - s - 12, bw, 4);
      var ratio = clamp(e.hp / e.hpMax, 0, 1);
      ctx.fillStyle = e.type === 'boss' ? '#e04b2f' : (ratio > .5 ? '#d8b56b' : (ratio > .2 ? '#e0703f' : '#a83b28'));
      ctx.fillRect(e.x - bw / 2, y - s - 12, bw * ratio, 4);
      if (e.slowT > 0) {
        ctx.fillStyle = 'rgba(76,182,196,.75)';
        ctx.fillRect(e.x - bw / 2, y + s + 6, bw * Math.min(1, e.slowT / 1.2), 2);
      }
    }
  }

  function drawFx() {
    var g = game, i, f;
    for (i = 0; i < g.fx.length; i++) {
      f = g.fx[i];
      var p = 1 - f.t / f.max;
      if (f.kind === 'shot') {
        ctx.strokeStyle = rgba(f.color, (1 - p) * .85);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(f.x1, f.y1);
        ctx.lineTo(f.x2, f.y2);
        ctx.stroke();
        ctx.fillStyle = rgba(f.color, (1 - p) * .6);
        ctx.beginPath(); ctx.arc(f.x2, f.y2, 3, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'dmg') {
        ctx.fillStyle = 'rgba(255,235,205,' + (1 - p) * .95 + ')';
        ctx.font = '600 12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('-' + f.text, f.x, f.y - p * 20);
      } else if (f.kind === 'merge') {
        ctx.strokeStyle = rgba(f.color, (1 - p) * .9);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 18 + p * 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = rgba(f.color, (1 - p) * .95);
        ctx.font = '700 15px -apple-system, "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('L' + f.level, f.x, f.y - 30 - p * 16);
      } else if (f.kind === 'die') {
        ctx.fillStyle = rgba(f.color, (1 - p) * .5);
        ctx.beginPath(); ctx.arc(f.x, f.y, 4 + p * 16, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'breach') {
        ctx.fillStyle = 'rgba(224,75,47,' + (1 - p) * .5 + ')';
        ctx.fillRect(0, f.y - 60, CFG.board.baseX, 120);
        ctx.fillStyle = 'rgba(255,190,175,' + (1 - p) * .9 + ')';
        ctx.font = '700 13px -apple-system, "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('基 地 -1', 16, f.y - 40 - p * 20);
      } else if (f.kind === 'block') {
        ctx.fillStyle = 'rgba(200,208,220,' + (1 - p) * .7 + ')';
        ctx.beginPath(); ctx.arc(f.x, f.y, 5 + p * 8, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'break') {
        ctx.strokeStyle = 'rgba(139,147,167,' + (1 - p) * .8 + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, 10 + p * 26, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  function drawDragGhost() {
    if (!ui.drag || !ui.drag.pos) return;
    var u = ui.drag.unit;
    if (!u) return;
    var d = CFG.units[u.type];
    var p = ui.drag.pos;
    ctx.save();
    ctx.globalAlpha = .85;
    ctx.fillStyle = rgba(d.color, .3);
    roundRect(p.x - 30, p.y - 26, 60, 52, 10);
    ctx.fill();
    ctx.strokeStyle = rgba(d.color, .8);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = d.color;
    ctx.font = '700 18px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.short, p.x, p.y + 1);
    ctx.restore();

    /* 射程提示 */
    if (E.unitStats(CFG, u.type, u.level).range) {
      var range = E.unitStats(CFG, u.type, u.level).range;
      var y = E.laneY(CFG, u.lane);
      ctx.fillStyle = rgba(d.color, .07);
      ctx.fillRect(E.slotX(CFG, u.slot) - 20, y - 46, range + 20, 92);
      ctx.strokeStyle = rgba(d.color, .25);
      ctx.strokeRect(E.slotX(CFG, u.slot) - 20, y - 46, range + 20, 92);
    }
  }

  function drawLegend() {
    if (game.phase === 'settle') return;
    var txt = game.phase === 'prep' ? '布防中 · 拖拽合成 · F 立即开战' : '交战中 · 自动结算';
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.font = '11px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(txt, 16, H - 14);
  }

  /* ---------------------------------------------------------------- 输入 */
  function point(ev) {
    var r = cv.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) / r.width * W,
      y: (ev.clientY - r.top) / r.height * H
    };
  }
  function cellFromPoint(p) {
    var cfg = CFG.board, best = null, bestD = 1e9, l, s;
    for (l = 0; l < cfg.lanes; l++) {
      for (s = 0; s < cfg.slots; s++) {
        var cx = E.slotX(CFG, s), cy = E.laneY(CFG, l);
        var d = Math.sqrt((p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy));
        if (d < bestD) { bestD = d; best = { lane: l, slot: s }; }
      }
    }
    return bestD <= 62 ? best : null;
  }
  function inSellZone(p) {
    var z = CFG.board.sellZone;
    return p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
  }

  function onDown(ev) {
    if (!game || ui.modal) return;
    initAudio();
    var p = point(ev);
    var cell = cellFromPoint(p);
    ui.moved = false;

    if (cell) {
      var u = E.unitAt(game, cell.lane, cell.slot);
      if (u) {
        ui.drag = { unit: u, id: u.id, pos: p, origin: { lane: cell.lane, slot: cell.slot }, offset: null };
        ui.selected = u.id;
        cv.classList.add('dragging');
        try { cv.setPointerCapture(ev.pointerId); } catch (err) {}
        return;
      }
      /* 点空格：若有选中单位，尝试移动/合成 */
      if (ui.selected) {
        var sel = E.findUnit(game, ui.selected);
        if (sel) {
          var res = E.drop(game, sel.id, cell.lane, cell.slot);
          if (res.ok) sfx('merge');
          ui.selected = null;
          cache.shopKey = '';
        }
      }
    }
    ui.selected = null;
  }

  function onMove(ev) {
    if (!game) return;
    var p = point(ev);
    ui.hover = cellFromPoint(p);
    if (ui.drag) {
      if (Math.abs(p.x - ui.drag.pos.x) + Math.abs(p.y - ui.drag.pos.y) > 4) ui.moved = true;
      ui.drag.pos = p;
    }
  }

  function onUp(ev) {
    if (!game || !ui.drag) return;
    var p = point(ev);
    cv.classList.remove('dragging');
    var drag = ui.drag;
    ui.drag = null;

    if (inSellZone(p)) {
      var s = E.sell(game, drag.id);
      if (s.ok) sfx('sell');
      ui.selected = null;
      cache.shopKey = '';
      return;
    }
    if (!ui.moved) return;   /* 原地点击 = 选中，等第二次点目标格 */
    ui.selected = drag.id;
    var cell = cellFromPoint(p);
    if (!cell) { toast('拖到格子或卖出区', 'warn'); ui.selected = null; return; }
    var res = E.drop(game, drag.id, cell.lane, cell.slot);
    if (res.ok) { sfx('merge'); ui.selected = null; }
    cache.shopKey = '';
  }

  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);
  cv.addEventListener('pointerleave', function () { if (!ui.drag) ui.hover = null; });

  /* ---------------------------------------------------------------- 循环 */
  function checkPhase() {
    if (!game || ui.modal) return;
    if (game.over) { showOver(); return; }
    if (game.phase === 'settle') { showSettle(); return; }
  }

  function frame(now) {
    var raw = (now - last) / 1000;
    last = now;
    if (!(raw > 0)) raw = 0;
    raw = Math.min(raw, 0.1);

    if (game && !ui.modal && !game.paused && !game.over) {
      acc += raw * game.speed;
      var n = 0;
      while (acc >= STEP && n < 8) {
        E.step(game, STEP);
        acc -= STEP;
        n++;
        if (game.phase === 'settle' || game.over) { acc = 0; break; }
      }
      if (n >= 8) acc = 0;
    }

    var toastCount = game ? game.toasts.length : 0;
    if (game && toastCount) {
      while (game.toasts.length) { var tt = game.toasts.shift(); toast(tt.text, tt.kind); }
    }

    if (game) {
      syncHud();
      renderPreview();
      renderShop();
      draw();
      if (now - dbgAt > 260) { dbgAt = now; renderDebug(); }
      checkPhase();
    }
    requestAnimationFrame(frame);
  }

  /* -------------------------------------------------------------- 快捷键 */
  window.addEventListener('keydown', function (ev) {
    if (!game) return;
    var k = ev.key.toLowerCase();
    if (k === 'escape') {
      if (ui.modal === 'rules') { closeModal(); return; }
      ui.selected = null;
      return;
    }
    if (ui.modal) {
      if (k === ' ' && ui.modal === 'settle') { ev.preventDefault(); E.nextRound(game); closeModal(); }
      return;
    }
    if (k >= '1' && k <= '4') { doBuy(parseInt(k, 10) - 1); return; }
    if (k === 'f') { if (E.startCombat(game).ok) toast('开战', 'gold'); return; }
    if (k === 'r') { if (E.reroll(game).ok) cache.shopKey = ''; return; }
    if (k === 'p') { ui.userPaused = !ui.userPaused; game.paused = ui.userPaused; return; }
    if (k === 's') { game.speed = game.speed === 1 ? 2 : 1; return; }
    if (k === '?') { openModal('rules', rulesHTML(false)); return; }
  });

  btnFight.onclick = function () { if (E.startCombat(game).ok) { toast('开战', 'gold'); cache.shopKey = ''; } };
  btnPause.onclick = function () { ui.userPaused = !ui.userPaused; game.paused = ui.userPaused; };
  btnSpeed.onclick = function () { game.speed = game.speed === 1 ? 2 : 1; };
  btnRules.onclick = function () { openModal('rules', rulesHTML(false)); };
  btnReroll.onclick = function () { if (E.reroll(game).ok) { cache.shopKey = ''; sfx('buy'); } };
  chkMerge.onchange = function () { game.allowMergeInCombat = chkMerge.checked; };
  btnSeed.onclick = function () {
    var seed = Math.floor(Math.random() * 1e9);
    newRun(seed);
    toast('新种子 ' + seed, 'gold');
    closeModal();
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && game) { game.paused = true; }
    else if (game) { game.paused = ui.userPaused; }
  });
  window.addEventListener('blur', function () { if (game) game.paused = true; });
  window.addEventListener('focus', function () { if (game && !ui.modal) game.paused = ui.userPaused; });

  /* ------------------------------------------------------------- 自检页面 */
  function runSelftestPage() {
    var res = E.selftest();
    var lines = res.results.map(function (r) {
      return (r.pass ? 'ok   ' : 'FAIL ') + r.name + (r.note ? '  [' + r.note + ']' : '');
    });
    var body = document.body;
    body.innerHTML = '<pre id="testout" style="padding:20px;font:13px ui-monospace,monospace;color:#ddd;white-space:pre-wrap">' +
      lines.join('\n') + '\n\n' + (res.pass ? 'TEST PASS' : 'TEST ERROR (' + res.fails + ')') + '</pre>';
    window.__TEST = res;
  }

  /* ---------------------------------------------------------------- 启动 */
  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth || W;
    var h = w * H / W;
    cv.width = Math.max(1, Math.round(w * dpr));
    cv.height = Math.max(1, Math.round(h * dpr));
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  newRun();
  renderPreview();
  renderShop();

  window.__GAME = {
    get state() { return game; },
    api: E,
    ui: ui,
    newRun: newRun,
    toast: toast,
    fitCanvas: fitCanvas
  };

  if (/(\?|&)selftest/.test(location.search)) {
    runSelftestPage();
    return;
  }

  openModal('start', startHTML());
  requestAnimationFrame(function (t) { last = t; requestAnimationFrame(frame); });
})();
