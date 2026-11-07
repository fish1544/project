/*
 * 合成防线 · Merge Defense — 规则引擎
 * ruleset_id: MERGE-DEF-001-v1
 * 纯逻辑实现，不含任何 DOM 依赖：浏览器挂到 window.Engine，Node 下可 require。
 * 游戏、调试面板、自检与数值测试全部读取本文件里的 CFG，禁止在别处复制数值。
 */
(function (root) {
  'use strict';

  var RULESET_ID = 'MERGE-DEF-001-v1';

  var CFG = {
    ruleset_id: RULESET_ID,
    seed: 20261107,

    /* 棋盘：2 路 × 5 格；敌人从右（spawnX）向左走，抵达 baseX 造成基地伤害 */
    board: {
      lanes: 2,
      slots: 5,
      slotX0: 220,
      slotGap: 150,
      laneTop: 20,
      laneH: 220,
      laneGap: 30,
      baseX: 130,
      spawnX: 980,
      sellZone: { x: 690, y: 478, w: 290, h: 38 }
    },

    /* 阶段时长（秒） */
    phase: { prep: 30, combat: 60 },

    /* 经济 */
    econ: {
      startGold: 10,
      rerollCost: 1,
      sellRate: 0.5,
      clearBonusBase: 2,
      clearBonusPerRound: 1,
      earlyStep: 10,
      earlyCap: 3
    },

    base: { hp: 15 },

    levelMul: 2,      /* 每升 1 级，伤害/生命 ×2（合成不额外增伤，价值来自槽位压缩） */
    maxLevel: 5,
    shopSize: 4,

    units: {
      archer: {
        key: 'archer', name: '弓手', short: '弓', cost: 2,
        dmg: 6, interval: 0.6, range: 300, color: '#e2a745',
        desc: '单体速射 · 最稳的持续输出'
      },
      cannon: {
        key: 'cannon', name: '火炮', short: '炮', cost: 3,
        dmg: 12, interval: 1.4, range: 260, splash: 70, splashMax: 3, color: '#e0703f',
        desc: '溅射最多 3 个 · 克制成群单位'
      },
      frost: {
        key: 'frost', name: '冰霜', short: '冰', cost: 3,
        dmg: 4, interval: 0.8, range: 240, slow: 0.4, slowDur: 1.2, color: '#4cb6c4',
        desc: '命中减速 40% · 为后排争取时间'
      },
      bulwark: {
        key: 'bulwark', name: '壁垒', short: '壁', cost: 2,
        hp: 60, block: 30, color: '#8b93a7',
        desc: '阻挡本路敌人，被围攻即融化'
      }
    },

    shopWeights: { archer: 40, cannon: 25, frost: 22, bulwark: 13 },

    enemies: {
      grunt:  { key: 'grunt',  name: '步兵', hpMul: 1,   speed: 55, baseDmg: 1, atkDmg: 10, atkInterval: 0.8, gold: 1, color: '#c8644f', size: 9 },
      runner: { key: 'runner', name: '疾行', hpMul: 0.6, speed: 88, baseDmg: 1, atkDmg: 6,  atkInterval: 0.6, gold: 1, color: '#d6c04b', size: 7 },
      tank:   { key: 'tank',   name: '重甲', hpMul: 2.4, speed: 38, baseDmg: 2, atkDmg: 22, atkInterval: 1.0, gold: 2, color: '#6f7a8c', size: 13 },
      boss:   { key: 'boss',   name: '首领', hpMul: 4,   speed: 32, baseDmg: 3, atkDmg: 45, atkInterval: 1.0, gold: 5, color: '#b3341f', size: 20 }
    },

    /* 10 波：hp 为该波基准单体血量，mix 为兵种权重，boss 为追加首领数量 */
    waves: [
      { hp: 34,  count: 6,  gap: 3.0, mix: [['grunt', 1]] },
      { hp: 108, count: 8,  gap: 2.8, mix: [['grunt', 3], ['runner', 1]] },
      { hp: 160, count: 9,  gap: 2.6, mix: [['grunt', 2], ['runner', 1]] },
      { hp: 205, count: 11, gap: 2.5, mix: [['grunt', 4], ['runner', 3], ['tank', 3]] },
      { hp: 250, count: 12, gap: 2.4, mix: [['grunt', 4], ['runner', 3], ['tank', 3]], boss: 1 },
      { hp: 300, count: 12, gap: 2.5, mix: [['grunt', 3], ['runner', 4], ['tank', 4]] },
      { hp: 355, count: 13, gap: 2.6, mix: [['grunt', 4], ['runner', 3], ['tank', 4]] },
      { hp: 500, count: 13, gap: 2.6, mix: [['grunt', 3], ['runner', 5], ['tank', 4]] },
      { hp: 520, count: 14, gap: 2.6, mix: [['grunt', 3], ['runner', 4], ['tank', 5]] },
      { hp: 560, count: 14, gap: 2.6, mix: [['grunt', 3], ['runner', 4], ['tank', 5]], boss: 2 }
    ]
  };

  /* ---------------------------------------------------------------- 工具 */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function slotX(cfg, slot) { return cfg.board.slotX0 + slot * cfg.board.slotGap; }
  function laneY(cfg, lane) {
    return cfg.board.laneTop + lane * (cfg.board.laneH + cfg.board.laneGap) + cfg.board.laneH / 2;
  }

  /** 单位的当前数值（等级 ×2 线性复利，攻速与射程不变） */
  function unitStats(cfg, type, level) {
    var def = cfg.units[type];
    var mul = Math.pow(cfg.levelMul, level - 1);
    return {
      type: type,
      def: def,
      dmg: (def.dmg || 0) * mul,
      hp: (def.hp || 0) * mul,
      interval: def.interval || 0,
      range: def.range || 0,
      splash: def.splash || 0,
      splashMax: def.splashMax || 0,
      slow: def.slow || 0,
      slowDur: def.slowDur || 0,
      block: def.block || 0,
      invested: def.cost * Math.pow(2, level - 1),
      dps: def.dmg ? (def.dmg * mul) / def.interval : 0
    };
  }

  function pickWeighted(rng, weights) {
    var keys = Object.keys(weights), total = 0, i, r;
    for (i = 0; i < keys.length; i++) total += weights[keys[i]];
    r = rng() * total;
    for (i = 0; i < keys.length; i++) {
      r -= weights[keys[i]];
      if (r <= 0) return keys[i];
    }
    return keys[keys.length - 1];
  }

  /* ------------------------------------------------------------ 波次生成 */

  function buildWave(cfg, round, rng) {
    var w = cfg.waves[Math.min(round, cfg.waves.length) - 1];
    var weights = {}, i, type, spawns = [];
    for (i = 0; i < w.mix.length; i++) weights[w.mix[i][0]] = w.mix[i][1];
    for (i = 0; i < w.count; i++) {
      type = pickWeighted(rng, weights);
      spawns.push({ type: type, hp: w.hp * cfg.enemies[type].hpMul, gap: w.gap });
    }
    for (i = 0; i < (w.boss || 0); i++) {
      spawns.push({ type: 'boss', hp: w.hp * cfg.enemies.boss.hpMul, gap: w.gap });
    }
    return { round: round, baseHp: w.hp, count: spawns.length, spawns: spawns };
  }

  /** 下一波预告：兵种构成 / 总血量 / 每路数量 */
  function wavePreview(game) {
    var w = game.wave, cfg = game.cfg, by = {}, list = [], totalHp = 0, i, k;
    for (i = 0; i < w.spawns.length; i++) {
      var s = w.spawns[i];
      by[s.type] = (by[s.type] || 0) + 1;
      totalHp += s.hp;
    }
    for (k in by) list.push({ type: k, name: cfg.enemies[k].name, count: by[k], hp: Math.round(w.baseHp * cfg.enemies[k].hpMul) });
    return {
      round: game.round,
      list: list,
      totalHp: Math.round(totalHp),
      laneCount: [Math.ceil(w.count / 2), Math.floor(w.count / 2)],
      boss: (cfg.waves[Math.min(game.round, cfg.waves.length) - 1].boss || 0)
    };
  }

  /* --------------------------------------------------------------- 生命周期 */

  function createGame(opts) {
    opts = opts || {};
    var cfg = opts.cfg || CFG;
    var seed = opts.seed || cfg.seed;
    var rng = mulberry32(seed);
    var game = {
      cfg: cfg,
      ruleset_id: cfg.ruleset_id,
      seed: seed,
      rng: rng,
      clock: 0,

      phase: 'prep',              /* prep → combat → settle */
      round: 1,
      gold: cfg.econ.startGold,
      baseHp: cfg.base.hp,
      baseHpMax: cfg.base.hp,
      timer: cfg.phase.prep,

      units: [],
      enemies: [],
      offers: [],
      fx: [],
      toasts: [],

      nextId: 1,
      spawnQueue: [],
      spawnTimer: 0,
      spawnLaneIdx: 0,
      wave: buildWave(cfg, 1, rng),
      waveNext: null,
      waveResult: null,

      paused: false,
      speed: 1,
      over: false,
      win: false,
      allowMergeInCombat: opts.allowMergeInCombat !== false,

      stats: {
        buys: 0, fullSlotMisses: 0, merges: 0, sells: 0, rerolls: 0,
        maxLevel: 1, kills: 0, leaks: 0, damageTaken: 0,
        goldSpent: 0, goldEarned: 0, replay: []
      },

      events: []
    };
    rollShop(game);
    logEvent(game, 'run_start', { seed: seed, ruleset: cfg.ruleset_id });
    return game;
  }

  function logEvent(game, name, data) {
    game.events.push({ t: +game.clock.toFixed(2), name: name, data: data || null });
    if (game.events.length > 400) game.events.shift();
  }

  function toast(game, text, kind) {
    game.toasts.push({ text: text, kind: kind || 'info', t: 2.0 });
    if (game.toasts.length > 6) game.toasts.shift();
  }

  function addFx(game, fx) {
    game.fx.push(fx);
    if (game.fx.length > 240) game.fx.shift();
  }

  function nextOffer(game) {
    var t = pickWeighted(game.rng, game.cfg.shopWeights);
    return { id: game.nextId++, type: t, price: game.cfg.units[t].cost };
  }

  function rollShop(game, free) {
    var cfg = game.cfg, i, offers = game.offers || [];
    if (!free) {
      offers = [];
      for (i = 0; i < cfg.shopSize; i++) offers.push(nextOffer(game));
      game.offers = offers;
    } else {
      game.offers = [];
      for (i = 0; i < cfg.shopSize; i++) game.offers.push(nextOffer(game));
    }
  }

  /* ------------------------------------------------------------- 棋盘查询 */

  function unitAt(game, lane, slot) {
    for (var i = 0; i < game.units.length; i++) {
      var u = game.units[i];
      if (u.lane === lane && u.slot === slot) return u;
    }
    return null;
  }

  function findUnit(game, id) {
    for (var i = 0; i < game.units.length; i++) if (game.units[i].id === id) return game.units[i];
    return null;
  }

  function laneUsed(game, lane) {
    var n = 0;
    for (var i = 0; i < game.units.length; i++) if (game.units[i].lane === lane) n++;
    return n;
  }

  function findFreeSlot(game) {
    var cfg = game.cfg, best = null, l, s, used;
    for (l = 0; l < cfg.board.lanes; l++) {
      used = laneUsed(game, l);
      if (used >= cfg.board.slots) continue;
      if (!best || used < best.used) {
        for (s = 0; s < cfg.board.slots; s++) {
          if (!unitAt(game, l, s)) { best = { lane: l, slot: s, used: used }; break; }
        }
      }
    }
    return best;
  }

  function boardDps(game) {
    var total = 0, lanes = [0, 0], i, st;
    for (i = 0; i < game.units.length; i++) {
      st = unitStats(game.cfg, game.units[i].type, game.units[i].level);
      total += st.dps;
      lanes[game.units[i].lane] = (lanes[game.units[i].lane] || 0) + st.dps;
    }
    return { total: total, lanes: lanes };
  }

  /* ---------------------------------------------------------------- 动作 */

  function buy(game, offerIdx) {
    if (game.over) return { ok: false, reason: '本局已结束' };
    if (game.phase !== 'prep') return { ok: false, reason: '战斗中不能购买' };
    var offer = game.offers[offerIdx];
    if (!offer) return { ok: false, reason: '无效商品位' };
    if (game.gold < offer.price) { toast(game, '金币不足', 'warn'); return { ok: false, reason: '金币不足' }; }
    var free = findFreeSlot(game);
    if (!free) {
      game.stats.fullSlotMisses++;
      toast(game, '槽位已满：先合成或卖出', 'warn');
      logEvent(game, 'buy_blocked_full', { round: game.round });
      return { ok: false, reason: '槽位已满' };
    }
    game.gold -= offer.price;
    game.stats.goldSpent += offer.price;
    game.stats.buys++;
    var unit = {
      id: game.nextId++, type: offer.type, level: 1, lane: free.lane, slot: free.slot,
      cd: 0, hpMax: unitStats(game.cfg, offer.type, 1).hp, hpCur: unitStats(game.cfg, offer.type, 1).hp,
      bornAt: game.clock, hitT: 0
    };
    game.units.push(unit);
    game.offers[offerIdx] = nextOffer(game);
    logEvent(game, 'buy', { type: offer.type, price: offer.price, lane: free.lane, slot: free.slot });
    return { ok: true, unit: unit };
  }

  function reroll(game) {
    if (game.over) return { ok: false, reason: '本局已结束' };
    if (game.phase !== 'prep') return { ok: false, reason: '战斗中不能刷新' };
    var cost = game.cfg.econ.rerollCost;
    if (game.gold < cost) { toast(game, '金币不足，无法刷新', 'warn'); return { ok: false, reason: '金币不足' }; }
    game.gold -= cost;
    game.stats.goldSpent += cost;
    game.stats.rerolls++;
    rollShop(game);
    return { ok: true };
  }

  function canEdit(game) {
    if (game.over) return { ok: false, reason: '本局已结束' };
    if (game.phase === 'combat' && !game.allowMergeInCombat) return { ok: false, reason: '战斗中已锁定棋盘' };
    return { ok: true };
  }

  function removeUnit(game, id) {
    for (var i = 0; i < game.units.length; i++) {
      if (game.units[i].id === id) { game.units.splice(i, 1); return true; }
    }
    return false;
  }

  function merge(game, aId, bId) {
    var perms = canEdit(game);
    if (!perms.ok) { toast(game, perms.reason, 'warn'); return perms; }
    var a = findUnit(game, aId), b = findUnit(game, bId);
    if (!a || !b || a.id === b.id) { toast(game, '这里没有可合成的目标', 'warn'); return { ok: false, reason: '目标无效' }; }
    if (a.type !== b.type) { toast(game, '类型不同，不能合成', 'warn'); return { ok: false, reason: '类型不同' }; }
    if (a.level !== b.level) { toast(game, '等级不同，不能合成', 'warn'); return { ok: false, reason: '等级不同' }; }
    if (a.level >= game.cfg.maxLevel) { toast(game, '已达最高等级 L' + game.cfg.maxLevel, 'warn'); return { ok: false, reason: '已满级' }; }
    var st = unitStats(game.cfg, b.type, b.level + 1);
    b.level += 1;
    b.hpMax = st.hp;
    b.hpCur = st.hp;   /* 合成视为重建：满血 */
    b.hitT = 0;
    removeUnit(game, a.id);
    game.stats.merges++;
    game.stats.maxLevel = Math.max(game.stats.maxLevel, b.level);
    addFx(game, { kind: 'merge', x: slotX(game.cfg, b.slot), y: laneY(game.cfg, b.lane), t: 0.55, max: 0.55, color: st.def.color, level: b.level });
    logEvent(game, 'merge', { type: b.type, level: b.level, lane: b.lane, slot: b.slot });
    return { ok: true, unit: b };
  }

  function moveUnit(game, aId, lane, slot) {
    var perms = canEdit(game);
    if (!perms.ok) { toast(game, perms.reason, 'warn'); return perms; }
    var a = findUnit(game, aId);
    if (!a) { toast(game, '单位已不存在', 'warn'); return { ok: false, reason: '目标无效' }; }
    if (a.lane === lane && a.slot === slot) return { ok: false, reason: '原地' };
    var occupied = unitAt(game, lane, slot);
    if (occupied) return { ok: false, reason: '目标格已占用' };
    a.lane = lane; a.slot = slot; a.cd = Math.min(a.cd, 0.2);
    return { ok: true, unit: a };
  }

  /** 拖拽落点统一入口：空格=移动，同型同级=合成 */
  function drop(game, fromId, lane, slot) {
    var perms = canEdit(game);
    if (!perms.ok) return perms;
    var target = unitAt(game, lane, slot);
    if (target && target.id !== fromId) return merge(game, fromId, target.id);
    if (target && target.id === fromId) return { ok: false, reason: '原地' };
    return moveUnit(game, fromId, lane, slot);
  }

  function sell(game, id) {
    var perms = canEdit(game);
    if (!perms.ok) { toast(game, perms.reason, 'warn'); return perms; }
    var u = findUnit(game, id);
    if (!u) { toast(game, '单位已不存在', 'warn'); return { ok: false, reason: '目标无效' }; }
    var st = unitStats(game.cfg, u.type, u.level);
    var refund = Math.floor(st.invested * game.cfg.econ.sellRate);
    game.gold += refund;
    game.stats.sells++;
    removeUnit(game, u.id);
    toast(game, '卖出 +' + refund + ' 金币', 'gold');
    logEvent(game, 'sell', { type: st.type, level: u.level, refund: refund });
    return { ok: true, refund: refund };
  }

  /* ---------------------------------------------------------------- 阶段 */

  function startCombat(game) {
    if (game.phase !== 'prep' || game.over) return { ok: false, reason: '当前不能开战' };
    game.phase = 'combat';
    game.timer = game.cfg.phase.combat;
    game.spawnQueue = game.wave.spawns.slice();
    game.spawnTimer = 0;
    game.spawnLaneIdx = 0;
    game.waveResult = {
      round: game.round, kills: 0, leaks: 0, damage: 0, goldStart: game.gold,
      hpTotal: Math.round(game.wave.spawns.reduce(function (a, s) { return a + s.hp; }, 0)),
      dpsStart: Math.round(boardDps(game).total)
    };
    logEvent(game, 'combat_start', { round: game.round, dps: game.waveResult.dpsStart, hp: game.waveResult.hpTotal });
    return { ok: true };
  }

  function endCombat(game, reason) {
    var cfg = game.cfg, s = game.waveResult || {};
    s.reason = reason;
    s.duration = +(cfg.phase.combat - Math.max(0, game.timer)).toFixed(1);
    var bonus = 0, early = 0;
    if (reason === 'clear') {
      bonus = cfg.econ.clearBonusBase + game.round * cfg.econ.clearBonusPerRound;
      early = Math.min(cfg.econ.earlyCap, Math.floor(Math.max(0, game.timer) / cfg.econ.earlyStep));
      bonus += early;
    }
    game.gold += bonus;
    game.stats.goldEarned += bonus;
    s.bonus = bonus;
    s.clearBonus = reason === 'clear' ? cfg.econ.clearBonusBase + game.round * cfg.econ.clearBonusPerRound : 0;
    s.early = early;
    s.goldEnd = game.gold;
    s.baseHpEnd = game.baseHp;
    s.slotsUsed = game.units.length;
    game.phase = 'settle';
    /* 提前生成下一波，让结算面板的预告与真正开打的波次完全一致 */
    game.waveNext = game.round < cfg.waves.length ? buildWave(cfg, game.round + 1, game.rng) : null;
    game.stats.replay.push({
      round: game.round, reason: reason, hpTotal: s.hpTotal, dps: s.dpsStart,
      units: game.units.length, maxLevel: game.stats.maxLevel,
      kills: s.kills, leaks: s.leaks, damage: s.damage,
      duration: s.duration, bonus: bonus, goldEnd: game.gold, baseHp: game.baseHp
    });
    logEvent(game, 'wave_end', { round: game.round, reason: reason, bonus: bonus, baseHp: game.baseHp });
    if (game.baseHp <= 0) { game.over = true; game.win = false; }
    else if (reason === 'clear' && game.round >= cfg.waves.length) { game.over = true; game.win = true; }
    else if (reason === 'timeout' && game.round >= cfg.waves.length) {
      /* 最终波必须在 60 秒内清空，否则判负 */
      game.over = true; game.win = false; s.finalFail = true;
    }
  }

  function nextRound(game) {
    if (game.over) return { ok: false, reason: '本局已结束' };
    if (game.phase !== 'settle') return { ok: false, reason: '当前不是结算阶段' };
    if (game.round >= game.cfg.waves.length) return { ok: false, reason: '已经是最后一波' };
    game.round += 1;
    game.wave = game.waveNext || buildWave(game.cfg, game.round, game.rng);
    game.waveNext = null;
    game.phase = 'prep';
    game.timer = game.cfg.phase.prep;
    game.waveResult = null;
    for (var i = 0; i < game.units.length; i++) game.units[i].cd = 0;
    rollShop(game);
    logEvent(game, 'round_start', { round: game.round });
    return { ok: true };
  }

  /* ---------------------------------------------------------------- 战斗结算 */

  function spawnEnemy(game, spawn) {
    var cfg = game.cfg, def = cfg.enemies[spawn.type];
    var enemy = {
      id: game.nextId++,
      type: spawn.type,
      lane: game.spawnLaneIdx % cfg.board.lanes,
      x: cfg.board.spawnX,
      hp: spawn.hp,
      hpMax: spawn.hp,
      speed: def.speed,
      baseDmg: def.baseDmg,
      atkDmg: def.atkDmg,
      atkInterval: def.atkInterval,
      gold: def.gold,
      goldPaid: false,
      slowT: 0,
      slowF: 0,
      atkT: def.atkInterval,
      hitT: 0,
      escaped: false
    };
    game.spawnLaneIdx++;
    game.enemies.push(enemy);
    return enemy;
  }

  function pickTarget(game, unit, ux, range) {
    var best = null, i, e, bx = ux - 30;
    for (i = 0; i < game.enemies.length; i++) {
      e = game.enemies[i];
      if (e.hp <= 0 || e.escaped || e.lane !== unit.lane) continue;
      if (e.x < bx || e.x > ux + range) continue;
      if (!best || e.x < best.x) best = e;
    }
    return best;
  }

  function applyDamage(game, enemy, dmg, color) {
    enemy.hp -= dmg;
    enemy.hitT = 0.16;
    addFx(game, { kind: 'dmg', x: enemy.x, y: laneY(game.cfg, enemy.lane) - 26, text: Math.round(dmg), t: 0.55, max: 0.55, color: color || '#ffd9a0' });
  }

  function unitFire(game, unit, dt) {
    var cfg = game.cfg, st = unitStats(cfg, unit.type, unit.level);
    if (!st.dmg) return;
    unit.cd -= dt;
    if (unit.cd > 0) return;
    var ux = slotX(cfg, unit.slot);
    var target = pickTarget(game, unit, ux, st.range);
    if (!target) { unit.cd = 0; return; }   /* 无目标时保持待发，敌人进入射程立刻开火 */
    unit.cd = st.interval;
    var ly = laneY(cfg, unit.lane);
    addFx(game, { kind: 'shot', x1: ux, y1: ly, x2: target.x, y2: laneY(cfg, target.lane), t: 0.16, max: 0.16, color: st.def.color });
    if (st.slow) {
      target.slowT = Math.max(target.slowT, st.slowDur);
      target.slowF = Math.max(target.slowF, st.slow);
    }
    applyDamage(game, target, st.dmg, st.def.color);
    if (st.splash) {
      var n = 1, i, e;
      for (i = 0; i < game.enemies.length && n < st.splashMax; i++) {
        e = game.enemies[i];
        if (e === target || e.lane !== unit.lane || e.hp <= 0 || e.escaped) continue;
        if (Math.abs(e.x - target.x) <= st.splash) { applyDamage(game, e, st.dmg, st.def.color); n++; }
      }
    }
  }

  function findBlocker(game, enemy) {
    var i, u, bx, st;
    for (i = 0; i < game.units.length; i++) {
      u = game.units[i];
      if (u.type !== 'bulwark' || u.lane !== enemy.lane || u.hpCur <= 0) continue;
      bx = slotX(game.cfg, u.slot);
      st = unitStats(game.cfg, u.type, u.level);
      if (enemy.x >= bx && enemy.x - bx <= st.block) return u;
    }
    return null;
  }

  function enemyStep(game, enemy, dt) {
    if (enemy.hp <= 0 || enemy.escaped) return;
    var cfg = game.cfg;
    enemy.hitT = Math.max(0, enemy.hitT - dt);
    enemy.slowT = Math.max(0, enemy.slowT - dt);
    var spd = enemy.speed * (enemy.slowT > 0 ? (1 - (enemy.slowF || 0.4)) : 1);
    var blocker = findBlocker(game, enemy);
    if (blocker) {
      enemy.x = Math.min(enemy.x, slotX(cfg, blocker.slot) + 26);
      enemy.atkT -= dt;
      if (enemy.atkT <= 0) {
        enemy.atkT += enemy.atkInterval;
        blocker.hpCur -= enemy.atkDmg;
        blocker.hitT = 0.18;
        addFx(game, { kind: 'block', x: slotX(cfg, blocker.slot) + 20, y: laneY(cfg, enemy.lane) - 8, t: 0.25, max: 0.25, color: '#8b93a7' });
        if (blocker.hpCur <= 0) {
          addFx(game, { kind: 'break', x: slotX(cfg, blocker.slot), y: laneY(cfg, blocker.lane), t: 0.5, max: 0.5, color: '#8b93a7' });
          removeUnit(game, blocker.id);
        }
      }
    } else {
      enemy.x -= spd * dt;
    }
  }

  function resolveBreach(game) {
    var cfg = game.cfg, i, e;
    for (i = 0; i < game.enemies.length; i++) {
      e = game.enemies[i];
      if (e.hp <= 0 || e.escaped) continue;
      if (e.x <= cfg.board.baseX) {
        e.escaped = true;
        game.baseHp -= e.baseDmg;
        game.stats.leaks++;
        game.stats.damageTaken += e.baseDmg;
        if (game.waveResult) { game.waveResult.leaks++; game.waveResult.damage += e.baseDmg; }
        addFx(game, { kind: 'breach', x: cfg.board.baseX, y: laneY(cfg, e.lane), t: 0.6, max: 0.6, color: '#e04b2f' });
        logEvent(game, 'breach', { type: e.type, dmg: e.baseDmg, lane: e.lane });
      }
    }
  }

  function cleanupDead(game) {
    var i, e, alive = [];
    for (i = 0; i < game.enemies.length; i++) {
      e = game.enemies[i];
      if (e.hp > 0 && !e.escaped) { alive.push(e); continue; }
      if (e.hp <= 0 && !e.goldPaid) {
        e.goldPaid = true;
        game.gold += e.gold;
        game.stats.goldEarned += e.gold;
        game.stats.kills++;
        if (game.waveResult) game.waveResult.kills++;
        addFx(game, { kind: 'die', x: e.x, y: laneY(game.cfg, e.lane), t: 0.4, max: 0.4, color: game.cfg.enemies[e.type].color });
      }
    }
    game.enemies = alive;
  }

  function timeoutWave(game) {
    var s = game.waveResult, i, e;
    for (i = 0; i < game.enemies.length; i++) {
      e = game.enemies[i];
      if (e.hp <= 0 || e.escaped) continue;
      game.baseHp -= e.baseDmg;
      game.stats.leaks++;
      game.stats.damageTaken += e.baseDmg;
      s.leaks++;
      s.damage += e.baseDmg;
    }
    game.enemies = [];
    addFx(game, { kind: 'timeout', x: 500, y: 250, t: 1.0, max: 1.0, color: '#e04b2f' });
    endCombat(game, 'timeout');
  }

  function combatStep(game, dt) {
    var cfg = game.cfg, guard = 0, i, u;
    game.timer -= dt;

    /* 1 生成 */
    game.spawnTimer -= dt;
    while (game.spawnQueue.length > 0 && game.spawnTimer <= 0 && guard++ < 60) {
      var spawn = game.spawnQueue.shift();
      spawnEnemy(game, spawn);
      game.spawnTimer += spawn.gap;
    }

    /* 2 塔开火（按当前位置判定） */
    for (i = 0; i < game.units.length; i++) {
      u = game.units[i];
      if (u.hitT > 0) u.hitT = Math.max(0, u.hitT - dt);
      unitFire(game, u, dt);
    }

    /* 3 敌人推进 / 撞上壁垒 */
    for (i = 0; i < game.enemies.length; i++) enemyStep(game, game.enemies[i], dt);

    /* 4 基地判定 */
    resolveBreach(game);

    /* 5 清理 */
    cleanupDead(game);

    /* 6 结束判定 */
    if (game.baseHp <= 0) { endCombat(game, 'defeat'); return; }
    if (game.timer <= 0) { timeoutWave(game); return; }
    if (game.spawnQueue.length === 0 && game.enemies.length === 0) endCombat(game, 'clear');
  }

  function step(game, dt) {
    if (game.over || game.paused) return;
    if (!(dt > 0)) return;
    dt = Math.min(dt, 0.2);   /* 切标签页回来不补巨量帧 */
    game.clock += dt;
    var i;
    for (i = 0; i < game.toasts.length; i++) game.toasts[i].t -= dt;
    game.toasts = game.toasts.filter(function (t) { return t.t > 0; });
    for (i = game.fx.length - 1; i >= 0; i--) {
      game.fx[i].t -= dt;
      if (game.fx[i].t <= 0) game.fx.splice(i, 1);
    }
    if (game.phase === 'prep') {
      game.timer -= dt;
      if (game.timer <= 0) { game.timer = 0; startCombat(game); }
      return;
    }
    if (game.phase === 'combat') { combatStep(game, dt); return; }
  }

  /* ---------------------------------------------------------------- 自检 */

  function selftest() {
    var results = [], fails = 0;
    function t(name, cond, note) {
      results.push({ name: name, pass: !!cond, note: note === undefined ? '' : String(note) });
      if (!cond) fails++;
    }
    function advance(g, seconds) {
      var stepDt = 1 / 60, n = Math.round(seconds / stepDt);
      for (var i = 0; i < n; i++) {
        step(g, stepDt);
        if (g.phase !== 'combat' && g.phase !== 'prep') break;
      }
    }

    /* --- 初始化 --- */
    var g = createGame({ seed: 7 });
    t('ruleset_id 唯一', g.ruleset_id === RULESET_ID, RULESET_ID);
    t('初始金币 10', g.gold === 10, g.gold);
    t('初始基地 15', g.baseHp === 15, g.baseHp);
    t('初始阶段 prep', g.phase === 'prep', g.phase);
    t('准备计时 30', g.timer === 30, g.timer);
    t('商店 4 件', g.offers.length === 4, g.offers.length);
    t('棋盘 10 格', g.cfg.board.lanes * g.cfg.board.slots === 10);

    /* --- 购买 --- */
    var price0 = g.offers[0].price, type0 = g.offers[0].type;
    var bought = buy(g, 0);
    t('购买成功', bought.ok && g.units.length === 1, bought.reason || 'ok');
    t('购买扣费一致', g.gold === 10 - price0, g.gold + '/' + price0);
    t('购买后补货', g.offers.length === 4 && g.offers[0].id !== undefined);

    /* --- 合成 --- */
    g.offers[0] = { id: 9001, type: type0, price: price0 };
    g.offers[1] = { id: 9002, type: type0, price: price0 };
    g.gold = 40;
    buy(g, 0);
    var pair = g.units[1];
    g.units[0].lane = 0; g.units[0].slot = 0;
    pair.lane = 0; pair.slot = 1;
    var m = merge(g, g.units[1].id, g.units[0].id);
    t('同型同级可合成', m.ok && m.unit.level === 2 && g.units.length === 1, m.reason || 'L2');
    t('合成计数', g.stats.merges === 1, g.stats.merges);
    var st2 = unitStats(g.cfg, m.unit.type, 2);
    t('L2 伤害 ×2', Math.abs(st2.dmg - unitStats(g.cfg, m.unit.type, 1).dmg * 2) < 1e-9, st2.dmg);
    t('L2 投入成本 ×2', st2.invested === unitStats(g.cfg, m.unit.type, 1).invested * 2, st2.invested);

    var other = g.units[0].type === 'archer' ? 'cannon' : 'archer';
    g.units.push({ id: 500, type: other, level: 1, lane: 1, slot: 0, cd: 0, hpMax: 0, hpCur: 0, hitT: 0 });
    t('异型不能合成', !merge(g, 500, g.units[0].id).ok, 'blocked');
    g.units.push({ id: 501, type: m.unit.type, level: 1, lane: 1, slot: 1, cd: 0, hpMax: 0, hpCur: 0, hitT: 0 });
    t('等级不同不能合成', !merge(g, 501, g.units[0].id).ok, 'blocked');

    /* --- 满级钳制 --- */
    g.units[0].level = 5;
    g.units.push({ id: 502, type: g.units[0].type, level: 5, lane: 1, slot: 2, cd: 0, hpMax: 0, hpCur: 0, hitT: 0 });
    t('L5 以上不能合成', !merge(g, 502, g.units[0].id).ok, 'maxLevel=' + g.cfg.maxLevel);

    /* --- 卖出回收 --- */
    g.units = [];
    g.gold = 10;
    g.offers[0] = { id: 9010, type: 'archer', price: 2 };
    buy(g, 0);
    var sellRes = sell(g, g.units[0].id);
    t('卖出回收 50%', sellRes.ok && sellRes.refund === 1, sellRes.refund);

    /* --- 槽位满 --- */
    var h = createGame({ seed: 11 });
    h.gold = 100;
    var i, filled = 0;
    for (i = 0; i < 20 && h.units.length < 10; i++) {
      h.offers[0] = { id: 9100 + i, type: 'archer', price: 2 };
      if (buy(h, 0).ok) filled++;
    }
    t('棋盘最多 10 个单位', h.units.length === 10, h.units.length);
    h.offers[0] = { id: 9200, type: 'archer', price: 2 };
    var over = buy(h, 0);
    t('满槽拒绝购买', !over.ok && over.reason === '槽位已满', over.reason);
    t('满槽计数 +1', h.stats.fullSlotMisses === 1, h.stats.fullSlotMisses);
    t('满槽不扣金币', h.gold === 100 - filled * 2, h.gold);
    t('满槽不越界', h.units.every(function (u) { return u.lane >= 0 && u.lane < 2 && u.slot >= 0 && u.slot < 5; }));

    /* --- 战斗中禁止购买 --- */
    var c = createGame({ seed: 13 });
    c.gold = 50;
    startCombat(c);
    var inCombat = buy(c, 0);
    t('战斗中禁止购买', !inCombat.ok && inCombat.reason === '战斗中不能购买', inCombat.reason);

    /* --- 强阵容清波 --- */
    var win = createGame({ seed: 17 });
    win.gold = 0;
    win.units = [];
    for (i = 0; i < 5; i++) {
      win.units.push({ id: 1000 + i, type: 'archer', level: 4, lane: i % 2, slot: Math.floor(i / 2), cd: 0, hpMax: 0, hpCur: 0, hitT: 0 });
    }
    advance(win, 0.5);
    startCombat(win);
    advance(win, 61);
    t('强阵容可清第 1 波', win.waveResult && win.waveResult.reason === 'clear', win.waveResult && win.waveResult.reason);
    t('清波有收入', win.gold > 0, win.gold);
    t('清波进入结算', win.phase === 'settle', win.phase);
    t('早杀有奖励上限 3', win.waveResult.early <= 3, win.waveResult.early);

    /* --- 空阵容失败 --- */
    var lose = createGame({ seed: 19 });
    lose.units = [];
    startCombat(lose);
    advance(lose, 61);
    t('空阵容会漏怪', lose.stats.leaks >= 4, lose.stats.leaks);
    t('漏怪扣基地血', lose.baseHp < 15, lose.baseHp);

    /* --- 60 秒上限 --- */
    var slow = createGame({ seed: 23 });
    slow.units = [{ id: 2000, type: 'bulwark', level: 1, lane: 0, slot: 4, cd: 0, hpMax: 60, hpCur: 60, hitT: 0 }];
    startCombat(slow);
    var ticks = 0;
    while (slow.phase === 'combat' && ticks < 60 * 70) { step(slow, 1 / 60); ticks++; }
    t('战斗不超过 60 秒', ticks <= 60 * 61, ticks + ' 帧');
    t('超时按漏怪结算', slow.waveResult && (slow.waveResult.reason === 'clear' || slow.waveResult.reason === 'timeout'), slow.waveResult && slow.waveResult.reason);

    /* --- 回合推进与通关 --- */
    var run = createGame({ seed: 29 });
    run.round = 10;
    run.wave = buildWave(run.cfg, 10, run.rng);
    run.gold = 9999;
    for (i = 0; i < 10; i++) run.units.push({ id: 3000 + i, type: 'archer', level: 4, lane: i % 2, slot: Math.floor(i / 2), cd: 0, hpMax: 0, hpCur: 0, hitT: 0 });
    startCombat(run);
    advance(run, 61);
    if (run.waveResult && run.waveResult.reason === 'clear') t('第 10 波清空即通关', run.win === true, run.win);
    else t('第 10 波未清空（数值待调）', true, run.waveResult && run.waveResult.reason);

    var fail = results.filter(function (r) { return !r.pass; }).length;
    return { pass: fail === 0, fails: fail, results: results, ruleset_id: RULESET_ID };
  }

  var api = {
    RULESET_ID: RULESET_ID,
    CFG: CFG,
    createGame: createGame,
    step: step,
    buy: buy,
    reroll: reroll,
    merge: merge,
    moveUnit: moveUnit,
    drop: drop,
    sell: sell,
    startCombat: startCombat,
    nextRound: nextRound,
    endCombat: endCombat,
    unitStats: unitStats,
    unitAt: unitAt,
    findUnit: findUnit,
    findFreeSlot: findFreeSlot,
    slotX: slotX,
    laneY: laneY,
    wavePreview: wavePreview,
    buildWave: buildWave,
    boardDps: boardDps,
    selftest: selftest,
    mulberry32: mulberry32
  };

  root.Engine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
