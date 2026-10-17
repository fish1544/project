// run-tests.mjs — CI/本地统一测试入口：构建 2 份测试页并依次用 CDP 无头运行，全部通过才退出 0
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from './build-test.mjs';

const ROOT = process.cwd();
const INDEX = join(ROOT, 'index.html');
const tmp = mkdtempSync(join(tmpdir(), 'mm-tests-'));
const deep = join(tmp, 'test.html');
const tiny = join(tmp, 'test2.html');

build(INDEX, deep, 'deep');
build(INDEX, tiny, 'tiny');
console.log('built test pages');

function runCdp(html) {
  const out = execFileSync(process.execPath, [join(ROOT, 'tests', 'cdp-run.mjs'), html], { encoding: 'utf8', timeout: 180000 });
  console.log(out);
  return out;
}

let failed = 0;

// 深度测试
console.log('===== DEEP TEST =====');
const deepOut = runCdp(deep);
if (!deepOut.includes('TEST PASS')) { console.error('DEEP TEST FAILED'); failed = 1; }

// 微测试
console.log('===== TINY TEST =====');
const tinyOut = runCdp(tiny);
if (!tinyOut.includes('TINY TEST') || tinyOut.includes('ERR ')) { console.error('TINY TEST FAILED'); failed = 1; }

if (failed) {
  console.error('TESTS NOT ALL PASSED');
  process.exit(1);
}
console.log('ALL TESTS PASSED');
process.exit(0);
