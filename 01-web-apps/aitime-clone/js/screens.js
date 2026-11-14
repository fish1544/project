/* 页面层：每个屏的 HTML 结构生成 */
const SCREENS = {};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TABS = [
  { k: "home", n: "时间", ic: "navTime" },
  { k: "goals", n: "目标", ic: "navGoal" },
  { k: "schedule", n: "日程", ic: "navSchedule" },
  { k: "habits", n: "习惯", ic: "navHabit" },
  { k: "mine", n: "我的", ic: "navMine" },
];

function header({ left = "", title = "", right = "", seg = "", cls = "" }) {
  return `<div class="hd ${cls}">
    ${left}
    ${seg || `<div class="ttl">${title}</div>`}
    ${right}
  </div>`;
}

const backBtn = (act = "back") => `<div class="ic" data-act="${act}">${ICONS.back()}</div>`;
const moreBtn = (act = "menu") => `<div class="ic" data-act="${act}">${ICONS.more()}</div>`;
const titleEl = (t) => `<div class="ttl">${t}</div>`;

function tabbar(active) {
  return `<div class="tabbar">
    ${TABS.map(
      (t) => `<div class="t ${active === t.k ? "on" : ""}" data-tab="${t.k}">${ICONS[t.ic]()}<span>${t.n}</span></div>`
    ).join("")}
  </div>`;
}

const emptyBlock = (txt = "怎么啥都没有", link = "") =>
  `<div class="empty">${ICONS.emptyBox()}<div class="etxt">${txt}</div>${link ? `<div class="elink">${link}</div>` : ""}</div>`;

/* ============ 时间（主页） ============ */
SCREENS.home = () => {
  const dk = AITIME.STATE.viewDate;
  const sum = AITIME.daySummary(dk);
  const recs = AITIME.recordsOf(dk)
    .slice()
    .sort((a, b) => b.start - a.start);
  const timer = AITIME.STATE.timer;
  const running = !!timer;
  const elapsed = running ? Math.max(0, Math.floor((Date.now() - timer.startAt) / 60000)) : 0;

  const rows = recs.length
    ? recs
        .map((r) => {
          const cat = AITIME.catOf(r.cat);
          const { start, len } = AITIME.normRange(r);
          return `<div class="rec" data-rec="${r.id}">
            <span class="cdot" style="background:${cat.color};margin-top:0"></span>
            <div class="rc-main">
              <div class="rc-1"><span class="rc-cat">${esc(cat.name)}</span><span class="rc-time">${AITIME.fmtClock(start)}~${AITIME.fmtClock(start + len)}</span></div>
              ${r.note ? `<div class="rc-2">${esc(r.note)}</div>` : ""}
            </div>
            <span class="rc-dur">${AITIME.fmtDur(len)}</span>
          </div>`;
        })
        .join("")
    : "";

  return `<div class="screen" data-screen="home">
    ${header({
      left: `<div class="ic" data-act="home-tools">${ICONS.swap()}</div>`,
      seg: `<div class="date-nav">
        <span class="chev" data-act="date-prev">${ICONS.chevL()}</span>
        <span data-act="date-today">${AITIME.fmtDayLabel(dk)}</span>
        <span class="chev" data-act="date-next">${ICONS.chevR()}</span>
      </div>`,
      right: `<div class="right-cluster"><div class="ic" data-act="open-stats">${ICONS.chartBar()}</div><div class="ic" data-act="home-menu">${ICONS.more()}</div></div>`,
    })}
    <div class="home-top">
      <div class="hrow"><span>全天24小时</span><span class="rs">已记录：${AITIME.fmtDur(sum.rec)}，占比：${sum.pctRec.toFixed(1)}%</span></div>
      <div class="thin-line"></div>
      <div class="hrow hrow-2"><span class="lt"><b>未记录</b>${AITIME.fmtDur(sum.unrec)}</span><span class="rs">${sum.pctUnrec.toFixed(1)}%</span></div>
      <div class="bar"><i style="width:${Math.min(100, sum.pctUnrec)}%"></i></div>
      <div class="hrow hrow-2"><span class="lt"><b>今日剩余</b>${AITIME.fmtDur(sum.remain)}</span><span class="rs">${sum.pctRemain.toFixed(1)}%</span></div>
      <div class="bar"><i style="width:${Math.min(100, sum.pctRemain)}%"></i></div>
    </div>
    <div class="home-list">${rows}</div>
    <div class="pillbar ${running ? "running" : ""} ${AITIME.STATE.settings.showBottomButtons ? "" : "hide"}" id="pillbar">
      <div class="pb-side ${running ? "on" : ""}" data-act="${running ? "pill-running" : "pill-start"}">${running ? AITIME.fmtClock(new Date(timer.startAt).getHours() * 60 + new Date(timer.startAt).getMinutes()) : "开始"}</div>
      <div class="pb-main" data-act="${running ? "pill-open" : "pill-add"}">${running ? elapsed + "分钟" : ICONS.plus()}</div>
      <div class="pb-side" data-act="pill-end">结束</div>
    </div>
    ${tabbar("home")}
  </div>`;
};

