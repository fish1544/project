import asyncio, json
from playwright.async_api import async_playwright

STATE_SEL = ("[role=tab],[aria-selected],[data-tab],[data-view],[data-target],"
             "[data-screen-to],.tab,.tabs>*,nav button,nav a,"
             "button,a[href^='#'],[role=button]")

SIG = """ () => {
  const vh = innerHeight, vw = innerWidth;
  const parts = [];
  document.querySelectorAll('*').forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.top > vh || r.bottom < 0
        || r.left > vw || r.right < 0) return;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return;
    parts.push(Math.round(r.top) + ',' + Math.round(r.left) + ','
             + Math.round(r.width) + ',' + Math.round(r.height)
             + ',' + cs.backgroundColor);
  });
  return parts.join('|') + '##' + (document.body.innerText || '').slice(0, 4000);
}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        await pg.goto("http://localhost:8910/index.html", wait_until="networkidle")
        await pg.wait_for_timeout(600)
        before = await pg.evaluate(SIG)
        els = await pg.query_selector_all(STATE_SEL)
        n = len(els)
        print("candidates:", n)
        for i in range(min(n, 14)):
            el = els[i]
            try:
                vis = await el.is_visible()
                box = await el.bounding_box()
                tag = await el.evaluate("e => e.tagName + '.' + (e.className || '').toString().slice(0,40)")
                if not vis or not box or box["width"] < 20 or box["height"] < 20:
                    print(f"[{i}] SKIP {tag} vis={vis} box={box}")
                    continue
                await el.click(timeout=1500, force=True)
                await pg.wait_for_timeout(500)
                after = await pg.evaluate(SIG)
                changed = after != before
                print(f"[{i}] CLICK {tag} -> changed={changed}")
                before = after
            except Exception as e:
                print(f"[{i}] EXC {type(e).__name__}: {str(e)[:90]}")
        print("pageerrors:", errs[:8])
        await b.close()

asyncio.run(main())
