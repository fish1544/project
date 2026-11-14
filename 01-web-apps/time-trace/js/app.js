/* 控制层 app.js —— 路由 / 事件分发 / 弹层 / 计时器 / 导入导出。
   设计要点：
   1. 路由只存 {name, params}，DOM 按需构建；超过 3 屏的旧节点自动卸载，长会话不涨内存；
   2. 事件用「绑定表 + 动作表」两级查表，取代巨型 switch，新增交互只加一行；
   3. 计时器对齐到分钟边界触发，只在必要时重绘，其余场景直接改文本节点；
   4. 所有弹层统一由 ui 管理，关闭逻辑单点可控。 */
(function () {
  "use strict";

  const C = window.TJCore;
  const T = window.TJ;
  const S = T.store;
  const V = window.VIEWS;
  const ICONS = window.ICONS;

  const phone = document.getElementById("phone");
  const screensEl = document.getElementById("screens");

  S.load();
  let appliedTheme = "";
  const applyTheme = (color) => {
    if (!color || color === appliedTheme) return;
    appliedTheme = color;
    document.documentElement.style.setProperty("--teal", color);
  };
  applyTheme(T.STATE.theme);

  /* ================= 弹层 ================= */
  const ui = {
    toast(message) {
      const old = phone.querySelector(".toast");
      if (old) old.remove();
      const node = document.createElement("div");
      node.className = "toast";
      node.textContent = String(message);
      phone.appendChild(node);
      setTimeout(() => node.remove(), 1900);
    },

    closeAll() {
      phone.querySelectorAll(".dialog-mask, .mask, .pop").forEach((node) => node.remove());
    },

    dialog({ title, content = "", actions = [], wide = false }) {
      ui.closeAll();
      const mask = document.createElement("div");
      mask.className = "dialog-mask";
      const box = document.createElement("div");
      box.className = "dialog";
      if (wide) box.style.maxWidth = "330px";
      box.innerHTML = `<div class="dt">${C.escapeHtml(title)}</div><div class="dc">${content}</div>`;
      const actionsEl = document.createElement("div");
      actionsEl.className = "dacts";
      actions.forEach((action, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.dlg = String(index);
        btn.textContent = action.label;
        actionsEl.appendChild(btn);
      });
      box.appendChild(actionsEl);
      mask.appendChild(box);
      phone.appendChild(mask);

      mask.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-dlg]");
        if (btn) {
          const action = actions[Number(btn.dataset.dlg)];
          mask.remove();
          if (action && action.onClick) action.onClick();
          return;
        }
        if (e.target === mask) mask.remove();
      });
      return mask;
    },

    pop(items) {
      ui.closeAll();
      const top = stack[stack.length - 1];
      if (!top || !top.el) return;
      const mask = document.createElement("div");
      mask.className = "mask";
      const box = document.createElement("div");
      box.className = "pop";
      items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "pi";
        row.dataset.pop = String(index);
        if (item.check) {
          row.innerHTML = `<span>${C.escapeHtml(item.label)}</span><span class="cb ${item.checked ? "on" : ""}"></span>`;
        } else {
          row.textContent = item.label;
        }
        box.appendChild(row);
      });
      top.el.appendChild(mask);
      top.el.appendChild(box);
      const close = () => {
        mask.remove();
        box.remove();
      };
      mask.addEventListener("click", close);
      box.addEventListener("click", (e) => {
        const row = e.target.closest("[data-pop]");
        if (!row) return;
        const item = items[Number(row.dataset.pop)];
        close();
        if (item && item.onClick) item.onClick();
      });
    },
  };

  /* ================= 路由 ================= */
  const stack = [];
  const current = () => stack[stack.length - 1];

  const build = (name, params) => {
    const tpl = document.createElement("template");
    const view = V[name];
    tpl.innerHTML = String(view ? view(params || {}) : `<div class="screen"><div class="empty"><div class="etxt">页面不存在</div></div></div>`).trim();
    return tpl.content.firstElementChild;
  };

  /** 只保留最近 3 屏的 DOM，其余旧节点从文档里摘掉（回退时按需重建） */
  const prune = () => {
    const keep = new Set(stack.slice(-3));
    stack.forEach((entry) => {
      if (!keep.has(entry) && entry.el && entry.el.isConnected) {
        entry.el.remove();
        entry.el = null;
      }
    });
  };

  function push(name, params, immediate) {
    const prev = current();
    const entry = { name, params: params || {}, el: null };
    stack.push(entry);
    const el = build(entry.name, entry.params);
    entry.el = el;
    screensEl.appendChild(el);

    if (immediate) {
      el.classList.add("active");
      if (prev && prev.el) {
        prev.el.classList.remove("active", "behind");
        prev.el.style.display = "none";
      }
    } else {
      if (prev && prev.el) {
        prev.el.classList.remove("active");
        prev.el.classList.add("behind");
      }
      requestAnimationFrame(() => el.classList.add("active"));
    }
    prune();
    return el;
  }

  /** 回退：上一屏按最新状态重绘，保证新增数据立刻可见 */
  function back() {
    if (stack.length <= 1) return;
    const top = stack.pop();
    if (top.el) {
      top.el.classList.remove("active");
      setTimeout(() => top.el && top.el.remove(), 280);
    }
    const prev = current();
    if (!prev) return;
    const fresh = build(prev.name, prev.params);
    fresh.classList.add("active");
    if (prev.el && prev.el.isConnected) prev.el.replaceWith(fresh);
    else {
      if (prev.el) prev.el.remove();
      screensEl.appendChild(fresh);
    }
    prev.el = fresh;
    prune();
  }

  function refresh() {
    const top = current();
    if (!top) return;
    const fresh = build(top.name, top.params);
    fresh.classList.add("active");
    if (top.el && top.el.isConnected) top.el.replaceWith(fresh);
    else {
      if (top.el) top.el.remove();
      screensEl.appendChild(fresh);
    }
    top.el = fresh;
  }

  function goRoot(name, params) {
    stack.length = 0;
    screensEl.textContent = "";
    push(name, params, true);
  }

  /* ================= 表单草稿 ================= */
  const UI = {
    addForm: null,
    editingRecord: null,
    goalForm: {
      cat: "sleep",
      timer: "正计时",
      mode: "普通模式",
      cycle: "长目标",
      from: T.todayKey(),
      to: T.shiftDate(T.todayKey(), 30),
      amount: "2小时",
    },
    habitForm: { name: "", emoji: "🍅", color: "#e0a1b4", days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"], word: "坚持就是胜利" },
  };

  const defaultAddForm = (over) => {
    const firstCat = T.STATE.categories.find((c) => !c.archived) || T.CATS[0];
    return Object.assign({ startMin: 0, endMin: T.nowMinutes(), cat: firstCat.id, tab: "cat", note: "" }, over || {});
  };

  const readValue = (selector) => {
    const node = phone.querySelector(selector);
    return node ? node.value : null;
  };
  const captureAddNote = () => {
    const value = readValue("#add-note");
    if (value !== null && UI.addForm) UI.addForm.note = value;
  };
  const captureHabit = () => {
    const name = readValue("#habit-name");
    const word = readValue("#habit-word");
    if (name !== null) UI.habitForm.name = name;
    if (word !== null) UI.habitForm.word = word;
  };

  const tabName = (key) => T.TAB_NAMES[key] || "";
  const tabEnabled = (key) => key === "mine" || T.STATE.settings.modules.includes(tabName(key));

  /* ================= 动作表 ================= */
  const toggleSetting = (key) => {
    S.toggleSetting(key);
    refresh();
  };

  const openTheme = () => {
    const mask = document.createElement("div");
    mask.className = "dialog-mask";
    mask.innerHTML = `<div class="dialog" style="max-width:320px"><div class="dt">更换主题</div><div class="theme-grid">${T.THEMES.map((color) => {
      const on = T.STATE.theme.toLowerCase() === color;
      return `<div class="tg ${on ? "on" : ""}" data-theme="${color}" style="background:${color}">${on ? ICONS.check() : ""}</div>`;
    }).join("")}</div><div style="height:12px"></div></div>`;
    phone.appendChild(mask);
    mask.addEventListener("click", (e) => {
      if (e.target === mask) mask.remove();
    });
  };

  const openCustomRange = () => {
    const draft = { from: T.fromKey(T.todayKey()), to: T.fromKey(T.todayKey()) };
    const row = (label, key, date) => `<div style="display:flex;align-items:center;gap:8px;margin:10px 0;justify-content:flex-end">
      <span style="color:#888">${label}</span>
      <span data-cr="${key}" data-f="y" style="color:#72b7d2">${date.getFullYear()}</span><span>年</span>
      <span data-cr="${key}" data-f="m" style="color:#72b7d2">${date.getMonth() + 1}</span><span>月</span>
      <span data-cr="${key}" data-f="d" style="color:#72b7d2">${date.getDate()}</span><span>日</span>
    </div>`;
    const mask = document.createElement("div");
    mask.className = "dialog-mask";
    mask.innerHTML = `<div class="dialog"><div class="dt">自定义</div><div class="dc" style="font-size:15px">${row("从", "from", draft.from)}${row("到", "to", draft.to)}</div><div class="dacts"><button type="button" data-cancel>取消</button><button type="button" data-ok>完成</button></div></div>`;
    phone.appendChild(mask);
    mask.addEventListener("click", (e) => {
      const cr = e.target.closest("[data-cr]");
      if (cr) {
        const target = draft[cr.dataset.cr];
        const field = cr.dataset.f;
        if (field === "y") target.setFullYear(target.getFullYear() + 1);
        if (field === "m") target.setMonth(target.getMonth() + 1);
        if (field === "d") target.setDate(target.getDate() + 1);
        mask.querySelectorAll(`[data-cr="${cr.dataset.cr}"]`).forEach((node) => {
          const f = node.dataset.f;
          node.textContent = f === "y" ? target.getFullYear() : f === "m" ? target.getMonth() + 1 : target.getDate();
        });
        return;
      }
      if (e.target.closest("[data-cancel]") || e.target === mask) {
        mask.remove();
        return;
      }
      if (e.target.closest("[data-ok]")) {
        S.setCustomRange(T.dateKey(draft.from), T.dateKey(draft.to));
        ui.toast(`已选择 ${T.dateKey(draft.from)} ~ ${T.dateKey(draft.to)}`);
        mask.remove();
      }
    });
  };

  const earlyCheck = () =>
    ui.dialog({
      title: "早起打卡",
      content: "你已经错过了今天的早起打卡时间了（04:00~10:00），补打卡需要消耗200坚果，是否进行补打卡？",
      actions: [{ label: "取消" }, { label: "确定", onClick: () => ui.toast("补打卡成功，消耗200坚果") }],
    });

  const startSleep = () => {
    S.startTimer("sleep");
    ui.toast("已开始睡觉，晚安~");
    refresh();
    scheduleTick();
  };

  const exportData = (kind) => {
    const rows = [["日期", "分类", "开始", "结束", "时长(分钟)", "备注"]];
    T.STATE.records.forEach((record) => {
      const range = T.normRange(record);
      rows.push([record.date, T.catOf(record.cat).name, T.fmtClock(range.start), T.fmtClock(range.end), range.len, record.note || ""]);
    });
    const text = rows.map((row) => row.join(kind === "csv" ? "," : "\t")).join("\r\n");
    const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `time-trace-records.${kind === "csv" ? "csv" : "txt"}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    ui.toast("已导出到下载目录");
  };

  const searchRecords = (keyword) => {
    const box = phone.querySelector("#search-result");
    if (!box) return;
    const kw = String(keyword || "").trim();
    if (!kw) {
      box.textContent = "";
      return;
    }
    const hits = T.STATE.records
      .filter((record) => (record.note || "").includes(kw) || T.catOf(record.cat).name.includes(kw))
      .sort((a, b) => (a.date === b.date ? b.start - a.start : a.date < b.date ? 1 : -1));

    if (!hits.length) {
      box.innerHTML = `<div class="empty"><div class="etxt">没有找到相关记录</div></div>`;
      return;
    }
    box.innerHTML = hits
      .slice(0, 60)
      .map((record) => {
        const cat = T.catOf(record.cat);
        const range = T.normRange(record);
        return `<div class="rec"><span class="cdot" style="background:${cat.color}"></span>
          <div class="rc-main"><div class="rc-1"><span class="rc-cat">${C.escapeHtml(cat.name)}</span><span class="rc-time">${record.date} ${T.fmtClock(range.start)}~${T.fmtClock(range.end)}</span></div>
          ${record.note ? `<div class="rc-2">${C.escapeHtml(record.note)}</div>` : ""}</div>
          <span class="rc-dur">${T.fmtDur(range.len)}</span></div>`;
      })
      .join("");
  };

  const saveAddForm = () => {
    captureAddNote();
    const form = UI.addForm;
    if (!form) return;
    let len = form.endMin - form.startMin;
    if (len <= 0) len += C.MINUTES_PER_DAY;
    if (len <= 0 || len > C.MINUTES_PER_DAY) {
      ui.toast("结束时间需晚于开始时间");
      return;
    }
    const payload = { date: T.STATE.viewDate, cat: form.cat, start: form.startMin, end: form.startMin + len, note: form.note };
    const ok = UI.editingRecord ? S.updateRecord(UI.editingRecord, payload) : !!S.addRecord(payload);
    UI.editingRecord = null;
    if (!ok) {
      ui.toast("保存失败，请检查时间范围");
      return;
    }
    back();
    ui.toast("已保存");
  };

  const shiftStatsPeriod = (delta) => {
    const tab = T.STATE.statsTab;
    const date = T.fromKey(T.STATE.viewDate) || new Date();
    if (tab === "year") date.setFullYear(date.getFullYear() + delta);
    else if (tab === "month") date.setMonth(date.getMonth() + delta);
    else if (tab === "week") date.setDate(date.getDate() + delta * 7);
    else date.setDate(date.getDate() + delta);
    S.setViewDate(T.dateKey(date));
    refresh();
  };

  const ACTIONS = {
    back: () => back(),

    /* --- 时间页 --- */
    "date-prev": () => {
      S.shiftView(-1);
      refresh();
    },
    "date-next": () => {
      const next = T.shiftDate(T.STATE.viewDate, 1);
      if (next > T.todayKey()) {
        ui.toast("明天还未到来~");
        return;
      }
      S.setViewDate(next);
      refresh();
    },
    "date-today": () => {
      S.setViewDate(T.todayKey());
      refresh();
    },
    "home-tools": () => ui.toast("时间轴视图：敬请期待"),
    "open-stats": () => push("stats"),
    "home-menu": () =>
      ui.pop([
        { label: "使用秘籍", onClick: () => ui.toast("使用秘籍：敬请期待") },
        { label: "分享", onClick: () => ui.toast("已复制分享文案") },
        { label: "搜索", onClick: () => push("search") },
        { label: "周视图", onClick: () => push("weekview") },
        { label: "早起打卡", onClick: earlyCheck },
        { label: "睡前复盘", onClick: () => ui.toast("睡前复盘：敬请期待") },
        { label: "开始睡觉", onClick: startSleep },
        { label: "夜间睡眠统计", onClick: () => push("night") },
        { label: "个性化时间轴", onClick: () => ui.toast("个性化时间轴：敬请期待") },
        { label: "个性化概览页", onClick: () => push("overview") },
        {
          label: "显示底部按钮",
          check: true,
          checked: T.STATE.settings.showBottomButtons,
          onClick: () => toggleSetting("showBottomButtons"),
        },
      ]),

    /* --- 计时胶囊 --- */
    "pill-add": () => {
      UI.addForm = defaultAddForm();
      UI.editingRecord = null;
      push("add", { form: UI.addForm });
    },
    "pill-start": () => {
      const last = T.STATE.records.length ? T.STATE.records[T.STATE.records.length - 1].cat : "work";
      S.startTimer(last);
      ui.toast("开始计时");
      refresh();
      scheduleTick();
    },
    "pill-open": () => {
      UI.addForm = defaultAddForm({ cat: T.STATE.timer ? T.STATE.timer.cat : "work" });
      UI.editingRecord = null;
      push("add", { form: UI.addForm });
    },
    "pill-end": () => {
      const timer = T.STATE.timer;
      if (!timer) {
        ui.toast("当前没有进行中的计时");
        return;
      }
      const started = new Date(timer.startAt);
      const startMin = started.getHours() * 60 + started.getMinutes();
      const endMin = T.nowMinutes();
      const len = endMin > startMin ? endMin - startMin : 1;
      S.addRecord({ date: T.todayKey(), cat: timer.cat, start: startMin, end: startMin + len, note: "计时器记录" });
      S.clearTimer();
      ui.toast("已结束并保存");
      refresh();
    },
    "pill-running": () => ui.toast("计时中…"),

    /* --- 统计 / 图表 --- */
    "stats-prev": () => shiftStatsPeriod(-1),
    "stats-menu": () =>
      ui.pop([
        { label: "年终总结", onClick: () => push("annual") },
        { label: "年视图", onClick: () => push("yearview") },
        { label: "图表视图", onClick: () => push("chart") },
        { label: "睡眠统计", onClick: () => push("night") },
      ]),
    "open-chart": () => push("chart"),
    "chart-menu": () =>
      ui.pop([
        { label: "选中今日剩余", check: true, checked: T.STATE.settings.chartSelectedRest, onClick: () => toggleSetting("chartSelectedRest") },
        { label: "时间倒序", check: true, checked: T.STATE.settings.chartReverse, onClick: () => toggleSetting("chartReverse") },
        { label: "隐藏未记录", check: true, checked: T.STATE.settings.chartHideUnrec, onClick: () => toggleSetting("chartHideUnrec") },
        { label: "不显示列表", check: true, checked: !T.STATE.settings.chartList, onClick: () => toggleSetting("chartList") },
        { label: "不显示图形", check: true, checked: !T.STATE.settings.chartGraph, onClick: () => toggleSetting("chartGraph") },
      ]),
    "chart-use": () => ui.toast("已应用该图表样式"),
    "ov-menu": () =>
      ui.pop([{ label: "显示底部按钮", check: true, checked: T.STATE.settings.showBottomButtons, onClick: () => toggleSetting("showBottomButtons") }]),

    /* --- 添加记录 --- */
    "add-today": () => {
      UI.addForm.startMin = 0;
      UI.addForm.endMin = T.nowMinutes();
      captureAddNote();
      refresh();
    },
    "add-save": saveAddForm,
    "add-editcats": () => push("categories"),

    /* --- 目标 --- */
    "goal-add": () => push("goalAdd"),
    "goal-menu": () =>
      ui.pop([
        { label: "目标排序", onClick: () => ui.toast("排序：敬请期待") },
        { label: "目标教程", onClick: () => ui.toast("教程：敬请期待") },
      ]),
    "goal-save": () => {
      const form = UI.goalForm;
      const cat = T.catOf(form.cat);
      const cycleText = form.cycle === "长目标" ? `从${form.from}到${form.to}完成${form.amount}` : `${form.cycle}不少于${form.amount}`;
      S.addGoal({ cat: form.cat, name: cat.name, cycleText });
      back();
      ui.toast("目标已创建");
    },
    "goal-start": (el) => {
      const goal = T.STATE.goals.find((item) => item.id === el.dataset.goal);
      if (!goal) return;
      S.startTimer(goal.cat);
      ui.toast(`开始计时：${goal.name}`);
      goRoot("home");
      scheduleTick();
    },
    "goal-from": () => {
      const date = T.fromKey(UI.goalForm.from) || new Date();
      date.setDate(date.getDate() + 1);
      UI.goalForm.from = T.dateKey(date);
      refresh();
    },
    "goal-to": () => {
      const date = T.fromKey(UI.goalForm.to) || new Date();
      date.setDate(date.getDate() + 1);
      UI.goalForm.to = T.dateKey(date);
      refresh();
    },
    "goal-amount": () => {
      const options = ["30分钟", "1小时", "2小时", "4小时"];
      const index = options.indexOf(UI.goalForm.amount);
      UI.goalForm.amount = options[(index + 1) % options.length];
      refresh();
    },

    /* --- 习惯 --- */
    "habit-add": () => {
      UI.habitForm = { name: "", emoji: "🍅", color: "#e0a1b4", days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"], word: "坚持就是胜利" };
      push("habitPick");
    },
    "habit-save": () => {
      captureHabit();
      const form = UI.habitForm;
      if (!String(form.name || "").trim()) {
        ui.toast("请先给习惯命名");
        return;
      }
      S.addHabit({ ...form, name: form.name.trim() });
      while (stack.length > 1 && current().name !== "habits") back();
      ui.toast("习惯已添加");
    },

    /* --- 我的 / 设置 --- */
    "open-settings": () => push("settings"),
    "open-cats": () => push("categories"),
    "open-modules": () => push("modules"),
    "open-data": () => push("dataSettings"),
    "open-about": () => push("about"),
    "open-perms": () => push("perms"),
    theme: openTheme,
    works: () => push("works"),
    "mine-vip": () => ui.toast("会员体验期剩余7天"),
    logout: () =>
      ui.dialog({
        title: "退出登录",
        content: "退出后将清空本机保存的全部记录，是否继续？",
        actions: [
          { label: "取消" },
          {
            label: "退出",
            onClick: () => {
              S.reset();
              applyTheme(T.STATE.theme);
              goRoot("mine");
              ui.toast("已退出登录");
            },
          },
        ],
      }),
    "toggle-backup": () => toggleSetting("autoBackup"),
    "export-excel": () => exportData("csv"),
    "export-txt": () => exportData("txt"),
    "cat-add": () =>
      ui.dialog({
        title: "添加时间分类",
        content: `<input id="newcat" placeholder="分类名称" style="width:100%;border:1px solid #e6e6e6;border-radius:4px;padding:9px 10px;font-size:15px" />`,
        actions: [
          { label: "取消" },
          {
            label: "保存",
            onClick: () => {
              const name = (phone.querySelector("#newcat") || {}).value || "";
              if (!String(name).trim()) {
                ui.toast("名称不能为空");
                return;
              }
              S.addCategory({ name: name.trim() });
              refresh();
            },
          },
        ],
      }),
    "sched-add": () => ui.toast("添加日程：敬请期待"),
    "sched-cal": () => ui.toast("日程日历：敬请期待"),
    "menu-item": () => ui.toast("该功能需要系统级能力，当前版本暂未实现"),
  };

  /* ================= 绑定表 ================= */
  const BINDINGS = [
    [
      "[data-tab]",
      (el) => {
        const key = el.dataset.tab;
        if (!tabEnabled(key)) {
          ui.toast("该模块尚未启用");
          return;
        }
        goRoot(key);
      },
    ],
    [
      "[data-stab]",
      (el) => {
        S.setStatsTab(el.dataset.stab);
        refresh();
        if (el.dataset.stab === "custom") openCustomRange();
      },
    ],
    [
      "[data-wheel-step]",
      (el) => {
        const form = UI.addForm;
        if (!form) return;
        const field = el.dataset.wheelStep;
        const step = Number(el.dataset.step) || 0;
        if (field === "sh") form.startMin += step * 60;
        if (field === "sm") form.startMin += step;
        if (field === "eh") form.endMin += step * 60;
        if (field === "em") form.endMin += step;
        form.startMin = ((form.startMin % C.MINUTES_PER_DAY) + C.MINUTES_PER_DAY) % C.MINUTES_PER_DAY;
        form.endMin = ((form.endMin % C.MINUTES_PER_DAY) + C.MINUTES_PER_DAY) % C.MINUTES_PER_DAY;
        captureAddNote();
        refresh();
      },
    ],
    ["[data-addtab]", (el) => { UI.addForm.tab = el.dataset.addtab; captureAddNote(); refresh(); }],
    ["[data-addcat]", (el) => { UI.addForm.cat = el.dataset.addcat; refresh(); }],
    ["[data-gcat]", (el) => { UI.goalForm.cat = el.dataset.gcat; refresh(); }],
    ["[data-gtimer]", (el) => { UI.goalForm.timer = el.dataset.gtimer; refresh(); }],
    ["[data-gmode]", (el) => { UI.goalForm.mode = el.dataset.gmode; refresh(); }],
    ["[data-gcycle]", (el) => { UI.goalForm.cycle = el.dataset.gcycle; refresh(); }],
    ["[data-cmode]", (el) => { S.setChartMode(el.dataset.cmode); refresh(); }],
    [
      "[data-theme]",
      (el) => {
        S.setTheme(el.dataset.theme);
        applyTheme(T.STATE.theme);
        ui.closeAll();
        refresh();
      },
    ],
    [
      "[data-preset]",
      (el) => {
        UI.habitForm.name = el.dataset.preset;
        UI.habitForm.emoji = el.dataset.emoji;
        UI.habitForm.color = el.dataset.bg;
        back();
        push("habitAdd", { habitForm: UI.habitForm });
      },
    ],
    ["[data-hcolor]", (el) => { UI.habitForm.color = el.dataset.hcolor; captureHabit(); refresh(); }],
    ["[data-hemoji]", (el) => { UI.habitForm.emoji = el.dataset.hemoji; captureHabit(); refresh(); }],
    [
      "[data-hday]",
      (el) => {
        const day = el.dataset.hday;
        const days = UI.habitForm.days;
        const index = days.indexOf(day);
        if (index >= 0) days.splice(index, 1);
        else days.push(day);
        captureHabit();
        refresh();
      },
    ],
    ["[data-cat]", () => ui.toast("分类详情：敬请期待")],
    ["[data-dlg]", () => {}],
    [
      "[data-act]",
      (el, event) => {
        const handler = ACTIONS[el.dataset.act];
        if (handler) handler(el, event);
      },
    ],
  ];

  const onDocumentClick = (event) => {
    for (const [selector, handler] of BINDINGS) {
      const target = event.target.closest(selector);
      if (target) {
        handler(target, event);
        return;
      }
    }
  };

  const INPUT_HANDLERS = {
    "add-note": (value) => {
      if (UI.addForm) UI.addForm.note = value;
    },
    "habit-name": (value) => {
      UI.habitForm.name = value;
    },
    "habit-word": (value) => {
      UI.habitForm.word = value;
    },
    "search-input": (value) => searchRecords(value),
  };

  document.addEventListener("click", onDocumentClick);
  document.addEventListener("input", (event) => {
    const handler = INPUT_HANDLERS[event.target.id];
    if (handler) handler(event.target.value);
  });
  /* 键盘可达性：可点击但非原生按钮的节点支持 Enter / Space 触发 */
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target.closest && event.target.closest("[data-act],[data-tab]");
    if (!target || target.tagName === "BUTTON" || target.tagName === "INPUT") return;
    event.preventDefault();
    target.click();
  });

  /* ================= 分钟级心跳 ================= */
  let tickHandle = null;
  const stopTick = () => {
    if (tickHandle) clearTimeout(tickHandle);
    tickHandle = null;
  };

  function scheduleTick() {
    stopTick();
    if (!T.STATE.timer) return;
    const now = Date.now();
    const delay = 60000 - (now % 60000) + 60;
    tickHandle = setTimeout(() => {
      onMinute();
      scheduleTick();
    }, delay);
  }

  function onMinute() {
    if (!T.STATE.timer) return;
    const top = current();
    if (!top) return;
    if (top.name === "home") {
      refresh();
      return;
    }
    const live = phone.querySelector('[data-live="timer"]');
    if (live) live.textContent = `${S.elapsedMinutes()}分钟`;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopTick();
      S.flush();
    } else if (T.STATE.timer) {
      scheduleTick();
    }
  });

  /* ================= 启动 ================= */
  goRoot("home");
  scheduleTick();

  /* 调试 / 测试出口：只暴露只读状态与受控方法 */
  window.__APP = {
    goRoot,
    push,
    back,
    refresh,
    toast: (message) => ui.toast(message),
    dialog: (options) => ui.dialog(options),
    stack: () => stack.map((entry) => entry.name),
    state: () => T.STATE,
    store: S,
  };
  window.APP_READY = true;
})();
