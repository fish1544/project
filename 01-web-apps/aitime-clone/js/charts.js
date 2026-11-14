/* 图表层：环形 / 门形 / 双环（SVG），以及折线图 */
const CHART = (() => {
  const V = 340;
  const C = V / 2;

  const polar = (r, min) => {
    const a = (min / 1440) * Math.PI * 2 - Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  /** 扇环：s/e 为 0~1440 分钟，从 12 点方向顺时针（用 dash 圆弧，避免 path 弧旗标出错） */
  const arc = (rO, rI, s, e, fill, opacity = 1) => {
    const span = e - s;
    const rm = (rO + rI) / 2;
    const w = rO - rI;
    if (span <= 0.4) return "";
    if (span >= 1439.6) {
      return `<circle cx="${C}" cy="${C}" r="${rm}" fill="none" stroke="${fill}" stroke-width="${w}" opacity="${opacity}"/>`;
    }
    const circ = 2 * Math.PI * rm;
    const len = (span / 1440) * circ;
    return `<circle cx="${C}" cy="${C}" r="${rm}" fill="none" stroke="${fill}" stroke-width="${w}" opacity="${opacity}"
      stroke-dasharray="${len.toFixed(2)} ${(circ - len).toFixed(2)}" stroke-dashoffset="${(-(span ? (s / 1440) * circ : 0)).toFixed(2)}"
      transform="rotate(-90 ${C} ${C})"/>`;
  };

  const ticks = (rA, rB, step, color = "#6f6f6f", width = 1.2, opacity = 1) => {
    let out = "";
    for (let m = 0; m < 1440; m += step) {
      const a = polar(rA, m), b = polar(rB, m);
      out += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
    }
    return out;
  };

  const hourLabels = (r, size = 13, color = "#6f6f6f") => {
    let out = "";
    for (let h = 0; h < 24; h++) {
      const [x, y] = polar(r, h * 60);
      out += `<text x="${x.toFixed(1)}" y="${(y + size / 2.6).toFixed(1)}" font-size="${size}" fill="${color}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">${h}</text>`;
    }
    return out;
  };

  const centerText = (lines, cy = C) => {
    const y0 = cy - (lines.length - 1) * 12;
    return lines
      .map(
        (l, i) =>
          `<text x="${C}" y="${(y0 + i * 26).toFixed(1)}" font-size="${l.s || 14}" fill="${l.c || "#b9b9b9"}" text-anchor="middle" font-family="-apple-system, 'PingFang SC', Arial">${l.t}</text>`
      )
      .join("");
  };

  const recSegs = (recs) =>
    recs.map((r) => {
      const nr = AITIME.normRange(r);
      return { s: nr.start, e: nr.start + nr.len, c: AITIME.catOf(r.cat).color };
    });

  /* 环形：每个分类一圈同心圆环 + 未记录最外圈 */
  function ring(recs, sum) {
    const unrecEnd = sum.isToday ? AITIME.nowMinutes() : 1440;
    const segs = recSegs(recs);
    // 合并同分类相邻段，避免重复圈
    const merged = [];
    segs.forEach((g) => {
      const last = merged[merged.length - 1];
      if (last && last.c === g.c && Math.abs(last.e - g.s) < 1) last.e = g.e;
      else merged.push({ ...g });
    });
    let body = "";
    body += ticks(141, 148, 30, "#b5b5b5", 1.2);
    body += hourLabels(158, 12, "#8a8a8a");
    // 未记录圈
    body += arc(137, 128, 0, Math.min(1439.6, unrecEnd), "#ececec");
    merged.slice(0, 7).forEach((g, i) => {
      const rO = 121 - i * 12;
      const rI = rO - 9;
      if (rI > 34) body += arc(rO, rI, g.s, g.e, g.c, 0.95);
    });
    body += centerText([
      { t: `${AITIME.fmtClock(0)}~${AITIME.fmtClock(unrecEnd)}`, s: 12, c: "#c2c2c2" },
      { t: sum.rec ? "已记录" : "未记录", s: 20, c: "#b3b3b3" },
      { t: AITIME.fmtDur(sum.rec ? sum.rec : sum.unrec), s: 12, c: "#c4c4c4" },
    ]);
    return `<svg viewBox="0 0 ${V} ${V}" width="320" height="320">${body}</svg>`;
  }

  /* 门形：粗环带（源应用默认图表） */
  function gate(recs, sum) {
    const unrecEnd = sum.isToday ? AITIME.nowMinutes() : 1440;
    const segs = recSegs(recs);
    let body = "";
    body += arc(136, 84, 0, 1440, "#ededed");
    body += arc(136, 84, 0, Math.min(1439.6, unrecEnd), "#c9c9c9");
    segs.forEach((g) => {
      body += arc(136, 84, g.s, g.e, g.c, 0.92);
    });
    body += ticks(136, 143, 30, "#525252", 1.5);
    body += ticks(84, 89, 30, "#525252", 1.1);
    body += hourLabels(110, 14, "#666");
    body += centerText([
      { t: `${AITIME.fmtClock(0)}~${AITIME.fmtClock(unrecEnd)}`, s: 13, c: "#b6b6b6" },
      { t: "未记录", s: 24, c: "#b6b6b6" },
      { t: AITIME.fmtDur(sum.unrec), s: 13, c: "#c0c0c0" },
    ]);
    return `<svg viewBox="0 0 ${V} ${V}" width="320" height="320">${body}</svg>`;
  }

  /* 双环：外环记录、内环未记录/剩余 */
  function twin(recs, sum) {
    const unrecEnd = sum.isToday ? AITIME.nowMinutes() : 1440;
    const segs = recSegs(recs);
    let body = "";
    body += arc(150, 128, 0, 1440, "#ececec");
    segs.forEach((g) => (body += arc(150, 128, g.s, g.e, g.c, 0.9)));
    body += arc(112, 88, 0, 1440, "#ececec");
    body += arc(112, 88, 0, Math.min(1439.6, unrecEnd), "#d3d3d3");
    body += ticks(150, 157, 30, "#dadada", 1.1);
    body += hourLabels(120, 11, "#8d8d8d");
    const p = polar(101, unrecEnd);
    body += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="8.5" fill="#8d8d8d" opacity=".5"/>`;
    body += centerText(
      [
        { t: `${AITIME.fmtClock(0)}~${AITIME.fmtClock(unrecEnd)}`, s: 12, c: "#adadad" },
        { t: "未记录", s: 19, c: "#b8b8b8" },
        { t: AITIME.fmtDur(sum.unrec), s: 12, c: "#c3c3c3" },
      ],
      C + 6
    );
    return `<svg viewBox="0 0 ${V} ${V}" width="320" height="320">${body}</svg>`;
  }

  function build(mode, dateK) {
    const recs = AITIME.recordsOf(dateK);
    const sum = AITIME.daySummary(dateK);
    if (mode === "门形") return gate(recs, sum);
    if (mode === "双环") return twin(recs, sum);
    return ring(recs, sum);
  }

  /* 平滑折线（目标卡 / 睡眠统计用） */
  function smoothLine(labels, values, opts = {}) {
    const W = opts.w || 300, H = opts.h || 130;
    const padL = 16, padR = 16, padT = 18, padB = 26;
    const iw = W - padL - padR, ih = H - padT - padB;
    const max = Math.max(1, ...values);
    const pts = values.map((v, i) => [
      padL + (values.length === 1 ? iw / 2 : (iw * i) / (values.length - 1)),
      padT + ih - (v / max) * ih,
    ]);
    const path = pts.map((p, i) => (i === 0 ? `M${p[0].toFixed(1)} ${p[1].toFixed(1)}` : `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`)).join(" ");
    const dots = pts
      .map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="#fff" stroke="#72b7d2" stroke-width="1.4"/>`)
      .join("");
    const base = opts.guide
      ? `<line x1="${padL}" y1="${padT + ih * 0.62}" x2="${W - padR}" y2="${padT + ih * 0.62}" stroke="#cfe3ea" stroke-width="1"/>`
      : "";
    const lbl = labels
      .map((l, i) => `<text x="${pts[i][0].toFixed(1)}" y="${H - 8}" font-size="11" fill="#8a8a8a" text-anchor="middle">${l}</text>`)
      .join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${base}
      <path d="${path}" fill="none" stroke="#72b7d2" stroke-width="1.4"/>${dots}${lbl}</svg>`;
  }

  return { build, smoothLine, polar, arc };
})();

window.CHART = CHART;
