import asyncio, json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 390, "height": 844})
        await pg.goto("http://localhost:8910/index.html", wait_until="networkidle")
        await pg.wait_for_timeout(800)
        info = await pg.evaluate("""() => {
          const out = [];
          document.querySelectorAll('img').forEach(im => {
            out.push({src: im.getAttribute('src'), natural: im.naturalWidth, h: im.clientHeight, w: im.clientWidth});
          });
          return out;
        }""")
        print(json.dumps(info, ensure_ascii=False, indent=1))
        await b.close()

asyncio.run(main())