/* ============ 统计 ============ */
const STATS_TABS = [
  { k: "year", n: "年" },
  { k: "month", n: "月" },
  { k: "week", n: "周" },
  { k: "day", n: "天" },
  { k: "custom", n: "自" },
];

SCREENS.stats = () => {
  const tab = AITIME.STATE.statsTab;
  const dk = AITIME.STATE.viewDate;
  const st = AITIME.periodStats(tab === "custom" ? "day" : tab, dk);
  const base = AITIME.fromKey(dk);

  let title = "今天";
  let prevLabel = "";
  if (tab === "year") {
    title = `${base.getFullYear()}年`;
    prevLabel = `${base.getFullYear() - 1}年`;
  } else if (tab === "month") {
    title = `${base.getMonth() + 1}月`;
    prevLabel = `${base.getMonth() === 0 ? 12 : base.getMonth()}月`;
  } else if (tab === "week") {
    title = "本周";
    prevLabel = "上一周";
  } else if (tab === "day") {
    title = AITIME.fmtDayLabel(dk);
    prevLabel = "前一天";
  } else {
    title = "自定义";
    prevLabel = "自定义";
  }

  const cats = Object.keys(st.byCat)
    .sort((a, b) => st.byCat[b] - st.byCat[a])
    .map((id) => {
      const c = AITIME.catOf(id);
      return `<div class="cat-row"><span class="cdot" style="background:${c.color}"></span><span class="cn">${esc(c.name)}</span><span class="cp">${AITIME.fmtDur(st.byCat[id])} · ${((st.byCat[id] / st.total) * 100).toFixed(1)}%</span></div>`;
    })
    .join("");

  const sumHtml = `<div class="stats-sum">
    <div class="s"><div class="sv">${st.days}</div><div class="sl">天数</div></div>
    <div class="s"><div class="sv">${st.total ? AITIME.fmtDur(st.total).replace("小时", "<small>小时</small>").replace("分钟", "<small>分钟</small>") : '0<small>分钟</small>'}</div><div class="sl">时长</div></div>
    <div class="s"><div class="sv">${st.days ? AITIME.fmtDur(Math.round(st.avg)).replace("小时", "<small>小时</small>").replace("分钟", "<small>分钟</small>") : '0<small>分钟</small>'}</div><div class="sl">日均时长</div></div>
    <div class="s"><div class="sv">${st.times}</div><div class="sl">次数</div></div>
  </div>`;

  return `<div class="screen" data-screen="stats">
    <div class="hd">
      ${backBtn()}
      <div class="ttl" style="flex:0 0 auto;text-align:left;padding-left:6px;padding-right:10px;font-size:18px">统计</div>
      <div class="hd-seg" style="flex:1;max-width:210px">${STATS_TABS.map((t) => `<button data-stab="${t.k}" style="flex:1" class="${tab === t.k ? "on" : ""}">${t.n}</button>`).join("")}</div>
      ${moreBtn("stats-menu")}
    </div>
    <div class="stats-head" style="position:relative">
      <span class="period-pill" data-act="stats-prev">${prevLabel}</span>
      <span class="stats-title">${title}</span>
    </div>
    ${st.total ? sumHtml + cats : emptyBlock("怎么啥都没有")}
  </div>`;
};

/* ============ 添加记录 ============ */
const wheelCol = (val, max, unit, field) => {
  const prev = (val - 1 + max) % max;
  const next = (val + 1) % max;
  const show = (v, mid) =>
    `<div class="wrow ${mid ? "mid" : ""}" ${mid ? `data-wheel-mid="${field}"` : `data-wheel-step="${field}" data-step="${mid ? 0 : v === prev ? -1 : 1}"`}>${AITIME.pad2(v)}<small>${unit}</small></div>`;
  return `<div class="wcol">
    <div class="wsel"></div>
    ${show(prev, false)}
    ${show(val, true)}
    ${show(next, false)}
  </div>`;
};

