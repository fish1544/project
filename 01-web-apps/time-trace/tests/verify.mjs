/* 无头验收（像素 + 结构）：控制台无报错、无横向溢出、逐屏截图、DOM 有界。
   用法：node tests/verify.mjs   （需先启动本地静态服务，默认 http://127.0.0.1:8123/index.html） */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "_shots");
const BASE = process.env.BASE_URL || "http://127.0.0.1:8123/index.html";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = Number(process.env.CDP_PORT || 9222);

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--remote-debugging-port=${PORT}`,
      "--user-data-dir=" + path.join(OUT, "profile"),
      "--window-size=390,844",
      BASE,
    ],
    { stdio: "ignore" }
  );

  let wsUrl = null;
  for (let i = 0; i < 40 && !wsUrl; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl || null;
    } catch {
      /* 等待启动 */
    }
    if (!wsUrl) await sleep(250);
  }
  if (!wsUrl) {
    chrome.kill();
    throw new Error("无法连接 Chrome 调试端口");
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
    if (m.method === "Runtime.exceptionThrown") {
      errors.push("异常: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    }
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push("日志: " + m.params.entry.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
      errors.push("console: " + m.params.args.map((a) => a.value || a.description || "").join(" "));
    }
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
  /* 在文档脚本之前清一次存储：保证每轮截图都从空数据开始，不受上一轮残留影响 */
  const { identifier: clearId } = await send("Page.addScriptToEvaluateOnNewDocument", { source: "try { localStorage.clear(); } catch (e) {}" });
  await send("Page.reload");
  await sleep(1000);
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: clearId });
  await send("Page.reload");
  await sleep(1000);

  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(r.data, "base64"));
  };

  const metrics = await ev(`(() => {
    const phone = document.getElementById('phone').getBoundingClientRect();
    const active = document.querySelector('.screen.active');
    return {
      title: document.title,
      ready: !!window.APP_READY,
      schema: window.TJ.store.state.schema,
      storageKey: window.TJ.STORAGE_KEY,
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      phone: { x: Math.round(phone.x), w: Math.round(phone.width), h: Math.round(phone.height) },
      bodyScrollW: document.body.scrollWidth,
      active: active ? active.dataset.screen : null,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  })()`);

  const screens = [
    "home", "stats", "chart", "add", "overview", "goals", "goalAdd", "schedule",
    "habits", "habitPick", "habitAdd", "mine", "settings", "categories", "dataSettings",
    "about", "perms", "yearview", "weekview", "night", "search", "annual", "modules", "works",
  ];

  for (const name of screens) {
    await ev(`(function () {
      window.__APP.goRoot('home');
      window.__APP.push(${JSON.stringify(name)}, {
        form: { startMin: 0, endMin: 895, cat: 'sleep', tab: 'cat', note: '' },
        habitForm: { name: '', emoji: '🍅', color: '#e0a1b4', days: ['周一', '周二'], word: '坚持就是胜利' }
      });
      return true;
    })()`);
    await sleep(340);
    await shot(name);
  }

  /* 三种图表形态（先灌两条记录，让色环与图例都有内容） */
  await ev(`(function () {
    const T = window.TJ;
    window.__APP.store.addRecord({ date: T.todayKey(), cat: 'work', start: 0, end: 300, note: '图表取样' });
    window.__APP.store.addRecord({ date: T.todayKey(), cat: 'study', start: 300, end: 480, note: '' });
    return true;
  })()`);
  const chartStates = [];
  for (const [mode, file] of [["环形", "chart-ring"], ["门形", "chart-gate"], ["双环", "chart-twin"]]) {
    const state = await ev(`(function () {
      window.__APP.goRoot('home');
      window.__APP.push('chart', {});
      const btn = Array.from(document.querySelectorAll('.hd-seg [data-cmode]')).find((b) => b.textContent.trim() === ${JSON.stringify(mode)});
      if (!btn) return { error: 'no-button' };
      btn.click();
      const active = document.querySelector('.hd-seg button.on');
      const svg = document.querySelector('.chart-svg svg');
      return {
        mode: active && active.textContent.trim(),
        circles: svg ? svg.querySelectorAll('circle').length : 0,
        ticks: svg ? svg.querySelectorAll('line').length : 0,
        labels: svg ? svg.querySelectorAll('text').length : 0,
      };
    })()`);
    chartStates.push({ mode, ...state });
    await sleep(340);
    await shot(file);
  }

  /* DOM 有界：连续打开 10 屏后，文档里最多 3 个 .screen */
  const domBound = await ev(`(function () {
    window.__APP.goRoot('home');
    ['stats', 'chart', 'add', 'overview', 'goals', 'goalAdd', 'schedule', 'habits', 'habitPick', 'habitAdd'].forEach((n) => window.__APP.push(n, {}));
    return { mounted: document.querySelectorAll('.screen').length, stack: window.__APP.stack().length };
  })()`);

  console.log(JSON.stringify({ metrics, chartStates, domBound, errors }, null, 1));
  ws.close();
  chrome.kill();

  const fail = [];
  if (errors.length) fail.push("控制台报错 " + errors.length + " 条");
  if (!metrics.ready) fail.push("APP_READY 未置位");
  if (metrics.schema !== 2) fail.push("schema 不是 2");
  if (metrics.overflowX) fail.push("存在横向溢出");
  if (metrics.phone.w !== 390 || metrics.phone.h !== 844) fail.push("手机容器尺寸异常 " + JSON.stringify(metrics.phone));
  if (domBound.mounted > 3) fail.push("DOM 屏幕未回收：mounted=" + domBound.mounted);
  chartStates.forEach((c) => {
    if (!c.circles || c.circles < 3) fail.push(c.mode + " 图表未画出分类色环：" + c.circles);
    if (!c.ticks || c.ticks < 24) fail.push(c.mode + " 图表刻度缺失：" + c.ticks);
  });

  if (fail.length) {
    console.log("FAIL: " + fail.join(" | "));
    process.exitCode = 1;
  } else {
    console.log("verify 通过：无报错 / 无溢出 / 24 屏截图 / 图表三形态 / DOM 有界(" + domBound.mounted + " 屏)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
