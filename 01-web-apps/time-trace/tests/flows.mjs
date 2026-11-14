/* 端到端 + 内部逻辑验收：真实点击驱动，兼顾数据层/安全/性能断言。
   用法：node tests/flows.mjs */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "_shots");
const BASE = process.env.BASE_URL || "http://127.0.0.1:8123/index.html";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9223);

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const check = (name, ok, extra = "") => results.push({ name, ok: !!ok, extra: String(extra) });

async function main() {
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + path.join(OUT, "profile-flow"),
      "--window-size=390,844",
      BASE,
    ],
    { stdio: "ignore" }
  );

  let wsUrl;
  for (let i = 0; i < 40 && !wsUrl; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl;
    } catch {
      /* 等待 */
    }
    if (!wsUrl) await sleep(250);
  }
  if (!wsUrl) {
    chrome.kill();
    throw new Error("调试端口未就绪");
  }

  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const errors = [];
  let seq = 0;

  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      return;
    }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text);
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(r.data, "base64"));
  };
  const click = async (selector) => {
    const state = await ev(`(function () {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return 'missing';
      el.click();
      return 'ok';
    })()`);
    await sleep(300);
    return state;
  };
  const screen = () => ev(`(document.querySelector('.screen.active') || { dataset: {} }).dataset.screen || null`);
  /* 首屏与刷新期间注入脚本，避免上一轮的 pagehide flush 把 clear 后的存储又写回旧值 */
  const addInitScript = async (source) => {
    const r = await send("Page.addScriptToEvaluateOnNewDocument", { source });
    return r.identifier;
  };
  const dropInitScript = async (identifier) => {
    if (identifier) await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  };
  const reload = async () => {
    await send("Page.reload");
    for (let i = 0; i < 40; i++) {
      await sleep(150);
      if (await ev(`!!window.APP_READY`)) break;
    }
    await sleep(300);
  };

  const clearOnce = await addInitScript(`try { localStorage.clear(); } catch (e) {}`);
  await reload();
  await dropInitScript(clearOnce);
  await reload();

  /* 1. 五个 tab 互相可达 */
  for (const [tab, name] of [["goals", "goals"], ["schedule", "schedule"], ["habits", "habits"], ["mine", "mine"], ["home", "home"]]) {
    await click(`[data-tab="${tab}"]`);
    check(`tab 切换 → ${name}`, (await screen()) === name, await screen());
  }

  /* 2. 新增记录（含 XSS 载荷） */
  check("点击＋进入添加页", (await click('.pb-main[data-act="pill-add"]')) === "ok");
  check("当前页面=add", (await screen()) === "add");
  await shot("flow-add");
  const before = await ev(`document.getElementById('add-dur').textContent`);
  await click('[data-wheel-step="em"][data-step="1"]');
  check("滚轮调分后时长联动", before !== (await ev(`document.getElementById('add-dur').textContent`)), before);
  await click('[data-addcat="work"]');
  check("选中工作分类", await ev(`document.querySelector('[data-addcat="work"]').classList.contains('sel')`));
  const payload = `<img src=x onerror="window.__xss=1">备注`;
  await ev(`(function () {
    const input = document.getElementById('add-note');
    input.value = ${JSON.stringify(payload)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await click('[data-act="add-save"]');
  await sleep(300);
  check("保存后回到时间页", (await screen()) === "home");
  const noteText = await ev(`(document.querySelector('.screen.active .rc-2') || { textContent: '' }).textContent`);
  const injected = await ev(`document.querySelectorAll('.screen.active .rec img').length !== 0 || !!window.__xss`);
  check("备注按纯文本渲染（转义生效）", noteText === payload && !injected, noteText.slice(0, 24));
  const recLine = await ev(`(document.querySelector('.screen.active .home-top .hrow .rs') || { textContent: '' }).textContent.trim()`);
  check("已记录时长更新", /已记录：(?!0分钟)/.test(recLine), recLine);
  await shot("flow-home-record");

  /* 3. 计时开始 / 结束 */
  await click('[data-act="pill-start"]');
  check("计时中标记", await ev(`document.getElementById('pillbar').classList.contains('running')`));
  await shot("flow-timer-running");
  const runningText = await ev(`document.querySelector('[data-live="timer"]').textContent`);
  check("计时胶囊显示分钟数", /分钟$/.test(runningText) || /^\d+分钟$/.test(runningText), runningText);
  await click('[data-act="pill-end"]');
  await sleep(300);
  check("结束计时后复原", !(await ev(`document.getElementById('pillbar').classList.contains('running')`)));
  check("结束计时写入记录", (await ev(`window.__APP.store.state.records.length`)) >= 2);

  /* 4. 持久化结构 */
  const stored = await ev(`JSON.parse(localStorage.getItem(window.TJ.STORAGE_KEY) || '{}')`);
  check("落盘带 schema 版本", stored.schema === 2, stored.schema);
  check("落盘带 savedAt", typeof stored.savedAt === "number");
  check("落盘数据含记录", Array.isArray(stored.data?.records) && stored.data.records.length >= 2, stored.data?.records?.length);

  /* 5. 刷新后数据仍在 */
  await reload();
  check("刷新后记录保留", (await ev(`window.__APP.store.state.records.length`)) >= 2);
  check("刷新后首页仍有记录行", (await ev(`document.querySelectorAll('.rec').length`)) >= 1);

  /* 6. 目标 */
  await click('[data-tab="goals"]');
  check("进入目标页", (await screen()) === "goals");
  await click('[data-act="goal-add"]');
  check("进入添加目标页", (await screen()) === "goalAdd");
  await shot("flow-goal-add");
  await click('[data-act="goal-save"]');
  await sleep(300);
  check("目标保存后回到目标页", (await screen()) === "goals");
  check("目标卡片出现", await ev(`document.querySelectorAll('.goal-card').length > 0`));
  await shot("flow-goals");

  /* 7. 习惯 */
  await click('[data-tab="habits"]');
  check("进入习惯页", (await screen()) === "habits");
  await click('[data-act="habit-add"]');
  check("进入选择习惯页", (await screen()) === "habitPick");
  check("习惯候选项存在", (await ev(`document.querySelectorAll('.hb-item').length`)) > 0, await ev(`document.querySelectorAll('.hb-item').length`));
  await shot("flow-habit-pick");
  await click(".hb-item");
  await sleep(200);
  check("选中预设后进入添加习惯页", (await screen()) === "habitAdd", await screen());
  check("预设名称已回填", (await ev(`(document.getElementById('habit-name') || {}).value || ''`)).length > 0);
  await click("[data-hday='周一']");
  await click('[data-act="habit-save"]');
  await sleep(400);
  check("习惯保存后回到习惯页", (await screen()) === "habits");
  check("习惯写入数据", (await ev(`window.__APP.store.state.habits.length`)) === 1);

  /* 8. 主题换色 */
  await click('[data-tab="mine"]');
  check("进入我的页", (await screen()) === "mine");
  await click('[data-act="theme"]');
  check("主题弹窗 16 色", (await ev(`document.querySelectorAll('.dialog [data-theme]').length`)) === 16);
  await shot("flow-theme");
  await click('[data-theme="#22afd2"]');
  check("换主题后页头变色", /34, 175, 210/.test(await ev(`getComputedStyle(document.querySelector('.screen.active .hd')).backgroundColor`)));

  /* 9. 统计 / 自定义区间 */
  await click('[data-tab="home"]');
  await click('[data-act="open-stats"]');
  check("进入统计页", (await screen()) === "stats");
  check("统计标题存在", /统计/.test(await ev(`document.querySelector('.screen.active .ttl').textContent`)));
  await click('[data-stab="week"]');
  await shot("flow-stats-week");
  await click('[data-stab="custom"]');
  check("自定义区间弹窗", await ev(`!!document.querySelector('.dialog')`));
  await shot("flow-stats-custom");
  await ev(`document.querySelector('.dialog [data-cancel]').click()`);

  /* 10. 图表三形态 */
  await click('[data-act="stats-menu"]');
  await ev(`(function () {
    const items = Array.from(document.querySelectorAll('.pop .pi'));
    const target = items.find((i) => /图表/.test(i.textContent));
    if (target) target.click();
    return !!target;
  })()`);
  await sleep(400);
  check("进入图表页", (await screen()) === "chart");
  check("图表已渲染", await ev(`!!document.querySelector('.screen.active .chart-svg svg')`));
  for (const [mode, label] of [["门形", "gate"], ["双环", "twin"], ["环形", "ring"]]) {
    const clicked = await ev(`(function () {
      const root = document.querySelector('.screen.active');
      const btn = Array.from(root.querySelectorAll('[data-cmode]')).find((b) => b.textContent.trim() === ${JSON.stringify(mode)});
      if (!btn) return 'missing';
      btn.click();
      return 'ok';
    })()`);
    await sleep(320);
    const info = await ev(`(function () {
      const root = document.querySelector('.screen.active');
      const svg = root.querySelector('.chart-svg svg');
      const on = Array.from(root.querySelectorAll('[data-cmode]')).find((b) => b.classList.contains('on'));
      return { on: (on || {}).textContent, circles: svg ? svg.querySelectorAll('circle').length : 0 };
    })()`);
    check(`图表切换 ${mode}`, clicked === "ok" && info.on === mode && info.circles >= 3, JSON.stringify({ clicked, ...info }));
    await shot(`flow-chart-${label}`);
  }

  /* 11. 内部逻辑（纯函数与数据层） */
  const internals = await ev(`(function () {
    const C = window.TJCore, T = window.TJ;
    return {
      crossMidnight: C.normalizeRange({ start: 1380, end: 60 }),
      sameMinute: C.normalizeRange({ start: 600, end: 600 }),
      escape: C.escapeHtml('<b>"x"&' + String.fromCharCode(39)),
      uidUnique: (() => { const set = new Set(); for (let i = 0; i < 500; i++) set.add(C.uid('t')); return set.size; })(),
      keyInvalid: C.isValidKey('2026-13-40'),
      revisionBefore: T.store.revision,
      records: T.store.state.records.length,
      schema: T.store.state.schema,
    };
  })()`);
  check("跨零点区间 = 120 分钟", internals.crossMidnight.len === 120, JSON.stringify(internals.crossMidnight));
  check("起止相同按整天 1440", internals.sameMinute.len === 1440);
  check("转义覆盖引号与尖括号", internals.escape === "&lt;b&gt;&quot;x&quot;&amp;&#39;", internals.escape);
  check("id 生成不重复(500 次)", internals.uidUnique === 500, internals.uidUnique);
  check("非法日期被识别", internals.keyInvalid === false);

  /* 12. 变更会推进 revision 并同步选择器结果 */
  const revTest = await ev(`(function () {
    const T = window.TJ;
    const before = T.revision;
    const dateKey = T.todayKey();
    const beforeRecords = T.recordsOf(dateKey).length;
    const added = window.__APP.store.addRecord({ date: dateKey, cat: 'study', start: 600, end: 660, note: 'rev' });
    const sum = T.daySummary(dateKey);
    return {
      before, after: T.revision, beforeRecords,
      afterRecords: T.recordsOf(dateKey).length,
      added: !!added,
      rec: sum.rec,
      onDate: T.recordsOf(dateKey).map((r) => [r.start, r.end]),
    };
  })()`);
  check("写操作推进 revision", revTest.after > revTest.before, `${revTest.before} -> ${revTest.after}`);
  check("选择器随 revision 刷新", revTest.afterRecords === revTest.beforeRecords + 1, `${revTest.beforeRecords} -> ${revTest.afterRecords}`);
  check("日汇总计入新记录", revTest.rec >= 60, JSON.stringify({ rec: revTest.rec, onDate: revTest.onDate }));

  /* 13. DOM 有界（路由回收） */
  const bound = await ev(`(function () {
    window.__APP.goRoot('home');
    ['stats', 'chart', 'add', 'overview', 'goals', 'goalAdd'].forEach((n) => window.__APP.push(n, {}));
    return document.querySelectorAll('.screen').length;
  })()`);
  check("旧屏幕节点被回收(≤3)", bound <= 3, "mounted=" + bound);
  await ev(`window.__APP.goRoot('home')`);

  /* 14. 脏数据自愈：注入坏 storage 后重载不崩、坏记录被丢弃 */
  await ev(`(function () {
    localStorage.setItem(window.TJ.STORAGE_KEY, JSON.stringify({
      schema: 1,
      data: {
        theme: 'not-a-color',
        records: [
          { id: 'a', date: '2026-13-40', cat: 'work', start: 1, end: 2 },
          { id: 'b', date: window.TJ.todayKey(), cat: '不存在', start: 'x', end: 30 },
          { id: 'b', date: window.TJ.todayKey(), cat: 'study', start: 60, end: 90 }
        ],
        categories: 'broken',
        settings: { chartList: 'yes' }
      }
    }));
    return true;
  })()`);
  const dirties = await addInitScript(`(function () {
    try {
      localStorage.setItem(${JSON.stringify("time-trace:v2")}, JSON.stringify({
        schema: 1,
        data: {
          theme: 'not-a-color',
          records: [
            { id: 'a', date: '2026-13-40', cat: 'work', start: 1, end: 2 },
            { id: 'b', date: '2026-11-14', cat: 'no-such-cat', start: 'x', end: 30 },
            { id: 'b', date: '2026-11-14', cat: 'study', start: 60, end: 90 }
          ],
          categories: 'broken',
          settings: { chartList: 'yes' }
        }
      }));
    } catch (e) {}
  })()`);
  await reload();
  await dropInitScript(dirties);
  const healed = await ev(`(function () {
    const s = window.TJ.store.state;
    const ids = s.records.map((r) => r.id);
    return {
      booted: !!window.APP_READY,
      records: s.records.length,
      theme: s.theme,
      categories: s.categories.length,
      chartList: s.settings.chartList,
      catKnown: s.records.every((r) => s.categories.some((c) => c.id === r.cat)),
      idsUnique: ids.length === new Set(ids).size,
    };
  })()`);
  check("脏数据重载不崩", healed.booted);
  check("非法日期记录被丢弃", healed.records === 2, "records=" + healed.records);
  check("非法分类回落到「其他」", healed.catKnown);
  check("重复 id 被重新分配", healed.idsUnique);
  check("非法主题回落到默认", healed.theme === "#72b7d2", healed.theme);
  check("分类被修复为 7 个基础项", healed.categories === 7, healed.categories);
  check("布尔设置被纠正", healed.chartList === true);

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ results, errors }, null, 1));
  console.log(`通过 ${results.length - failed.length}/${results.length}`, failed.length ? "失败项: " + failed.map((f) => f.name).join("、") : "全部通过");

  ws.close();
  chrome.kill();
  if (failed.length || errors.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