SCREENS.add = (params) => {
  const f = params.form;
  let len = f.endMin - f.startMin;
  if (len <= 0) len += 1440;
  const cats = AITIME.STATE.categories.filter((c) => !c.archived);

  return `<div class="screen" data-screen="add">
    ${header({
      left: backBtn(),
      title: "添加",
      right: `<div class="right-cluster"><span class="txt" data-act="add-today">今天</span><span class="txt" data-act="add-save">保存</span></div>`,
    })}
    <div class="add-dur" id="add-dur">${AITIME.fmtDur(len)}</div>
    <div class="whead"><div class="wh">开始时间</div><div class="wh">结束时间</div></div>
    <div class="wheels">
      ${wheelCol(Math.floor(f.startMin / 60), 24, "时", "sh")}
      ${wheelCol(f.startMin % 60, 60, "分", "sm")}
      ${wheelCol(Math.floor(f.endMin / 60), 24, "时", "eh")}
      ${wheelCol(f.endMin % 60, 60, "分", "em")}
    </div>
    <div class="add-body">
      <div class="seg-tabs">
        <button class="${f.tab === "cat" ? "on" : ""}" data-addtab="cat">分类</button>
        <button class="${f.tab === "imp" ? "on" : ""}" data-addtab="imp">重要</button>
      </div>
      <div class="chips">
        ${cats
          .map(
            (c) =>
              `<div class="chip ${f.cat === c.id ? "sel" : ""}" style="background:${c.color}" data-addcat="${c.id}">${esc(c.name)}</div>`
          )
          .join("")}
        <div class="chip pen" data-act="add-editcats">${ICONS.pencil ? ICONS.pencil("#fff") : "✎"}</div>
      </div>
      <div class="note-row">
        <span class="lb">备注</span>
        <input id="add-note" placeholder="请输入备注" value="${esc(f.note || "")}" />
        <button class="btn-save" data-act="add-save">保存</button>
      </div>
    </div>
  </div>`;
};

/* ============ 图表 ============ */
SCREENS.chart = () => {
  const dk = AITIME.STATE.viewDate;
  const sum = AITIME.daySummary(dk);
  const recs = AITIME.recordsOf(dk);
  const s = AITIME.STATE.settings;
  const mode = AITIME.STATE.chartMode;

  let legRows = "";
  if (s.chartList) {
    if (recs.length === 0 || !s.chartHideUnrec) {
      const unrecEnd = sum.isToday ? AITIME.nowMinutes() : 1440;
      legRows += `<div class="leg-row"><span>${AITIME.fmtClock(0)}~${AITIME.fmtClock(unrecEnd)}</span><span class="lg-dot" style="background:#d5d5d5"></span><span class="lg-name">未记录 ${AITIME.fmtDur(sum.unrec)}</span><span class="lg-ar">${ICONS.arrowRight()}</span></div>`;
    }
    const list = recs.slice().sort((a, b) => (s.chartReverse ? b.start - a.start : a.start - b.start));
    legRows += list
      .map((r) => {
        const c = AITIME.catOf(r.cat);
        const { start, len } = AITIME.normRange(r);
        return `<div class="leg-row"><span>${AITIME.fmtClock(start)}~${AITIME.fmtClock(start + len)}</span><span class="lg-dot" style="background:${c.color}"></span><span class="lg-name">${esc(c.name)} ${AITIME.fmtDur(len)}</span><span class="lg-ar">${ICONS.arrowRight()}</span></div>`;
      })
      .join("");
  }

  return `<div class="screen" data-screen="chart">
    ${header({
      left: `<div class="ic" data-act="back">${ICONS.close()}</div>`,
      seg: `<div class="hd-seg">${["环形", "门形", "双环"].map((m) => `<button data-cmode="${m}" class="${mode === m ? "on" : ""}">${m}</button>`).join("")}</div>`,
      right: moreBtn("chart-menu"),
    })}
    <div class="chart-wrap">
      ${s.chartGraph ? `<div class="chart-svg">${CHART.build(mode, dk)}</div>` : ""}
      <div class="legend">${legRows}</div>
    </div>
    <div class="chart-use"><button class="btn-wide" data-act="chart-use">使用</button></div>
  </div>`;
};

/* ============ 概览 ============ */
SCREENS.overview = () => {
  const dk = AITIME.STATE.viewDate;
  const sum = AITIME.daySummary(dk);
  return `<div class="screen" data-screen="overview">
    ${header({ left: `<div class="ic" data-act="back">${ICONS.close()}</div>`, title: "概览", right: moreBtn("ov-menu") })}
    <div class="ov-row"><span class="on1">全天24小时</span><span class="on2">已记录： ${AITIME.fmtDur(sum.rec)}，占比： ${sum.pctRec.toFixed(1)}%</span></div>
    <div class="ov-row"><span class="on1"><b>未记录</b> ${AITIME.fmtDur(sum.unrec)}</span><span class="on2">${sum.pctUnrec.toFixed(1)}%</span></div>
    <div class="ov-row"><span class="on1"><b>今日剩余</b> ${AITIME.fmtDur(sum.remain)}</span><span class="on2">${sum.pctRemain.toFixed(1)}%</span></div>
  </div>`;
};

