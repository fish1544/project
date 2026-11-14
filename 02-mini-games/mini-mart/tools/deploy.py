import base64, json, os, sys, time, urllib.request, urllib.error

OWNER = "fish1544"
REPO = "mini-mart"
PROJECT = r"D:\Project\02-mini-games\mini-mart"
TOKEN = open(os.path.join(PROJECT, ".deploy_token"), encoding="utf-8").read().strip()
API = "https://api.github.com"

def call(method, path, data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(API + path, method=method, data=body)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "mini-mart-deploy")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw or b"{}")
        except Exception:
            return e.code, {"raw": raw.decode("utf-8", "ignore")[:200]}

SKIP_DIRS = {"_tmp", "node_modules", ".git"}
SKIP_FILES = {".deploy_token"}

files = []
for root, dirs, names in os.walk(PROJECT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for n in names:
        if n in SKIP_FILES:
            continue
        full = os.path.join(root, n)
        rel = os.path.relpath(full, PROJECT).replace("\\", "/")
        files.append((rel, full))

print("FILES_TO_UPLOAD:", len(files))

# 0) 确保仓库存在
st, repo_info = call("GET", f"/repos/{OWNER}/{REPO}")
if st == 404:
    st, repo_info = call("POST", "/user/repos", {
        "name": REPO,
        "description": "Mini Mart - simulation management game, AI illustration style",
        "private": False,
        "has_issues": True,
        "has_wiki": False,
        "auto_init": True,
    })
    print("REPO_CREATE:", st, (repo_info or {}).get("full_name"))
    time.sleep(2)

# 1) 仓库可见性 -> public（Pages 免费版需要）
st, repo_info = call("GET", f"/repos/{OWNER}/{REPO}")
if st == 200:
    print("REPO_VISIBILITY:", repo_info.get("visibility"))
    if repo_info.get("private"):
        st2, _ = call("PATCH", f"/repos/{OWNER}/{REPO}", {"private": False})
        print("SET_PUBLIC:", st2)
else:
    print("REPO_INFO_FAIL:", st, repo_info)

# 2) 逐文件上传
ok, fail = 0, []
for rel, full in files:
    with open(full, "rb") as f:
        content_b64 = base64.b64encode(f.read()).decode("ascii")
    # 获取已有 sha（存在则覆盖）
    st, cur = call("GET", f"/repos/{OWNER}/{REPO}/contents/{rel}?ref=main")
    payload = {"message": f"feat: add {rel}", "content": content_b64, "branch": "main"}
    if st == 200 and isinstance(cur, dict) and cur.get("sha"):
        payload["sha"] = cur["sha"]
    st, res = call("PUT", f"/repos/{OWNER}/{REPO}/contents/{rel}", payload)
    if st in (200, 201):
        ok += 1
        print(f"OK   {rel}")
    else:
        fail.append((rel, st, res.get("message") if isinstance(res, dict) else res))
        print(f"FAIL {rel} -> {st} {fail[-1][2]}")

print("UPLOADED:", ok, "FAILED:", len(fail))

# 3) 启用 GitHub Pages（main 分支根目录）
st, res = call("GET", f"/repos/{OWNER}/{REPO}/pages")
if st == 200:
    print("PAGES_ALREADY_ON:", res.get("html_url"), "status:", res.get("status"))
else:
    st2, res2 = call("POST", f"/repos/{OWNER}/{REPO}/pages", {"source": {"branch": "main", "path": "/"}})
    print("PAGES_CREATE:", st2, res2.get("html_url") if isinstance(res2, dict) else res2)

st, res = call("GET", f"/repos/{OWNER}/{REPO}/pages")
print("PAGES_STATE:", st, json.dumps({k: res.get(k) for k in ("html_url", "status", "cname", "build_type")}, ensure_ascii=False) if isinstance(res, dict) else res)
print("FAILED_LIST:", fail)
