/*
 * browser-test.mjs — 真实浏览器验收（Chrome headless + DevTools 协议）
 * 覆盖：页面自检、开始 → 购买 → 合成 → 开战 → 结算 → 下一轮、失败与重开、
 *       规则浮层、画布像素非空、窄屏不裁切、截图存档。
 * 用法:
 *   node tests/browser-test.mjs
 *   或先在 PowerShell 设置 $env:GAME_URL="https://.../merge-defense/" 再运行（验收线上入口）
 * 末行输出 TEST PASS / TEST ERROR
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOTS = join(ROOT, '_shots');
/* 默认验收本地文件；传 GAME_URL 可验收线上入口（例如 GitHub Pages） */
const TARGET_URL = process.env.GAME_URL || pathToFileURL(join(ROOT, 'index.html')).href;
const q = (s) => TARGET_URL + (TARGET_URL.includes('?') ? '&' : '?') + s;

const PORT = 9600 + Math.floor(Math.random() * 200);
const profile = mkdtempSync(join(tmpdir(), 'md-cdp-'));
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking',
  '--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, 'about:blank'
], { stdio: 'ignore' });

async function getTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page) return page;
    } catch (e) { /* 尚未启动 */ }
    await sleep(250);
  }
  throw new Error('CDP not reachable');
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, (msg) => msg.error ? reject(new Error(method + ': ' + JSON.stringify(msg.error))) : resolve(msg.result));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

