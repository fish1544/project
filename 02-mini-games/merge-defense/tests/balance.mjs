/*
 * balance.mjs — 数值模拟与平衡校准工具（Node，复用同一份 Engine.CFG）
 * 用法: node tests/balance.mjs [competent|sloppy]
 * competent = 会保住两路覆盖、只在单位够多时合成的玩家
 * sloppy    = 见到能合就合、不管覆盖的玩家（难度下限）
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../js/engine.js');

const DT = 1 / 60;
const MODE = process.argv[2] === 'sloppy' ? 'sloppy' : 'competent';
const MIN_UNITS = MODE === 'sloppy' ? 1 : 6;

function playRun(opts = {}) {
  const g = E.createGame({ seed: opts.seed || E.CFG.seed });
  const report = [];
  let rounds = 0;

  const countType = () => {
    const cnt = {};
    for (const u of g.units) cnt[u.type] = (cnt[u.type] || 0) + 1;
    return cnt;
  };

  const mergeBest = (minUnits) => {
    if (g.units.length <= minUnits) return false;
    const groups = {};
    for (const u of g.units) {
      const k = u.type + ':' + u.level;
      (groups[k] = groups[k] || []).push(u);
    }
    for (const k in groups) {
      const arr = groups[k];
      if (arr.length >= 2 && arr[0].level < E.CFG.maxLevel) {
        E.merge(g, arr[1].id, arr[0].id);
        return true;
      }
    }
    return false;
  };

  const buyBest = () => {
    const cnt = countType();
    let best = -1, bestScore = -1;
    g.offers.forEach((o, i) => {
      if (o.price > g.gold) return;
      const score = (cnt[o.type] || 0) * 10 + (o.type === 'archer' ? 3 : 0) + (o.price <= 2 ? 1 : 0);
      if (score > bestScore) { bestScore = score; best = i; }
    });
    if (best < 0) return false;
    return E.buy(g, best).ok;
  };

  const balanceLanes = () => {
    if (MODE !== 'competent') return;
    for (let guard = 0; guard < 4; guard++) {
      const lanes = E.boardDps(g).lanes;
      const strong = lanes[0] >= lanes[1] ? 0 : 1;
      const weak = 1 - strong;
      const lo = Math.min(lanes[0], lanes[1]), hi = Math.max(lanes[0], lanes[1]);
      if (hi <= 0 || lo / hi > 0.7) return;
      const donor = g.units.filter(u => u.lane === strong)
        .sort((a, b) => E.unitStats(g.cfg, b.type, b.level).dps - E.unitStats(g.cfg, a.type, a.level).dps)[0];
      const free = E.findFreeSlot(g);
      if (!donor || !free || free.lane !== weak) return;
      if (E.moveUnit(g, donor.id, free.lane, free.slot).ok === false) return;
    }
  };

  const prep = () => {
    let sells = 0;
    for (let guard = 0; guard < 200; guard++) {
      balanceLanes();
      const free = E.findFreeSlot(g);
      let acted = false;
      if (free && MODE === 'competent' && g.units.length < 4) {
        acted = buyBest();
      } else if (mergeBest(MIN_UNITS)) {
        acted = true;
      } else if (free && g.gold >= 2) {
        acted = buyBest();
      } else if (!free) {
        if (mergeBest(0)) acted = true;
        else if (sells < 2) {
          const junk = g.units.filter(u => u.level === 1).sort((a, b) => a.slot - b.slot)[0];
          if (junk) { E.sell(g, junk.id); sells++; acted = true; }
        }
      }
      if (!acted) break;
    }
    balanceLanes();
  };

  while (!g.over && rounds < 20) {
    rounds++;
    const pre = { gold: g.gold, units: g.units.length, dps: Math.round(E.boardDps(g).total) };
    prep();
    const post = { gold: g.gold, units: g.units.length, dps: Math.round(E.boardDps(g).total), lanes: E.boardDps(g).lanes.map(Math.round) };
    E.startCombat(g);
    let ticks = 0;
    while (g.phase === 'combat' && ticks < 60 * 61) { E.step(g, DT); ticks++; }
    report.push({
      round: g.round,
      goldPre: pre.gold,
      dps: post.dps,
      lanes: post.lanes,
      units: post.units,
      waveHp: g.waveResult.hpTotal,
      reason: g.waveResult.reason,
      duration: g.waveResult.duration,
      kills: g.waveResult.kills,
      leaks: g.waveResult.leaks,
      bonus: g.waveResult.bonus,
      goldEnd: g.gold,
      baseHp: g.baseHp,
      maxLevel: g.stats.maxLevel
    });
    if (g.over) break;
    E.nextRound(g);
  }
  return { report, stats: g.stats, win: g.win, baseHp: g.baseHp, over: g.over };
}

const pad = (n, w) => String(n).padStart(w, ' ');

for (const seed of [11, 20261107, 777]) {
  const r = playRun({ seed });
  console.log(`\n=== ${MODE} · 种子 ${seed} ===`);
  console.log('波 | 金币 | DPS | 左/右 | 单位 | 波次血 | 结果  | 用时 | 漏 | 收入 | 期末金 | 基地 | Lv');
  for (const row of r.report) {
    console.log([
      pad(row.round, 2), '|', pad(row.goldPre, 4), '|', pad(row.dps, 4), '|',
      pad(row.lanes[0] + '/' + row.lanes[1], 5), '|', pad(row.units, 4), '|', pad(row.waveHp, 6), '|',
      pad(row.reason, 5), '|', pad(row.duration, 4), '|', pad(row.leaks, 2), '|',
      pad(row.bonus, 4), '|', pad(row.goldEnd, 6), '|', pad(row.baseHp, 4), '|', pad(row.maxLevel, 2)
    ].join(' '));
  }
  console.log(`结果: ${r.win ? '通关' : r.over ? '失败' : '未结束'} · 基地 ${r.baseHp} · 打满 ${r.report.length} 波 · 合成 ${r.stats.merges} · 卖出 ${r.stats.sells} · 满槽无效购买 ${r.stats.fullSlotMisses}`);
}
