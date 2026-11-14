/* 无头浏览器验收：控制台报错、布局溢出、关键页面截图
   用法：node tests/verify.mjs   （需先启动本地静态服务 + Chrome 远程调试） */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "_shots");
const URL_BASE = process.env.BASE_URL || "http://127.0.0.1:8123/index.html";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

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
      "--window-size=390,844",
      "--user-data-dir=" + path.join(OUT, "profile"),
      URL_BASE,
    ],
    { stdio: "ignore" }
  );

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {
      /* 等待启动 */
    }
    await sleep(250);
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
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
      errors.push("日志: " + m.params.entry.text);
    }
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
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send("Page.reload");
  await sleep(900);

  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };

  await sleep(800);

  const metrics = await evaluate(`(() => {
    const ph = document.getElementById('phone').getBoundingClientRect();
    const scr = document.querySelector('.screen.active');
    return {
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      phone: { x: Math.round(ph.x), w: Math.round(ph.width), h: Math.round(ph.height) },
      bodyScrollW: document.body.scrollWidth,
      hasActive: !!scr,
      screenName: scr && scr.dataset.screen,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  })()`);

  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(r.data, "base64"));
  };

  const screens = ["home", "stats", "chart", "add", "overview", "goals", "goalAdd", "schedule", "habits", "habitPick", "habitAdd", "mine", "settings", "categories", "dataSettings", "about", "perms", "yearview"];
  for (const s of screens) {
    await evaluate(`(function(){
      window.__APP.goRoot('${s}' === 'home' ? 'home' : 'home');
      ${s === "home" ? "" : `window.__APP.push('${s}', {form:{startMin:0,endMin:895,cat:'sleep',tab:'cat',note:''}, habitForm:{name:'',emoji:'🍅',color:'#e0a1b4',days:['周一','周二'],word:'坚持就是胜利'}});`}
      return true;
    })()`);
    await sleep(320);
    await shot(s);
  }

  for (const m of ["环形", "门形", "双环"]) {
    const ok = await evaluate(`(function(){
      window.__APP.goRoot('home');
      window.__APP.push('chart', {form:{}, habitForm:{}});
      const btn = Array.from(document.querySelectorAll('.hd-seg [data-cmode]')).find(b=>b.textContent.trim()==='${m}');
      if (!btn) return 'no-btn';
      btn.click();
      const active = document.querySelector('.hd-seg button.on');
      return {mode: active && active.textContent.trim(), svg: !!document.querySelector('.chart-svg svg')};
    })()`);
    await sleep(320);
    await shot("chart-" + (m === "环形" ? "ring" : m === "门形" ? "gate" : "twin"));
    console.log(m, JSON.stringify(ok));
    if (m === "环形") {
      const svg = await evaluate(`document.querySelector('.chart-svg svg').outerHTML`);
      console.log("SVG:", svg.replace(/\s+/g, " ").slice(0, 1200));
    }
  }

  const summary = { metrics, errors };
  console.log(JSON.stringify(summary, null, 1));
  ws.close();
  chrome.kill();
  if (errors.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