const results = [];
function check(name, cond, note = '') {
  results.push({ name, pass: !!cond, note: String(note) });
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const target = await getTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  const send = cdp(ws);

  const evalJS = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval error: ' + JSON.stringify(r.exceptionDetails.text || r.exceptionDetails));
    return r.result && r.result.value;
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(SHOTS, name), Buffer.from(r.data, 'base64'));
  };
  const goto = async (url) => { await send('Page.navigate', { url }); await sleep(900); };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  /* ---------- 1. 页面自检（规则断言） ---------- */
  await goto(q('selftest=1'));
  let out = '';
  for (let i = 0; i < 40; i++) {
    out = await evalJS('document.body ? document.body.innerText : ""') || '';
    if (out.includes('TEST PASS') || out.includes('TEST ERROR')) break;
    await sleep(300);
  }
  check('页面自检通过（33 项规则断言）', out.includes('TEST PASS'), out.includes('TEST ERROR') ? '有断言失败' : 'ok');
  const testDetail = await evalJS(`window.__TEST ? window.__TEST.results.filter(r => !r.pass).map(r => r.name).join('|') : 'no __TEST'`);
  check('自检无失败项', !testDetail || testDetail === '', testDetail);

  /* ---------- 2. 正常游玩路径 ---------- */
  await goto(TARGET_URL);
  await sleep(600);
  const boot = await evalJS(`(() => {
    const g = window.__GAME.state;
    return { hasGame: !!g, phase: g.phase, gold: g.gold, overlay: document.querySelector('#overlay').classList.contains('show'), rules: g.cfg.ruleset_id, cvW: document.getElementById('cv').width };
  })()`);
  check('首帧加载无阻断错误', boot && boot.hasGame && boot.rules === 'MERGE-DEF-001-v1', JSON.stringify(boot));
  check('开局显示玩法说明浮层', boot.overlay === true, String(boot.overlay));
  check('画布已完成 DPR 适配', boot.cvW > 900, boot.cvW);

  await evalJS(`document.querySelector('#mStart').click(); true`);
  await sleep(500);
  const afterStart = await evalJS(`(() => { const g = window.__GAME.state; return { phase: g.phase, paused: g.paused, modal: window.__GAME.ui.modal, overlay: document.querySelector('#overlay').classList.contains('show') }; })()`);
  check('点开始后进入布防且计时运行', afterStart.phase === 'prep' && !afterStart.paused && !afterStart.overlay, JSON.stringify(afterStart));

  const buy1 = await evalJS(`(() => {
    const G = window.__GAME, g = G.state;
    const before = { gold: g.gold, units: g.units.length };
    document.querySelector('#shop .card').click();
    return { before, after: { gold: g.gold, units: g.units.length }, type: g.units[0] && g.units[0].type };
  })()`);
  check('点商店卡片可购买并落位', buy1.after.units === buy1.before.units + 1 && buy1.after.gold < buy1.before.gold, JSON.stringify(buy1));

  const mergeRes = await evalJS(`(() => {
    const G = window.__GAME, g = G.state, E = G.api;
    g.gold = 20;
    g.offers[0] = { id: 9001, type: 'archer', price: 2 };
    g.offers[1] = { id: 9002, type: 'archer', price: 2 };
    E.buy(g, 0); E.buy(g, 1);
    const a = g.units.filter(u => u.type === 'archer' && u.level === 1)[0];
    const b = g.units.filter(u => u.type === 'archer' && u.level === 1)[1];
    const res = E.merge(g, b.id, a.id);
    return { ok: res.ok, level: a.level, archers: g.units.filter(u => u.type === 'archer').length, merges: g.stats.merges };
  })()`);
  check('合成入口可升到 L2（两格并一格）', mergeRes.ok && mergeRes.level === 2 && mergeRes.archers === 1 && mergeRes.merges === 1, JSON.stringify(mergeRes));

  /* 画布像素非空（深色主题：判定必须有亮像素与足够多的不同颜色） */
  const px = await evalJS(`(() => {
    const cv = document.getElementById('cv');
    const c = cv.getContext('2d');
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    let lit = 0, maxBright = 0;
    const colors = new Set();
    for (let i = 0; i < d.length; i += 4 * 37) {
      const br = Math.max(d[i], d[i + 1], d[i + 2]);
      if (br > maxBright) maxBright = br;
      if (br > 90) lit++;
      colors.add((d[i] >> 4) + '-' + (d[i + 1] >> 4) + '-' + (d[i + 2] >> 4));
    }
    return { lit, maxBright, colors: colors.size };
  })()`);
  check('画布首帧像素非空（有可见内容）', px && px.lit >= 40 && px.maxBright >= 120 && px.colors >= 10, JSON.stringify(px));

  await evalJS(`document.querySelector('#btnFight').click(); true`);
  await sleep(2500);
  const combat = await evalJS(`(() => { const g = window.__GAME.state; return { phase: g.phase, enemies: g.enemies.length, spawned: g.wave.spawns.length, timer: +g.timer.toFixed(1) }; })()`);
  check('开战后进入交战并生成敌人', combat.phase === 'combat' && combat.enemies > 0, JSON.stringify(combat));
  await shot('02-combat.png');

  await evalJS(`window.__GAME.state.speed = 8; true`);
  let settle = null;
  for (let i = 0; i < 80; i++) {
    settle = await evalJS(`(() => { const g = window.__GAME.state; return { phase: g.phase, res: g.waveResult && { reason: g.waveResult.reason, kills: g.waveResult.kills, leaks: g.waveResult.leaks }, overlay: document.querySelector('#overlay').classList.contains('show'), title: (document.querySelector('#overlay h2') || {}).textContent || '' }; })()`);
    if (settle.phase === 'settle') break;
    await sleep(500);
  }
  check('60 秒内结束并进入结算', settle && settle.phase === 'settle', JSON.stringify(settle));
  check('结算浮层出现并给出本波结果', settle && settle.overlay && /第 1 波/.test(settle.title), settle && settle.title);
  const settleText = await evalJS(`document.querySelector('#overlay').innerText`);
  check('结算面板数值无 NaN / undefined', !/NaN|undefined/.test(settleText), (settleText || '').replace(/\n/g, ' ').slice(0, 120));
  await shot('03-settle.png');

  const nextRes = await evalJS(`(() => {
    document.querySelector('#mNext').click();
    const g = window.__GAME.state;
    return { phase: g.phase, round: g.round, gold: g.gold, units: g.units.length };
  })()`);
  check('结算后进入下一轮布防', nextRes.phase === 'prep' && nextRes.round === 2, JSON.stringify(nextRes));
  check('单位跨波保留（合成成果不清空）', nextRes.units >= 1, nextRes.units);
  await evalJS(`window.__GAME.state.speed = 1; true`);

  /* ---------- 3. 失败与重开路径 ---------- */
  const fail = await evalJS(`(() => {
    const G = window.__GAME, E = G.api;
    G.newRun(4242);
    const g = G.state;
    g.gold = 0; g.units = []; g.baseHp = 1;
    E.startCombat(g);
    return { phase: g.phase, hp: g.baseHp };
  })()`);
  check('可构造失败场景（空阵容 1 血）', fail.phase === 'combat' && fail.hp === 1, JSON.stringify(fail));

  let dead = null;
  for (let i = 0; i < 90; i++) {
    dead = await evalJS(`(() => { const g = window.__GAME.state; return { phase: g.phase, hp: g.baseHp, over: g.over, win: g.win, leaks: g.stats.leaks, title: (document.querySelector('#overlay h2') || {}).textContent || '' }; })()`);
    if (dead.over) break;
    await sleep(500);
  }
  check('空阵容会被打穿判负', dead.over === true && dead.hp <= 0, JSON.stringify(dead));
  check('失败浮层文案正确', /失守/.test(dead.title), dead.title);
  await shot('04-defeat.png');

  const restart = await evalJS(`(() => {
    const btn = document.querySelector('#mRestart');
    if (btn) btn.click();
    const g = window.__GAME.state;
    return { phase: g.phase, hp: g.baseHp, round: g.round, gold: g.gold, units: g.units.length, over: g.over };
  })()`);
  check('重开回到第 1 波满血布防', restart.phase === 'prep' && restart.hp === 15 && restart.round === 1 && restart.units === 0 && !restart.over, JSON.stringify(restart));

  /* ---------- 4. 规则浮层与窄屏布局 ---------- */
  const rulesOpen = await evalJS(`(() => {
    document.querySelector('#btnRules').click();
    const o = document.querySelector('#overlay');
    return { show: o.classList.contains('show'), hasTable: !!o.querySelector('table'), modal: window.__GAME.ui.modal };
  })()`);
  check('规则浮层可打开且含数值表', rulesOpen.show && rulesOpen.hasTable && rulesOpen.modal === 'rules', JSON.stringify(rulesOpen));
  await shot('05-rules.png');
  /* 关闭规则：第 1 波未购买会回到「开始」浮层，再点开始进入棋盘 */
  await evalJS(`document.querySelector('#mClose').click(); true`);
  await sleep(200);
  await evalJS(`(() => { const b = document.querySelector('#mStart'); if (b) b.click(); return true; })()`);
  await sleep(300);

  await send('Emulation.setDeviceMetricsOverride', { width: 414, height: 860, deviceScaleFactor: 2, mobile: true });
  await sleep(700);
  const narrow = await evalJS(`(() => {
    const cv = document.getElementById('cv');
    const r = cv.getBoundingClientRect();
    return { cvW: Math.round(r.width), cvH: Math.round(r.height), ratio: +(r.width / r.height).toFixed(3), shop: document.querySelectorAll('#shop .card').length, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
  })()`);
  check('窄屏不裁切（画布保持 1.923 比例、无横向溢出）', narrow.ratio > 1.85 && narrow.ratio < 2.0 && !narrow.overflowX, JSON.stringify(narrow));
  check('窄屏商店仍有 4 张卡', narrow.shop === 4, narrow.shop);
  await shot('06-mobile.png');

  proc.kill();
}

let fatal = null;
try { await main(); } catch (e) { fatal = e; try { proc.kill(); } catch (_) {} }

const fails = results.filter(r => !r.pass);
for (const r of results) console.log((r.pass ? 'ok   ' : 'FAIL ') + r.name + (r.note ? '   ' + r.note : ''));
if (fatal) console.log('FATAL ' + (fatal.message || fatal));
console.log('');
console.log(fails.length === 0 && !fatal ? 'TEST PASS' : `TEST ERROR (${fails.length} failed${fatal ? ' + fatal' : ''})`);
process.exit(fails.length === 0 && !fatal ? 0 : 1);