/* ============ 目标 ============ */
SCREENS.goals = () => {
  const goals = AITIME.STATE.goals;
  const body = goals.length
    ? `<div class="goal-list">${goals
        .map((g) => {
          const c = AITIME.catOf(g.cat);
          const done = g.progress || 0;
          return `<div class="goal-card" style="background:${c.color}">
            <div class="gc-l">
              <div class="gc-n">${esc(g.name)}</div>
              <div class="gc-d">${esc(g.cycleText)}</div>
              <div class="gc-d">${g.todayText || "今日0分钟"}</div>
            </div>
            <div class="gc-r">
              <div class="gring">${done}%</div>
              <div class="gstart" data-act="goal-start" data-goal="${g.id}">开始</div>
            </div>
          </div>`;
        })
        .join("")}</div>`
    : emptyBlock("怎么啥都没有", "目标功能怎么用？点我看教程&gt;&gt;");

  return `<div class="screen" data-screen="goals">
    ${header({
      left: `<div class="ic">${ICONS.bubbles ? ICONS.bubbles() : ICONS.grid4()}</div>`,
      title: "目标",
      right: `<div class="right-cluster"><div class="ic" data-act="goal-add">${ICONS.plus()}</div>${moreBtn("goal-menu")}</div>`,
    })}
    ${body}
    ${tabbar("goals")}
  </div>`;
};

SCREENS.goalAdd = () => {
  const cats = AITIME.STATE.categories.filter((c) => !c.archived);
  return `<div class="screen" data-screen="goalAdd">
    ${header({ left: backBtn(), title: "添加目标", right: `<span class="txt" data-act="goal-save">保存</span>` })}
    <div class="flex1" style="background:#fff">
      <div class="form-block">
        <div class="fb-t">挑选时间类型：</div>
        <div class="chips" style="padding:0">
          ${cats
            .map(
              (c, i) =>
                `<div class="chip ${i === 0 ? "sel" : ""}" style="background:${c.color}" data-gcat="${c.id}">${esc(c.name)}</div>`
            )
            .join("")}
          <div class="chip pen" data-act="add-editcats">✎</div>
        </div>
      </div>
      <div class="form-block">
        <div class="fb-t">订制一下计时器：</div>
        <div class="seg-pill">
          ${["正计时", "倒计时", "番茄钟"].map((t, i) => `<button class="${i === 0 ? "on" : ""}" data-gtimer="${t}">${t}</button>`).join("")}
        </div>
      </div>
      <div class="form-block">
        <div class="fb-t">计时模式：</div>
        <div class="seg-pill">
          ${["专注模式", "普通模式"].map((t, i) => `<button class="${i === 1 ? "on" : ""}" data-gmode="${t}">${t}</button>`).join("")}
        </div>
      </div>
      <div class="form-block">
        <div class="fb-t">设置个小目标：</div>
        <div class="seg-pill">
          ${["无", "每日", "每周", "每月", "长目标"].map((t, i) => `<button class="${i === 4 ? "on" : ""}" data-gcycle="${t}">${t}</button>`).join("")}
        </div>
      </div>
      <div class="form-block">
        <div class="fb-row">从 <span class="pill-inp" data-act="goal-from">${AITIME.todayKey()}</span> 开始</div>
        <div class="fb-row">到 <span class="pill-inp" data-act="goal-to">${AITIME.shiftDate(AITIME.todayKey(), 30)}</span> 之前，完成 <span class="pill-inp" data-act="goal-amount">2小时</span></div>
      </div>
    </div>
  </div>`;
};

/* ============ 日程 ============ */
SCREENS.schedule = () => `<div class="screen" data-screen="schedule">
    ${header({
      left: `<div class="ic" data-act="sched-cal">${ICONS.clock ? ICONS.clock() : ""}</div>`,
      title: "日程",
      right: `<div class="right-cluster"><div class="ic" data-act="open-stats">${ICONS.chartBar()}</div><div class="ic" data-act="sched-add">${ICONS.plus()}</div></div>`,
    })}
    ${emptyBlock("怎么啥都没有")}
    ${tabbar("schedule")}
  </div>`;

/* ============ 习惯 ============ */
SCREENS.habits = () => {
  const habits = AITIME.STATE.habits;
  const body = habits.length
    ? `<div class="flex1">${habits
        .map((h) => {
          const checked = !!h.checks?.[AITIME.todayKey()];
          return `<div class="habit-row">
            <div class="hr-ic" style="background:${h.color}">${h.emoji || "🌱"}</div>
            <div class="ii" style="flex:1">
              <div class="hr-1">${esc(h.name)}</div>
              <div class="hr-2">${h.days.join("、")}道 · 坚持就是胜利</div>
            </div>
            <div class="hr-ck ${checked ? "on" : ""}" data-habit="${h.id}">${checked ? ICONS.check() : ""}</div>
          </div>`;
        })
        .join("")}</div>`
    : emptyBlock("怎么啥都没有");

  return `<div class="screen" data-screen="habits">
    ${header({
      left: `<div class="ic">${ICONS.grid4()}</div>`,
      title: "习惯",
      right: `<div class="right-cluster"><div class="ic" data-act="open-stats">${ICONS.chartBar()}</div><div class="ic" data-act="habit-add">${ICONS.plus()}</div></div>`,
    })}
    ${body}
    ${tabbar("habits")}
  </div>`;
};

