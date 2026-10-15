// cdp-run.mjs — 通过 Chrome DevTools 协议驱动无头浏览器加载指定 HTML，轮询页面 body 文本
// 用法: node cdp-run.mjs <html绝对路径>
// Chrome 路径: 优先 process.env.CHROME_PATH（GitHub Actions 由 setup-chrome 提供），否则 Windows 默认
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PORT = 9500 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), 'mm-cdp-'));
const htmlPath = process.argv[2];
if (!htmlPath) { console.error('usage: node cdp-run.mjs <htmlPath>'); process.exit(2); }
const url = pathToFileURL(htmlPath).href;
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const proc = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking',
  '--no-sandbox', '--disable-dev-shm-usage',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${PORT}`, 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page) return page;
    } catch (e) {}
    await sleep(250);
  }
  throw new Error('CDP not reachable');
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, (msg) => msg.error ? reject(new Error(method + ': ' + JSON.stringify(msg.error))) : resolve(msg.result));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

async function run() {
  let out = '';
  try {
    const target = await getTarget();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    const send = cdp(ws);
    await send('Page.enable');
    await send('Page.navigate', { url });
    for (let i = 0; i < 90; i++) {
      await sleep(1000);
      try {
        const r = await send('Runtime.evaluate', { expression: 'document.body ? document.body.innerText : ""', returnByValue: true });
        out = r.result && r.result.value ? String(r.result.value) : '';
        if (out.includes('TEST PASS') || out.includes('TEST ERROR') || out.includes('TINY TEST')) break;
      } catch (e) { /* page may be navigating */ }
    }
  } catch (e) {
    out = 'CDP RUN ERROR: ' + (e && e.message || e);
  } finally {
    try { proc.kill(); } catch (e) {}
  }
  return out;
}

const result = await run();
console.log(result || '(no output captured)');
const pass = result.includes('TEST PASS') || (result.includes('TINY TEST') && !result.includes('ERR '));
process.exit(pass ? 0 : 1);
