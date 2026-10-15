# -*- coding: utf-8 -*-
"""测试 upload map 解析；成功则把 map 写入 run.json 收据并继续 deliver。"""
import io, re, subprocess, sys, json

BASE = r"D:\Project\ui-design-runs\全面重构对现有线上网页应-20260919-174101-8bf6"
SCRIPTS = r"C:\Users\zhy\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.skills\doubao-ui-design\scripts"

UPLOAD = re.compile(r'\{[^{}]*"uri"\s*:\s*"([^"]+)"[^{}]*\}')
UPLOAD_PATH = re.compile(r'"path"\s*:\s*"([^"]+)"')

raw = io.open(BASE + r"\_upload_map.txt", encoding="utf-8").read()
out = {}
for m in UPLOAD.finditer(raw):
    mp = UPLOAD_PATH.search(m.group(0))
    if mp:
        out[mp.group(1)] = m.group(1)
print("parsed", len(out))
for k, v in out.items():
    print(v, "<-", k)

if not out:
    sys.exit(1)

# 交给 deliver.py：把返回原文形态拼回一行串
payload = "".join('{"uri":"%s","path":"%s"}' % (v, k) for k, v in out.items())
r = subprocess.run(
    [sys.executable, SCRIPTS + r"\deliver.py", "--run", BASE + r"\run.json", "--upload-map", payload],
    capture_output=True, text=True, encoding="utf-8")
print(r.stdout)
if r.returncode:
    print(r.stderr)
    sys.exit(r.returncode)
