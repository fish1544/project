import ctypes, ctypes.wintypes as wt, json, base64, urllib.request, time, os

class CRED(ctypes.Structure):
    _fields_ = [("Flags",wt.DWORD),("Type",wt.DWORD),("TargetName",wt.LPWSTR),
        ("Comment",wt.LPWSTR),("LastWritten",wt.FILETIME),
        ("CredentialBlobSize",wt.DWORD),("CredentialBlob",ctypes.POINTER(ctypes.c_byte)),
        ("Persist",wt.DWORD),("AttributeCount",wt.DWORD),("Attributes",ctypes.c_void_p),
        ("TargetAlias",wt.LPWSTR),("UserName",wt.LPWSTR)]

advapi32 = ctypes.windll.advapi32
cred = ctypes.POINTER(CRED)()
advapi32.CredReadW("gh:github.com:fish1544", 1, 0, ctypes.byref(cred))
token = ctypes.string_at(cred.contents.CredentialBlob, cred.contents.CredentialBlobSize).decode("utf-8")
advapi32.CredFree(cred)

def gh(method, url, data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", "token " + token)
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("User-Agent", "fish1544")
    if data:
        req.data = json.dumps(data).encode("utf-8")
    for attempt in range(3):
        try:
            resp = urllib.request.urlopen(req, timeout=60)
            return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()[:300]
            print(f"  HTTP {e.code}: {body[:200]}")
            return None
        except Exception as e:
            print(f"  Attempt {attempt+1}: {e}")
            time.sleep(2)
    return None

# 1. Push HTML
print("1. Pushing index.html...")
with open(r"D:\Project\02-mini-games\frozen-reincarnation\index.html", "r", encoding="utf-8") as f:
    html = f.read()
html_b64 = base64.b64encode(html.encode("utf-8")).decode("utf-8")
info = gh("GET", "https://api.github.com/repos/fish1544/frozen-reincarnation/contents/index.html")
sha = info["sha"] if info else None
patch = {"message": "v3.3：异兽/宠物图片+战斗可视化+滚动修复", "content": html_b64, "branch": "main"}
if sha: patch["sha"] = sha
result = gh("PUT", "https://api.github.com/repos/fish1544/frozen-reincarnation/contents/index.html", patch)
if result: print(f"   HTML OK: {result['commit']['sha'][:12]}")

# 2. Push images
for img in ["city.jpg", "bunker.jpg", "blizzard.jpg", "beast_wolf.jpg", "beast_bear.jpg", "beast_scorpion.jpg", "pet_wolf.jpg", "pet_fox.jpg", "pet_bear.jpg", "scene_suburb.jpg", "scene_city.jpg", "scene_deep.jpg", "loc_supermarket.jpg", "loc_pharmacy.jpg", "loc_construction.jpg", "loc_gas.jpg"]:
    img_path = rf"D:\Project\02-mini-games\frozen-reincarnation\assets\{img}"
    print(f"2. Pushing assets/{img}...")
    with open(img_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("utf-8")
    api_url = f"https://api.github.com/repos/fish1544/frozen-reincarnation/contents/assets/{img}"
    existing = gh("GET", api_url)
    img_sha = existing["sha"] if existing else None
    p = {"message": f"add bg image {img}", "content": img_b64, "branch": "main"}
    if img_sha: p["sha"] = img_sha
    r = gh("PUT", api_url, p)
    if r: print(f"   {img} OK")