SCREENS.habitPick = () => `<div class="screen" data-screen="habitPick">
    ${header({ left: backBtn(), title: "选要养成的习惯", right: `<span class="txt" data-act="back">完成</span>` })}
    <div class="habit-grid">
      ${AITIME.HABIT_GROUPS.map(
        (g) => `<div class="hb-group">
          <div class="hb-gt"><i></i>${g.name}</div>
          <div class="hb-items">
            ${g.items
              .map(
                (it) =>
                  `<div class="hb-item" data-preset="${esc(it.n)}" data-emoji="${it.e}" data-bg="${it.bg}">
                    <div class="hb-ic" style="background:${it.bg}">${it.e}</div>
                    <div class="hb-nm">${esc(it.n)}</div>
                  </div>`
              )
              .join("")}
          </div>
        </div>`
      ).join("")}
    </div>
  </div>`;

SCREENS.habitAdd = (params) => {
  const f = params.habitForm;
  return `<div class="screen" data-screen="habitAdd">
    ${header({ left: backBtn(), title: "添加习惯", right: `<span class="txt" data-act="habit-save">保存</span>` })}
    <div class="flex1" style="background:#fff;padding-top:18px">
      <div style="display:grid;place-items:center">
        <div class="hb-ic" style="width:64px;height:64px;border-radius:50%;background:${f.color};display:grid;place-items:center;font-size:24px">${f.emoji}</div>
        <input id="habit-name" placeholder="给习惯命名" value="${esc(f.name)}" style="margin:14px 0 6px;text-align:center;font-size:16px;background:#f4f4f4;border-radius:4px;padding:8px 30px;width:180px" />
      </div>
      <div class="fb-t" style="padding:16px 16px 6px;font-size:15px;font-weight:600">挑选颜色和图标：</div>
      <div class="color-dots">
        ${AITIME.HABIT_COLOR_POOL.map((c, i) => `<div class="cd" data-hcolor="${c}" style="background:${c};${f.color === c ? "box-shadow:0 0 0 2px #fff,0 0 0 3.4px " + c : ""}"></div>`).join("")}
      </div>
      <div class="icon-grid">
        ${AITIME.HABIT_ICON_POOL.map((e) => `<div class="ig ${f.emoji === e ? "on" : ""}" data-hemoji="${e}">${e}</div>`).join("")}
      </div>
      <div class="fb-t" style="padding:8px 16px 6px;font-size:15px;font-weight:600">在一周的什么时候：<span style="font-size:12px;color:#999;font-weight:400">周一、周二、周三、周四、周五、周六、周日</span></div>
      <div class="day-chips">
        ${["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((d) => `<button class="dc ${f.days.includes(d) ? "on" : ""}" data-hday="${d}">${d}</button>`).join("")}
      </div>
      <div class="fb-t" style="padding:8px 16px 6px;font-size:15px;font-weight:600">写一句激励自己的话：</div>
      <div style="padding:0 16px"><input id="habit-word" value="${esc(f.word)}" placeholder="坚持就是胜利" style="width:100%;background:#f4f4f4;border-radius:5px;padding:11px 12px;font-size:14px"/></div>
      <div class="fb-t" style="padding:14px 16px 6px;font-size:15px;font-weight:600">从什么时候开始：</div>
      <div style="padding:0 16px 20px"><span style="background:#f4f4f4;border-radius:4px;padding:7px 12px;font-size:14px;color:#666">${AITIME.todayKey()}</span></div>
    </div>
  </div>`;
};

/* ============ 我的 ============ */
SCREENS.mine = () => {
  const catCount = AITIME.STATE.categories.filter((c) => !c.archived).length;
  const habitCount = AITIME.STATE.habits.length;
  return `<div class="screen" data-screen="mine">
    ${header({
      left: `<div class="ic vip-ic" data-act="mine-vip">${ICONS.vip()}</div>`,
      title: "我的",
      right: `<div class="ic" data-act="open-settings">${ICONS.gear()}</div>`,
    })}
    <div class="me-head">
      <div class="me-top">
        <div class="me-avatar">${ICONS.avatar()}</div>
        <div class="me-info">
          <div class="me-name">默认昵称<em>会员体验期剩余7天</em></div>
          <div class="me-sub">成长值0 &nbsp; 坚果0</div>
          <div class="me-prog"><i></i></div>
          <div class="me-lv"><span>初出茅庐III</span><span data-act="logout">退出登录</span></div>
        </div>
      </div>
    </div>
    <div class="me-stats">
      <div class="ms"><div class="msv">${catCount}</div><div class="msl">时间分类</div></div>
      <div class="ms"><div class="msv">${habitCount}</div><div class="msl">全部习惯</div></div>
    </div>
    <div class="me-body">
      <div class="sec-t">高级功能</div>
      <div class="me-grid">
        ${[
          ["☁", "#8bd07a", "数据同步"],
          ["🔒", "#f0d59a", "密码保护"],
          ["🎨", "#8fbfe0", "换肤", "theme"],
          ["🎁", "#f0a05e", "宝盒"],
          ["💡", "#f2c46a", "发现"],
          ["🌰", "#7ec6dd", "坚果"],
        ]
          .map(
            ([ic, bg, nm, act]) =>
              `<div class="mg" ${act ? `data-act="${act}"` : ""}><div class="mg-i" style="background:${bg}">${ic}</div><div class="mg-l">${nm}</div></div>`
          )
          .join("")}
      </div>
      <div class="sec-t">其他</div>
      <div class="me-grid">
        ${[
          ["📖", "#e2606e", "教程"],
          ["👍", "#ab98ee", "好评"],
          ["📮", "#8f9bb0", "我的作品", "works"],
        ]
          .map(
            ([ic, bg, nm, act]) =>
              `<div class="mg" ${act ? `data-act="${act}"` : ""}><div class="mg-i" style="background:${bg}">${ic}</div><div class="mg-l">${nm}</div></div>`
          )
          .join("")}
      </div>
    </div>
    ${tabbar("mine")}
  </div>`;
};

SCREENS.works = () => `<div class="screen" data-screen="works">
    ${header({ left: backBtn(), title: "我的作品" })}
    <div class="list">
      <div class="lg-title">其他作品</div>
      ${[
        ["☀️", "#f7d77c", "小习惯", "培养你的好习惯"],
        ["🐷", "#f0a0b4", "萌猪记账", "让每笔支出都有迹可循"],
        ["✏️", "#8fbfe0", "秒记记事", "记录生活的点滴"],
      ]
        .map(
          ([ic, bg, nm, sub]) =>
            `<div class="item"><div class="mg-i" style="background:${bg};width:44px;height:44px;border-radius:22px;font-size:20px">${ic}</div>
             <div class="ii"><div>${nm}</div><div class="isub">${sub}</div></div>
             <div class="btn-save" style="height:28px;padding:0 14px;font-size:13px">获取</div></div>`
        )
        .join("")}
    </div>
  </div>`;

/* ============ 设置 ============ */
SCREENS.settings = () => `<div class="screen" data-screen="settings">
    ${header({ left: backBtn(), title: "设置" })}
    <div class="list">
      <div class="lg-title">重要设置</div>
      <div class="item danger" data-act="open-perms"><div class="ii">必开权限<div class="isub">为保证计时器、学霸模式、锁机等功能的正常运行，需要开启的权限</div></div><div class="iar">›</div></div>
      <div class="lg-title">常规</div>
      <div class="item" data-act="menu-item"><div class="ii">计时器设置</div><div class="iar">›</div></div>
      <div class="item" data-act="open-cats"><div class="ii">时间类型设置</div><div class="iar">›</div></div>
      <div class="item" data-act="open-modules"><div class="ii">功能模块设置</div><div class="iar">›</div></div>
      <div class="item" data-act="menu-item"><div class="ii">便捷性设置</div><div class="iar">›</div></div>
      <div class="item" data-act="open-data"><div class="ii">数据相关设置</div><div class="iar">›</div></div>
      <div class="lg-title">关于</div>
      <div class="item" data-act="menu-item"><div class="ii">联系我们</div><div class="iar">›</div></div>
      <div class="item" data-act="menu-item"><div class="ii">检测更新</div><div class="ival">v9.9.14</div><div class="iar">›</div></div>
      <div class="item" data-act="open-about"><div class="ii">关于爱时间</div><div class="iar">›</div></div>
      <div class="item" data-act="menu-item"><div class="ii">隐私协议</div><div class="iar">›</div></div>
      <div class="lg-title">重启</div>
      <div class="logout"><button data-act="logout">退出登录</button></div>
    </div>
  </div>`;

SCREENS.categories = () => {
  const cats = AITIME.STATE.categories;
  return `<div class="screen" data-screen="categories">
    ${header({ left: backBtn(), title: "时间分类", right: `<span class="txt" data-act="menu-item">已归档</span>` })}
    <div class="list">
      <div class="lg-title" style="text-align:center;color:#9ec9d8;background:#fff">长按分类拖动排序</div>
      ${cats
        .filter((c) => !c.archived)
        .map(
          (c) => `<div class="item" data-cat="${c.id}"><span class="cdot" style="background:${c.color};width:14px;height:14px;border-radius:50%"></span><div class="ii">${esc(c.name)}</div><div class="iar">›</div></div>`
        )
        .join("")}
      <div class="item" data-act="cat-add" style="color:var(--teal)"><div class="ii" style="color:var(--teal)">＋ 添加时间分类</div></div>
    </div>
  </div>`;
};

SCREENS.modules = () => {
  const on = AITIME.STATE.settings.modules;
  const off = AITIME.STATE.settings.hiddenModules;
  const row = (m) => `<div class="item"><span style="font-size:20px">${m.icon}</span><div class="ii">${m.n}</div><div class="iar">›</div></div>`;
  return `<div class="screen" data-screen="modules">
    ${header({ left: backBtn(), title: "功能模块设置" })}
    <div class="list">
      <div class="lg-title">使用中 <span style="font-size:12px;color:#b0b0b0">长按拖动排序、显隐</span></div>
      ${on.map((n) => row({ n, icon: MODULE_ICON[n] || "▫️" })).join("")}
      <div class="lg-title">隐藏中 <span style="font-size:12px;color:#b0b0b0">长按拖动排序、显隐</span></div>
      ${off.map((n) => row({ n, icon: MODULE_ICON[n] || "▫️" })).join("")}
    </div>
  </div>`;
};

const MODULE_ICON = { 时间: "⏱", 目标: "🗓", 日程: "🌐", 习惯: "🌱", 待办: "📋", 计划: "📅", 成长: "📈", 奖赏: "🏆" };

SCREENS.dataSettings = () => {
  const s = AITIME.STATE.settings;
  return `<div class="screen" data-screen="dataSettings">
    ${header({ left: backBtn(), title: "数据相关设置" })}
    <div class="list">
      <div class="lg-title">数据处理</div>
      <div class="item" data-act="export-excel"><div class="ii">数据导出为excel<div class="isub">导出时间记录、睡前复盘、日记</div></div><div class="iar">›</div></div>
      <div class="item" data-act="export-txt"><div class="ii">数据导出为txt<div class="isub">导出时间记录数据，可供统计分析</div></div><div class="iar">›</div></div>
      <div class="item" data-act="menu-item"><div class="ii">数据迁移or清除</div><div class="iar">›</div></div>
      <div class="lg-title">数据安全</div>
      <div class="item"><div class="ii">自动本地备份<div class="isub">开启后，每天会自动进行一次本地数据备份</div></div><div class="switch ${s.autoBackup ? "on" : ""}" data-act="toggle-backup"><i></i></div></div>
      <div class="item" data-act="menu-item"><div class="ii">备份数据到手机</div><div class="iar">›</div></div>
      <div class="item" data-act="menu-item"><div class="ii">从手机中恢复数据</div><div class="iar">›</div></div>
    </div>
  </div>`;
};

SCREENS.about = () => `<div class="screen" data-screen="about">
    ${header({ left: backBtn(), title: "关于爱时间" })}
    <div class="list">
      <div style="background:#f2f2f2;padding:26px 0;display:grid;place-items:center;gap:10px">
        <div style="width:96px;height:96px;border-radius:14px;background:#fff;display:grid;place-items:center">
          <div style="font-family:Georgia,serif;font-size:26px;color:#2f9fc4;position:relative">
            Time<span style="position:absolute;left:50%;top:-9px;transform:translateX(-50%);font-size:12px;color:#e2606e">♥</span>
          </div>
        </div>
        <div style="font-size:16px">爱时间</div>
      </div>
      <div class="item"><div class="ii">版本号</div><div class="ival">v9.9.14</div></div>
      <div class="item"><div class="ii">作者</div><div class="ival">林森</div></div>
      <div class="item"><div class="ii">反馈邮箱</div><div class="ival">499021230@qq.com</div></div>
      <div class="item"><div class="ii">作者微信</div><div class="ival">linsen618</div></div>
      <div style="text-align:center;padding:26px 0;color:#b3b3b3;font-size:12px">APP备案编号： 闽ICP备2021009915号-3A ›</div>
    </div>
  </div>`;

SCREENS.perms = () => `<div class="screen" data-screen="perms">
    ${header({ left: backBtn(), title: "必开权限" })}
    <div class="list">
      <div class="lg-title">基础权限（确保爱时间常驻后台）</div>
      <div class="item"><div class="ii">请勿开启【省电模式】<div class="isub">如果开启了省电模式，将可能导致计时器无法正常提醒，建议在计时过程中关闭省电模式。</div></div></div>
      <div class="item"><div class="ii">电池优化白名单<div class="isub">将爱时间加入保护名单中</div></div><div class="btn-save" style="height:28px;padding:0 14px;font-size:13px">加入</div></div>
      <div class="item"><div class="ii">后台运行权限<div class="isub">允许爱时间在后台运行，允许自启动</div></div><div class="btn-save" style="height:28px;padding:0 14px;font-size:13px">快速设置</div></div>
      <div class="item"><div class="ii">多任务中锁住爱时间<div class="isub">在手机多任务中锁住爱时间，避免被系统清理</div></div><div class="iar">›</div></div>
      <div class="lg-title">高级权限（确保学霸模式、锁机等功能正常运行）</div>
      <div class="item"><div class="ii">悬浮窗显示权限<div class="isub">允许爱时间在手机上显示悬浮窗</div></div><div class="ival">未开启 ›</div></div>
      <div class="item"><div class="ii">通知权限<div class="isub">允许爱时间使用通知栏，常驻通知</div></div><div class="ival" style="color:#e15f6a">未开启 ›</div></div>
      <div class="item"><div class="ii">日程提醒通知<div class="isub">请保持「日程提醒」通道开启声音与高重要性，否则听不到提醒</div></div><div class="ival" style="color:#e15f6a">未开启 ›</div></div>
      <div class="item"><div class="ii">计时通知<div class="isub">计时进行中会显示在通知栏，请保持该通道开启</div></div><div class="ival" style="color:#4a9ec0">已开启 ›</div></div>
      <div class="item"><div class="ii">应用使用情况权限<div class="isub">允许爱时间获取当前运行的App</div></div><div class="ival" style="color:#e15f6a">未开启 ›</div></div>
      <div class="lg-title">其他权限</div>
    </div>
  </div>`;

SCREENS.whitelist = () => `<div class="screen" data-screen="whitelist">
    ${header({ left: backBtn(), title: "白名单设置" })}
    <div style="display:flex;justify-content:flex-end;padding:10px 14px">
      <div class="seg-tabs" style="margin:0;width:180px">
        <button class="on">第三方应用</button><button>系统应用</button>
      </div>
    </div>
    ${emptyBlock("怎么啥都没有")}
  </div>`;

/* ============ 年视图 / 周视图 / 睡眠 / 搜索 / 年终总结 ============ */
SCREENS.yearview = () => {
  const year = AITIME.fromKey(AITIME.STATE.viewDate).getFullYear();
  const daysRec = new Set(AITIME.STATE.records.map((r) => r.date).filter((d) => d.startsWith(String(year))));
  const months = [];
  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1);
    const total = new Date(year, m + 1, 0).getDate();
    const lead = first.getDay();
    let cells = "";
    for (let i = 0; i < lead; i++) cells += `<span class="ph"></span>`;
    for (let d = 1; d <= total; d++) {
      const key = `${year}-${AITIME.pad2(m + 1)}-${AITIME.pad2(d)}`;
      cells += `<span class="${daysRec.has(key) ? "on" : ""}">${d}</span>`;
    }
    months.push(`<div class="month"><div class="mt">${m + 1}月</div><div class="mweek">${["日", "一", "二", "三", "四", "五", "六"].map((w) => `<span>${w}</span>`).join("")}</div><div class="mdays">${cells}</div></div>`);
  }
  return `<div class="screen" data-screen="yearview">
    ${header({ left: backBtn(), title: "年视图" })}
    <div class="year-head"><span class="yh-1">${year}</span><span class="yh-2">全年一共记录了： ${daysRec.size}天</span></div>
    <div class="months">${months.join("")}</div>
  </div>`;
};

SCREENS.weekview = () => {
  const base = AITIME.fromKey(AITIME.STATE.viewDate);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  const cols = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = AITIME.dateKey(d);
    const recs = AITIME.recordsOf(k);
    const bars = recs
      .map((r) => {
        const c = AITIME.catOf(r.cat);
        return `<i style="background:${c.color};height:${Math.max(2, Math.round(AITIME.normRange(r).len / 8))}px" title="${c.name}"></i>`;
      })
      .join("");
    cols.push(`<div class="week-col"><div class="wd">${AITIME.WEEK_CN[d.getDay()].replace("周", "周")}<br>${d.getMonth() + 1}/${d.getDate()}</div><div class="wb">${bars}</div></div>`);
  }
  return `<div class="screen" data-screen="weekview">
    ${header({ left: backBtn(), title: "周视图" })}
    <div class="week-grid">${cols.join("")}</div>
  </div>`;
};

SCREENS.night = () => {
  const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `<div class="screen" data-screen="night">
    ${header({ left: backBtn(), title: "夜间睡眠统计" })}
    <div class="flex1" style="background:#f2f2f2">
      <div style="padding:12px 14px"><span class="period-pill" style="border-radius:18px;padding:7px 14px" data-act="menu-item">最近7天 ▾</span></div>
      <div class="card"><div class="ct">早睡早起</div><div class="chart-box">${CHART.smoothLine(labels, [0, 0, 0, 0, 0, 0, 0], { h: 140 })}</div></div>
      <div class="card"><div class="ct">睡眠时长</div><div class="chart-box">${CHART.smoothLine(labels, [0, 0, 0, 0, 0, 0, 0], { h: 140 })}</div></div>
      <div class="note-line">*统计依据:每日的第一条睡觉记录，已排除起床时间超过12:00的数据</div>
    </div>
  </div>`;
};

SCREENS.search = () => {
  const q = "";
  return `<div class="screen" data-screen="search">
    ${header({ left: backBtn(), title: "搜索", right: `<span class="txt" data-act="back">取消</span>` })}
    <div class="search-bar"><div>${ICONS.search()}<input id="search-input" placeholder="搜索备注" value="${q}" /></div></div>
    <div class="flex1" id="search-result"></div>
  </div>`;
};

SCREENS.annual = () => `<div class="screen" data-screen="annual">
    ${header({ left: backBtn(), title: "年终总结", right: `<div class="ic" data-act="menu-item">${ICONS.search("#fff")}</div>` })}
    ${emptyBlock("怎么啥都没有")}
  </div>`;

window.SCREENS = SCREENS;
window.MODULE_ICON = MODULE_ICON;
