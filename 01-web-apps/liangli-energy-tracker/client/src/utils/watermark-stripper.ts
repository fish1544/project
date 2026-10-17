const WATERMARK_KEYWORDS = [
  'watermark',
  'Watermark',
  'WATERMARK',
  'miaoda',
  'Miaoda',
  'MIODA',
  '妙搭',
  '豆包',
  'doubao',
  'Doubao',
  'DOUBAO',
  'powered-by',
  'poweredBy',
  'powered_by',
  'PoweredBy',
  'suda',
  'platform-logo',
  'brand-mark',
  'byte-dance',
  'byteDance',
];

const WATERMARK_TEXT_PATTERNS = [
  /妙搭/i,
  /miaoda/i,
  /豆包/i,
  /doubao/i,
  /powered by/i,
  /powered\s*by/i,
  /由.*生成/i,
  /工作生成/i,
  /豆包.*/i,
];

function isWatermarkNode(el: Element): boolean {
  const cls = el.className;
  const id = el.id || '';
  const clsStr = typeof cls === 'string' ? cls : '';

  for (const kw of WATERMARK_KEYWORDS) {
    if (clsStr.includes(kw) || id.includes(kw)) return true;
  }

  const styleAttr = el.getAttribute('style') || '';
  if (styleAttr.includes('watermark')) return true;

  const customEl = el.getAttribute('data-custom-element') || '';
  if (customEl.includes('watermark') || customEl.includes('Watermark')) return true;

  const tagName = el.tagName.toLowerCase();
  const computedPos = window.getComputedStyle(el).position;
  const isFixedOrAbsolute =
    (el as HTMLElement).style.position === 'fixed' ||
    (el as HTMLElement).style.position === 'absolute' ||
    computedPos === 'fixed' ||
    computedPos === 'absolute';

  const text = (el.textContent || '').trim();

  if (['div', 'span', 'p', 'a', 'section', 'aside', 'footer'].includes(tagName)) {
    if (
      isFixedOrAbsolute &&
      text.length > 0 &&
      text.length < 100 &&
      WATERMARK_TEXT_PATTERNS.some((p) => p.test(text))
    ) {
      return true;
    }
  }

  if (tagName === 'canvas' || tagName === 'img' || tagName === 'svg') {
    if (isFixedOrAbsolute) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isCorner =
        (rect.right >= vw - 200 && rect.bottom >= vh - 100) ||
        (rect.left <= 200 && rect.bottom >= vh - 100) ||
        (rect.right >= vw - 200 && rect.top <= 100) ||
        (rect.left <= 200 && rect.top <= 100);
      if (isCorner && rect.width < 300 && rect.height < 120) {
        return true;
      }
    }
  }

  return false;
}

function removeWatermarks(root: ParentNode = document.body): number {
  let count = 0;
  const allElements = root.querySelectorAll('*');
  allElements.forEach((el) => {
    if (isWatermarkNode(el)) {
      el.remove();
      count++;
    }
  });
  return count;
}

function removeFromHead(): void {
  const styleEls = document.querySelectorAll('style');
  styleEls.forEach((el) => {
    const text = el.textContent || '';
    if (WATERMARK_KEYWORDS.some((kw) => text.includes(kw))) {
      el.remove();
    }
  });
}

let observer: MutationObserver | null = null;

export function startWatermarkStripper(): () => void {
  const run = () => {
    removeFromHead();
    if (document.body) removeWatermarks(document.body);
    if (document.documentElement) removeWatermarks(document.documentElement);
  };

  run();

  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    let needsFullScan = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (isWatermarkNode(el)) {
              el.remove();
            } else {
              const removed = removeWatermarks(el);
              if (removed > 0) return;
            }
          }
        });
      } else if (mutation.type === 'attributes') {
        const el = mutation.target as Element;
        if (isWatermarkNode(el)) {
          el.remove();
        }
      }
    }
    if (needsFullScan) run();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id', 'style'],
  });

  const intervalId = window.setInterval(run, 800);

  const domContentHandler = () => run();
  document.addEventListener('DOMContentLoaded', domContentHandler);

  const loadHandler = () => {
    run();
    setTimeout(run, 500);
    setTimeout(run, 2000);
  };
  window.addEventListener('load', loadHandler);

  return () => {
    if (observer) observer.disconnect();
    window.clearInterval(intervalId);
    document.removeEventListener('DOMContentLoaded', domContentHandler);
    window.removeEventListener('load', loadHandler);
  };
}
