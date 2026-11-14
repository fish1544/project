/* 图标层：全部为内联 SVG，仿源应用的线性图标风格 */
const S = (paths, vb = "0 0 24 24", extra = "") =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;

const ICONS = {
  back: (c = "#fff") =>
    S(`<path d="M15 4.5 7.5 12l7.5 7.5" stroke="${c}"/>`),
  close: (c = "#fff") =>
    S(`<path d="M5 5l14 14M19 5 5 19" stroke="${c}" stroke-width="1.6"/>`),
  more: (c = "#fff") =>
    S(`<circle cx="12" cy="4.6" r="1.5" fill="${c}" stroke="none"/>
       <circle cx="12" cy="12" r="1.5" fill="${c}" stroke="none"/>
       <circle cx="12" cy="19.4" r="1.5" fill="${c}" stroke="none"/>`),
  swap: (c = "#fff") =>
    S(`<path d="M3.5 8.2h13.5M14 5.2l3 3-3 3" stroke="${c}"/>
       <path d="M20.5 15.8H7M10 12.8l-3 3 3 3" stroke="${c}"/>`),
  chevL: (c = "#fff") => S(`<path d="M14.5 5 7.5 12l7 7" stroke="${c}"/>`),
  chevR: (c = "#fff") => S(`<path d="M9.5 5l7 7-7 7" stroke="${c}"/>`),
  chartBar: (c = "#fff") =>
    S(`<path d="M6 19v-6M12 19v-11M18 19v-8" stroke="${c}" stroke-width="2.4"/>
       <path d="M3 19h18" stroke="${c}" stroke-width="0"/>`),
  plus: (c = "#fff") =>
    S(`<path d="M12 5v14M5 12h14" stroke="${c}" stroke-width="2"/>`),
  search: (c = "#333") =>
    S(`<circle cx="11" cy="11" r="6.2" stroke="${c}"/><path d="M15.8 15.8 20 20" stroke="${c}"/>`),
  arrowRight: (c = "#c9c9c9") => S(`<path d="M9 5l7 7-7 7" stroke="${c}"/>`),
  avatar: (c = "#b9c6d3") =>
    `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.4" r="4.1" fill="${c}"/><path d="M4.2 20.4c1.3-4.2 4.2-6.2 7.8-6.2s6.5 2 7.8 6.2" fill="${c}"/></svg>`,
  gear: (c = "#fff") => {
    const a = [0, 45, 90, 135, 180, 225, 270, 315];
    const r1 = 7.2, r2 = 9.9;
    const pt = (r, deg) => {
      const rad = (deg * Math.PI) / 180;
      return [12 + r * Math.cos(rad), 12 + r * Math.sin(rad)];
    };
    const teeth = a
      .map((deg) => {
        const p = pt(r1, deg), q = pt(r2, deg);
        return `<line x1="${p[0].toFixed(2)}" y1="${p[1].toFixed(2)}" x2="${q[0].toFixed(2)}" y2="${q[1].toFixed(2)}" stroke="${c}" stroke-width="2.6"/>`;
      })
      .join("");
    return S(`<circle cx="12" cy="12" r="${r1}" stroke="${c}" stroke-width="1.4"/>${teeth}<circle cx="12" cy="12" r="2.6" stroke="${c}" stroke-width="1.2"/>`);
  },
  pencil: (c = "#fff") =>
    S(`<path d="M4 20l1-4.2L16.4 4.4a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L9.2 19l-4.2 1z" stroke="${c}" stroke-width="1.4"/>`),
  vip: () =>
    `<svg viewBox="0 0 22 24" fill="none">
      <rect x="2" y="3" width="18" height="18" rx="2.4" fill="#f2c94c" stroke="#d9a531" stroke-width="1.2"/>
      <path d="M6.4 8.4l2 3.2 2.1-4 2.1 4 2-3.2" stroke="#8a6417" stroke-width="1.1" fill="none"/>
      <text x="11" y="17.6" font-size="5.4" fill="#8a6417" text-anchor="middle" font-family="Arial">VIP</text>
    </svg>`,
  check: (c = "#fff") =>
    S(`<path d="M4.5 12.5 9.5 17.5 19.5 6.5" stroke="${c}" stroke-width="2"/>`),
  clock: (c = "#fff") =>
    S(`<circle cx="12" cy="12" r="8.4" stroke="${c}"/><path d="M12 7.4V12l3.2 2" stroke="${c}"/>`),
  grid4: (c = "#fff") =>
    S(`<circle cx="8" cy="8" r="3.4" stroke="${c}"/><circle cx="16" cy="8" r="3.4" stroke="${c}"/>
       <circle cx="8" cy="16" r="3.4" stroke="${c}"/><circle cx="16" cy="16" r="3.4" stroke="${c}"/>`),

  /* 底部 tab —— 线性/彩色小图标 */
  navTime: () =>
    `<svg viewBox="0 0 28 28" fill="none">
      <circle cx="13" cy="12.6" r="8.6" stroke="#8a8f96" stroke-width="1.4"/>
      <circle cx="13" cy="12.6" r="6.2" stroke="#e2a94a" stroke-width="1.2" opacity=".85"/>
      <path d="M13 8.6v4.2l2.9 1.8" stroke="#8a8f96" stroke-width="1.4" stroke-linecap="round"/>
      <rect x="15.6" y="19.2" width="10.2" height="7.2" rx="1.6" fill="#e2a94a" fill-opacity=".28" stroke="#c9963f" stroke-width="1.2"/>
      <text x="20.7" y="24.6" font-size="6" fill="#8d6a2c" text-anchor="middle" font-family="Arial">24</text>
    </svg>`,
  navGoal: () =>
    `<svg viewBox="0 0 28 28" fill="none">
      <rect x="3.6" y="5.4" width="18.4" height="17.2" rx="2.4" stroke="#8a8f96" stroke-width="1.4"/>
      <path d="M3.6 10.2h18.4" stroke="#8a8f96" stroke-width="1.4"/>
      <path d="M12.4 12.2l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z" fill="#e05a6a" fill-opacity=".22" stroke="#c04858" stroke-width="1.2"/>
      <circle cx="21.8" cy="21.6" r="4.6" fill="#fff" stroke="#4a9ec0" stroke-width="1.4"/>
      <path d="M19.7 21.7l1.5 1.6 2.6-3" stroke="#4a9ec0" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
  navSchedule: () =>
    `<svg viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="9.4" stroke="#8a8f96" stroke-width="1.4"/>
      <ellipse cx="14" cy="14" rx="9.4" ry="3.6" stroke="#cf9a4a" stroke-width="1.1" opacity=".9"/>
      <circle cx="14" cy="8.9" r="2.9" fill="#6bb4d0" fill-opacity=".5" stroke="#4a9ec0" stroke-width="1.2"/>
      <path d="M8.4 19.6c1.2-3.4 3.2-4.8 5.6-4.8s4.4 1.4 5.6 4.8" stroke="#4a9ec0" stroke-width="1.3"/>
    </svg>`,
  navHabit: () =>
    `<svg viewBox="0 0 28 28" fill="none">
      <path d="M14 20c0-4.2-2.6-7.4-6.6-8.2 0 4.2 2.6 7.4 6.6 8.2z" fill="#5aa86a" fill-opacity=".35" stroke="#4b9a5b" stroke-width="1.3"/>
      <path d="M14 20c0-4.6 2.9-8.1 7.2-8.6 0 4.6-2.9 8.1-7.2 8.6z" fill="#7cbf7a" fill-opacity=".32" stroke="#5fae63" stroke-width="1.3"/>
      <path d="M14 20v-5.4" stroke="#4b9a5b" stroke-width="1.4"/>
      <path d="M9.6 20.4c1.4 1.6 7.4 1.6 8.8 0" stroke="#c9963f" stroke-width="1.3"/>
    </svg>`,
  navMine: () =>
    `<svg viewBox="0 0 28 28" fill="none">
      <circle cx="13.6" cy="16" r="8.2" fill="#e26a5a" fill-opacity=".35" stroke="#cf4f46" stroke-width="1.4"/>
      <path d="M13.6 7.8c1.8-1.6 4.4-1.2 5 .4-1.8 1-3.6.6-5-.4z" fill="#5aa86a" fill-opacity=".5" stroke="#4b9a5b" stroke-width="1.2"/>
      <path d="M9.6 8.6c1.2-1.2 2.2-1.6 3.4-1.6s2.2.4 3.4 1.6" stroke="#4b9a5b" stroke-width="1.2"/>
    </svg>`,

  /* 空白盒子插画（打开的空箱子 + 星点） */
  emptyBox: () =>
    `<svg viewBox="0 0 120 120" fill="none" stroke="#c9c9c9" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">
      <!-- 内腔 -->
      <path d="M60 52 26 64 60 76 94 64Z"/>
      <!-- 箱体 -->
      <path d="M26 64v16l34 12 34-12v-16"/>
      <path d="M94 64v16l-34 12"/>
      <path d="M60 76v16"/>
      <!-- 打开的左右箱盖 -->
      <path d="M60 52 26 64 18 50 52 38Z"/>
      <path d="M60 52 94 64 102 50 68 38Z"/>
      <!-- 星点装饰 -->
      <path d="M70 22l1.7 3.3 3.3 1.7-3.3 1.7-1.7 3.3-1.7-3.3-3.3-1.7 3.3-1.7Z" stroke-width="1"/>
      <circle cx="53" cy="28" r="2.4"/>
      <path d="M86 34l2.4 2.4M88.4 34 86 36.4" stroke-width="1"/>
      <path d="M34 76l2.4 2.4M36.4 76l-2.4 2.4" stroke-width="1"/>
      <path d="M92 74l-2 2" stroke-width=".9"/>
      <path d="M24 58l-4 1.6" stroke-width=".9"/>
    </svg>`,
  box2: () => ICONS.emptyBox(),
};

window.ICONS = ICONS;
