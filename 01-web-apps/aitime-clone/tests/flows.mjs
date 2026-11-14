/* 端到端交互验收：真实点击驱动，验证录入/计时/目标/习惯/主题/统计
   用法：node tests/flows.mjs */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "_shots");
const BASE = process.env.BASE_URL || "http://127.0.0.1:8123/index.html";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9223;
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const check = (name, cond, extra) => results.push({ name, ok: !!cond, extra: extra ?? "" });

async function main() {
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=" + path.join(OUT, "profile-flow"),
    "--window-size=390,844", BASE,
  ], { stdio: "ignore" });

  let wsUrl;
  for (let i = 0; i < 40 && !wsUrl; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl;
    } catch { /* 等待 */ }
    await sleep(250);
  }
  if (!wsUrl) { chrome.kill(); throw new Error("调试端口未就绪"); }

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
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await new Promise((r) => (ws.onopen = r));
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const shot = async (n) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, n + ".png"), Buffer.from(r.data, "base64"));
  };
  const click = async (sel) => {
    const ok = await ev(`(function(){ const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return 'missing'; el.click(); return 'ok'; })()`);
    await sleep(300);
    return ok;
  };
  const screen = () => ev(`(document.querySelector('.screen.active')||{}).dataset?.screen || null`);

  await sleep(600);
  await ev(`localStorage.clear()`);
  await send("Page.reload");
  await sleep(900);

  /* 1. 新增一条记录 */
  check("点击＋进入添加页", (await click('.pb-main[data-act="pill-add"]')) === "ok");
  check("当前页面=add", (await screen()) === "add");
  await shot("flow-add");
  const durBefore = await ev(`document.getElementById('add-dur').textContent`);
  await click('[data-wheel-step="em"][data-step="1"]');
  const durAfter = await ev(`document.getElementById('add-dur').textContent`);
  check("滚轮调分后时长联动", durBefore !== durAfter, `${durBefore} -> ${durAfter}`);
  await click('[data-addcat="work"]');
  check("选中工作分类", await ev(`document.querySelector('[data-addcat="work"]').classList.contains('sel')`));
  await ev(`(function(){const i=document.getElementById('add-note'); i.value='测试备注'; i.dispatchEvent(new Event('input',{bubbles:true})); return true;})()`);
  await click('[data-act="add-save"]');
  await sleep(300);
  check("保存后回到时间页", (await screen()) === "home");
  const recText = await ev(`(document.querySelector('.rec-row')||document.querySelector('.rec')||{textContent:''}).textContent.trim()`);
  check("列表出现新记录", /工作/.test(recText), recText);
  check("已记录时长更新", /已记录：(?!0分钟)/.test(await ev(`document.querySelector('.home-top .hrow .rs').textContent`)), await ev(`document.querySelector('.home-top .hrow .rs').textContent`));
  await shot("flow-home-record");

  /* 2. 计时开始/结束 */
  await click('[data-act="pill-start"]');
  check("计时中标记", await ev(`document.getElementById('pillbar').classList.contains('running')`));
  await shot("flow-timer-running");
  await click('[data-act="pill-end"]');
  await sleep(300);
  check("结束计时后复原", !(await ev(`document.getElementById('pillbar').classList.contains('running')`)));

  /* 3. 目标 */
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

  /* 4. 习惯 */
  await click('[data-tab="habits"]');
  check("进入习惯页", (await screen()) === "habits");
  await click('[data-act="habit-add"]');
  check("进入选择习惯页", (await screen()) === "habitPick");
  await click('[data-preset="喝 水"]') || (await click(".hb-item"));
  const hbAny = await ev(`document.querySelectorAll('.hb-item').length`);
  check("习惯候选存在", hbAny > 0, "count=" + hbAny);
  await shot("flow-habit-pick");
  await click('[data-act="back"]');

  /* 5. 主题换色 */
  await click('[data-tab="mine"]');
  check("进入我的页", (await screen()) === "mine");
  await click('[data-act="theme"]');
  check("主题弹窗打开", await ev(`document.querySelectorAll('.dialog [data-theme]').length === 16`), await ev(`document.querySelectorAll('.dialog [data-theme]').length`));
  await shot("flow-theme");
  await click('[data-theme="#22afd2"]');
  const hdr = await ev(`getComputedStyle(document.querySelector('.screen.active .hd')).backgroundColor`);
  check("换主题后页头变色", hdr === "rgb(34, 175, 210)" || hdr.includes("34, 175, 210"), hdr);

  /* 6. 统计页 tab 与自定义区间 */
  await click('[data-tab="home"]');
  await click('[data-act="open-stats"]');
  check("进入统计页", (await screen()) === "stats");
  check("统计标题存在", /统计/.test(await ev(`document.querySelector('.screen.active .ttl').textContent`)));
  await click('[data-stab="week"]');
  await shot("flow-stats-week");
  await click('[data-stab="custom"]');
  check("自定义区间弹窗", await ev(`!!document.querySelector('.dialog')`));
  await shot("flow-stats-custom");

  /* 7. 图表页（统计页 ⋮ → 图表视图） */
  await ev(`document.querySelector('.dialog [data-cancel]')?.click()`);
  await click('[data-act="stats-menu"]');
  await ev(`(function(){ const items=[...document.querySelectorAll('.pop .pi')]; const t=items.find(i=>/图表/.test(i.textContent)); if(!t) return 'missing'; t.click(); return 'ok'; })()`);
  await sleep(400);
  check("进入图表页", (await screen()) === "chart");
  check("图表已渲染", await ev(`!!document.querySelector('.chart-svg svg')`));
  await shot("flow-chart");

  console.log(JSON.stringify({ results, errors }, null, 1));
  const failed = results.filter((r) => !r.ok);
  console.log(`通过 ${results.length - failed.length}/${results.length}`, failed.length ? "失败项: " + failed.map((f) => f.name).join("、") : "全部通过");
  ws.close(); chrome.kill();
  if (failed.length || errors.length) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
