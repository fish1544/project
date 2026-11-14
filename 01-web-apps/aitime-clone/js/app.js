/* 应用层：路由、事件、数据操作、弹窗 */
(function () {
  const A = window.AITIME;
  const screensEl = document.getElementById("screens");
  const phone = document.getElementById("phone");

  A.loadState();
  applyTheme(A.STATE.theme);

  let stack = [];

  /* ---------- 基础工具 ---------- */
  function elFrom(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  function applyTheme(color) {
    document.documentElement.style.setProperty("--teal", color);
  }

  function toast(msg) {
    const old = phone.querySelector(".toast");
    if (old) old.remove();
    const t = elFrom(`<div class="toast">${msg}</div>`);
    phone.appendChild(t);
    setTimeout(() => t.remove(), 1900);
  }

  function dialog({ title, content = "", actions = [], wide = false }) {
    const mask = elFrom(`<div class="dialog-mask">
      <div class="dialog" ${wide ? 'style="max-width:330px"' : ""}>
        <div class="dt">${title}</div>
        <div class="dc">${content}</div>
        <div class="dacts">${actions.map((a, i) => `<button data-dlg="${i}">${a.label}</button>`).join("")}</div>
      </div>
    </div>`);
    phone.appendChild(mask);
    mask.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dlg]");
      if (btn) {
        const i = Number(btn.dataset.dlg);
        const act = actions[i];
        mask.remove();
        act && act.onClick && act.onClick();
      } else if (e.target === mask) {
        mask.remove();
      }
    });
    return mask;
  }

  function pop(items, opts = {}) {
    closePop();
    const top = current();
    if (!top) return;
    const mask = elFrom(`<div class="mask"></div>`);
    const box = elFrom(`<div class="pop">${items
      .map((it, i) => `<div class="pi" data-pop="${i}">${it.check ? `<span>${it.label}</span><span class="cb ${it.checked ? "on" : ""}"></span>` : it.label}</div>`)
      .join("")}</div>`);
    top.el.appendChild(mask);
    top.el.appendChild(box);
    mask.addEventListener("click", closePop);
    box.addEventListener("click", (e) => {
      const pi = e.target.closest("[data-pop]");
      if (!pi) return;
      const it = items[Number(pi.dataset.pop)];
      closePop();
      it.onClick && it.onClick();
    });
    function closePop() {
      const m = phone.querySelector(".mask");
      if (m) m.remove();
      const b = phone.querySelector(".pop");
      if (b) b.remove();
    }
    window.__closePop = closePop;
  }

  /* ---------- 路由 ---------- */
  function current() {
    return stack[stack.length - 1];
  }

  function push(name, params, silent) {
    const prev = current();
    const el = elFrom(SCREENS[name] ? SCREENS[name](params || {}) : `<div class="screen">404</div>`);
    screensEl.appendChild(el);
    stack.push({ name, params: params || {}, el });
    if (silent) {
      el.classList.add("active");
      if (prev) {
        prev.el.classList.remove("active", "behind");
        prev.el.style.display = "none";
      }
    } else {
      requestAnimationFrame(() => {
        el.classList.add("active");
        if (prev) {
          prev.el.classList.remove("active");
          prev.el.classList.add("behind");
        }
      });
    }
    return el;
  }

  function back() {
    if (stack.length <= 1) return;
    const top = stack.pop();
    top.el.classList.remove("active");
    const prev = current();
    if (prev) {
      /* 返回时重绘上一屏，保证数据（记录/目标/习惯）立即反映 */
      const fresh = elFrom(SCREENS[prev.name] ? SCREENS[prev.name](prev.params || {}) : `<div class="screen">404</div>`);
      fresh.style.display = "";
      fresh.classList.add("active");
      prev.el.replaceWith(fresh);
      prev.el = fresh;
    }
    setTimeout(() => top.el.remove(), 280);
  }

  function refresh() {
    const top = current();
    if (!top) return;
    const el = elFrom(SCREENS[top.name] ? SCREENS[top.name](top.params || {}) : `<div class="screen">404</div>`);
    el.classList.add("active");
    top.el.replaceWith(el);
    top.el = el;
  }

  function goRoot(name, params) {
    while (stack.length) {
      const top = stack.pop();
      top.el.remove();
    }
    push(name, params, true);
  }

  /* ---------- 表单状态 ---------- */
  const UI = {
    addForm: null,
    goalForm: { cat: "sleep", timer: "正计时", mode: "普通模式", cycle: "长目标", from: A.todayKey(), to: A.shiftDate(A.todayKey(), 30), amount: "2小时" },
    habitForm: { name: "", emoji: "🍅", color: "#e0a1b4", days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"], word: "坚持就是胜利" },
    editingRecord: null,
  };

  function defaultAddForm(over) {
    const now = A.nowMinutes();
    return Object.assign(
      {
        startMin: 0,
        endMin: now,
        cat: (A.STATE.categories.find((c) => !c.archived) || A.CATS[0]).id,
        tab: "cat",
        note: "",
      },
      over || {}
    );
  }

  /* ---------- 事件 ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const tabBtn = t.closest("[data-tab]");
    if (tabBtn) {
      const k = tabBtn.dataset.tab;
      if (k !== "mine" && A.STATE.settings.modules.indexOf(tabName(k)) === -1) {
        toast("该模块尚未启用");
        return;
      }
      goRoot(k);
      return;
    }

    const stab = t.closest("[data-stab]");
    if (stab) {
      A.STATE.statsTab = stab.dataset.stab;
      A.saveState();
      if (A.STATE.statsTab === "custom") openCustomRange();
      refresh();
      return;
    }

    const wheel = t.closest("[data-wheel-step]");
    if (wheel) {
      const f = UI.addForm;
      const field = wheel.dataset.wheelStep;
      const step = Number(wheel.dataset.step);
      const max = field === "sh" || field === "eh" ? 24 : 60;
      if (field === "sh") f.startMin += step * 60;
      if (field === "sm") f.startMin += step;
      if (field === "eh") f.endMin += step * 60;
      if (field === "em") f.endMin += step;
      f.startMin = ((f.startMin % 1440) + 1440) % 1440;
      f.endMin = ((f.endMin % 1440) + 1440) % 1440;
      captureAddNote();
      refresh();
      return;
    }

    const addTab = t.closest("[data-addtab]");
    if (addTab) {
      UI.addForm.tab = addTab.dataset.addtab;
      creditAdd();
      refresh();
      return;
    }

    const addCat = t.closest("[data-addcat]");
    if (addCat) {
      UI.addForm.cat = addCat.dataset.addcat;
      refresh();
      return;
    }

    const gcat = t.closest("[data-gcat]");
    if (gcat) {
      UI.goalForm.cat = gcat.dataset.gcat;
      refresh();
      return;
    }

    const gtimer = t.closest("[data-gtimer]");
    if (gtimer) {
      UI.goalForm.timer = gtimer.dataset.gtimer;
      refresh();
      return;
    }

    const gmode = t.closest("[data-gmode]");
    if (gmode) {
      UI.goalForm.mode = gmode.dataset.gmode;
      refresh();
      return;
    }

    const gcycle = t.closest("[data-gcycle]");
    if (gcycle) {
      UI.goalForm.cycle = gcycle.dataset.gcycle;
      refresh();
      return;
    }

    const cmode = t.closest("[data-cmode]");
    if (cmode) {
      A.STATE.chartMode = cmode.dataset.cmode;
      A.saveState();
      refresh();
      return;
    }

    const themeSw = t.closest("[data-theme]");
    if (themeSw) {
      A.STATE.theme = themeSw.dataset.theme;
      applyTheme(A.STATE.theme);
      A.saveState();
      const m = phone.querySelector(".dialog-mask");
      if (m) m.remove();
      refresh();
      return;
    }

    const preset = t.closest("[data-preset]");
    if (preset) {
      UI.habitForm.name = preset.dataset.preset;
      UI.habitForm.emoji = preset.dataset.emoji;
      UI.habitForm.color = preset.dataset.bg;
      back();
      push("habitAdd", { habitForm: UI.habitForm });
      return;
    }

    const hcolor = t.closest("[data-hcolor]");
    if (hcolor) {
      UI.habitForm.color = hcolor.dataset.hcolor;
      captureHabit();
      refresh();
      return;
    }

    const hemoji = t.closest("[data-hemoji]");
    if (hemoji) {
      UI.habitForm.emoji = hemoji.dataset.hemoji;
      captureHabit();
      refresh();
      return;
    }

    const hday = t.closest("[data-hday]");
    if (hday) {
      const d = hday.dataset.hday;
      const arr = UI.habitForm.days;
      const i = arr.indexOf(d);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(d);
      captureHabit();
      refresh();
      return;
    }

    const catRow = t.closest("[data-cat]");
    if (catRow) {
      toast("分类详情：敬请期待");
      return;
    }

    const dlgBtn = t.closest("[data-dlg]");
    if (dlgBtn) return;

    const actEl = t.closest("[data-act]");
    if (!actEl) return;
    const act = actEl.dataset.act;
    handleAct(act, actEl, e);
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "add-note") UI.addForm && (UI.addForm.note = e.target.value);
    if (e.target.id === "habit-name") UI.habitForm.name = e.target.value;
    if (e.target.id === "habit-word") UI.habitForm.word = e.target.value;
    if (e.target.id === "search-input") doSearch(e.target.value);
  });

  function tabName(k) {
    return { home: "时间", goals: "目标", schedule: "日程", habits: "习惯", mine: "我的" }[k] || "";
  }

  function captureAddNote() {
    const inp = phone.querySelector("#add-note");
    if (inp && UI.addForm) UI.addForm.note = inp.value;
  }
  function creditAdd() {
    captureAddNote();
  }
  function captureHabit() {
    const n = phone.querySelector("#habit-name");
    const w = phone.querySelector("#habit-word");
    if (n) UI.habitForm.name = n.value;
    if (w) UI.habitForm.word = w.value;
  }

  function handleAct(act, actEl) {
    const st = A.STATE;
    switch (act) {
      case "back":
        back();
        break;

      /* --- 时间页 --- */
      case "date-prev":
        st.viewDate = A.shiftDate(st.viewDate, -1);
        A.saveState();
        refresh();
        break;
      case "date-next": {
        const nx = A.shiftDate(st.viewDate, 1);
        if (nx > A.todayKey()) {
          toast("明天还未到来~");
          break;
        }
        st.viewDate = nx;
        A.saveState();
        refresh();
        break;
      }
      case "date-today":
        st.viewDate = A.todayKey();
        A.saveState();
        refresh();
        break;
      case "home-tools":
        toast("时间轴视图：敬请期待");
        break;
      case "open-stats":
        push("stats");
        break;
      case "home-menu":
        pop(
          [
            { label: "使用秘籍", onClick: () => toast("使用秘籍：敬请期待") },
            { label: "分享", onClick: () => toast("已复制分享文案") },
            { label: "搜索", onClick: () => push("search") },
            { label: "周视图", onClick: () => push("weekview") },
            { label: "早起打卡", onClick: earlyCheck },
            { label: "睡前复盘", onClick: () => toast("睡前复盘：敬请期待") },
            { label: "开始睡觉", onClick: startSleep },
            { label: "夜间睡眠统计", onClick: () => push("night") },
            { label: "个性化时间轴", onClick: () => toast("个性化时间轴：敬请期待") },
            { label: "个性化概览页", onClick: () => push("overview") },
            {
              label: "显示底部按钮",
              check: true,
              checked: st.settings.showBottomButtons,
              onClick: () => {
                st.settings.showBottomButtons = !st.settings.showBottomButtons;
                A.saveState();
                refresh();
              },
            },
          ]
        );
        break;
      case "pill-add":
        UI.addForm = defaultAddForm();
        UI.editingRecord = null;
        push("add", { form: UI.addForm });
        break;
      case "pill-start": {
        const last = st.records.length ? st.records[st.records.length - 1].cat : "work";
        st.timer = { cat: last, startAt: Date.now() };
        A.saveState();
        toast("开始计时");
        refresh();
        tick();
        break;
      }
      case "pill-open":
        UI.addForm = defaultAddForm({ cat: st.timer ? st.timer.cat : "work" });
        UI.editingRecord = null;
        push("add", { form: UI.addForm });
        break;
      case "pill-end": {
        if (!st.timer) {
          toast("当前没有进行中的计时");
          break;
        }
        const s = st.timer;
        const d = new Date(s.startAt);
        const sm = d.getHours() * 60 + d.getMinutes();
        let em = A.nowMinutes();
        let len = em - sm;
        if (len <= 0) len = 1;
        pushRecord({ date: A.todayKey(), cat: s.cat, start: sm, end: sm + len, note: "计时器记录" });
        st.timer = null;
        A.saveState();
        toast("已结束并保存");
        refresh();
        break;
      }
      case "pill-running":
        toast("计时中…");
        break;

      /* --- 记录行 --- */
      case "open-stats":
        push("stats");
        break;

      /* --- 统计 --- */
      case "stats-prev": {
        const tab = st.statsTab;
        const d = A.fromKey(st.viewDate);
        if (tab === "year") d.setFullYear(d.getFullYear() - 1);
        else if (tab === "month") d.setMonth(d.getMonth() - 1);
        else if (tab === "week") d.setDate(d.getDate() - 7);
        else if (tab === "day") d.setDate(d.getDate() - 1);
        st.viewDate = A.dateKey(d);
        A.saveState();
        refresh();
        break;
      }
      case "stats-menu":
        pop([
          { label: "年终总结", onClick: () => push("annual") },
          { label: "年视图", onClick: () => push("yearview") },
          { label: "图表视图", onClick: () => push("chart") },
          { label: "睡眠统计", onClick: () => push("night") },
        ]);
        break;
      case "open-chart":
        push("chart");
        break;
      case "chart-menu":
        pop([
          { label: "选中今日剩余", check: true, checked: st.settings.chartSelectedRest, onClick: () => toggleSetting("chartSelectedRest") },
          { label: "时间倒序", check: true, checked: st.settings.chartReverse, onClick: () => toggleSetting("chartReverse") },
          { label: "隐藏未记录", check: true, checked: st.settings.chartHideUnrec, onClick: () => toggleSetting("chartHideUnrec") },
          { label: "不显示列表", check: true, checked: !st.settings.chartList, onClick: () => toggleSetting("chartList") },
          { label: "不显示图形", check: true, checked: !st.settings.chartGraph, onClick: () => toggleSetting("chartGraph") },
        ]);
        break;
      case "chart-use":
        toast("已应用该图表样式");
        break;
      case "ov-menu":
        pop([{ label: "显示底部按钮", check: true, checked: st.settings.showBottomButtons, onClick: () => toggleSetting("showBottomButtons") }]);
        break;

      /* --- 添加记录 --- */
      case "add-today":
        UI.addForm.startMin = 0;
        UI.addForm.endMin = A.nowMinutes();
        captureAddNote();
        refresh();
        break;
      case "add-save": {
        captureAddNote();
        const f = UI.addForm;
        let len = f.endMin - f.startMin;
        if (len <= 0) len += 1440;
        if (len <= 0 || len > 1440) {
          toast("结束时间需晚于开始时间");
          break;
        }
        if (UI.editingRecord) {
          const r = A.STATE.records.find((x) => x.id === UI.editingRecord);
          if (r) {
            r.cat = f.cat;
            r.start = f.startMin;
            r.end = f.endMin;
            r.note = f.note;
          }
        } else {
          pushRecord({ date: A.STATE.viewDate, cat: f.cat, start: f.startMin, end: f.endMin, note: f.note });
        }
        A.saveState();
        back();
        UI.editingRecord = null;
        toast("已保存");
        break;
      }
      case "add-editcats":
        push("categories");
        break;

      /* --- 目标 --- */
      case "goal-add":
        push("goalAdd");
        break;
      case "goal-menu":
        pop([{ label: "目标排序", onClick: () => toast("排序：敬请期待") }, { label: "目标教程", onClick: () => toast("教程：敬请期待") }]);
        break;
      case "goal-save": {
        const f = UI.goalForm;
        const cat = A.catOf(f.cat);
        const cycleText = f.cycle === "长目标" ? `从${f.from}到${f.to}完成${f.amount}` : `${f.cycle}不少于${f.amount}`;
        A.STATE.goals.push({
          id: A.uid(),
          cat: f.cat,
          name: cat.name,
          cycleText,
          todayText: "今日0分钟",
          progress: 0,
        });
        A.saveState();
        back();
        toast("目标已创建");
        break;
      }
      case "goal-start": {
        const gid = actEl.dataset.goal;
        const g = A.STATE.goals.find((x) => x.id === gid);
        if (g) {
          A.STATE.timer = { cat: g.cat, startAt: Date.now() };
          A.saveState();
          toast(`开始计时：${g.name}`);
          goRoot("home");
        }
        break;
      }
      case "goal-from":
      case "goal-to": {
        const key = act === "goal-from" ? "from" : "to";
        const v = UI.goalForm[key];
        const d = A.fromKey(v);
        d.setDate(d.getDate() + 1);
        UI.goalForm[key] = A.dateKey(d);
        refresh();
        break;
      }
      case "goal-amount": {
        const opts = ["30分钟", "1小时", "2小时", "4小时"];
        const i = opts.indexOf(UI.goalForm.amount);
        UI.goalForm.amount = opts[(i + 1) % opts.length];
        refresh();
        break;
      }

      /* --- 习惯 --- */
      case "habit-add":
        UI.habitForm = { name: "", emoji: "🍅", color: "#e0a1b4", days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"], word: "坚持就是胜利" };
        push("habitPick");
        break;
      case "habit-save": {
        captureHabit();
        const f = UI.habitForm;
        if (!f.name.trim()) {
          toast("请先给习惯命名");
          break;
        }
        A.STATE.habits.push({ id: A.uid(), name: f.name.trim(), emoji: f.emoji, color: f.color, days: f.days.slice(), word: f.word, checks: {} });
        A.saveState();
        while (!(current().name === "habits")) back();
        toast("习惯已添加");
        break;
      }

      /* --- 我的 / 设置 --- */
      case "open-settings":
        push("settings");
        break;
      case "open-cats":
        push("categories");
        break;
      case "open-modules":
        push("modules");
        break;
      case "open-data":
        push("dataSettings");
        break;
      case "open-about":
        push("about");
        break;
      case "open-perms":
        push("perms");
        break;
      case "theme":
        openTheme();
        break;
      case "works":
        push("works");
        break;
      case "mine-vip":
        toast("会员体验期剩余7天");
        break;
      case "logout":
        dialog({
          title: "退出登录",
          content: "退出后将清空本机保存的全部记录，是否继续？",
          actions: [
            { label: "取消" },
            {
              label: "退出",
              onClick: () => {
                localStorage.removeItem(A.DB_KEY);
                A.STATE = A.defaultState();
                applyTheme(A.STATE.theme);
                goRoot("mine");
                toast("已退出登录");
              },
            },
          ],
        });
        break;
      case "toggle-backup":
        st.settings.autoBackup = !st.settings.autoBackup;
        A.saveState();
        refresh();
        break;
      case "export-excel":
        exportData("csv");
        break;
      case "export-txt":
        exportData("txt");
        break;
      case "cat-add":
        dialog({
          title: "添加时间分类",
          content: `<input id="newcat" placeholder="分类名称" style="width:100%;border:1px solid #e6e6e6;border-radius:4px;padding:9px 10px;font-size:15px" />`,
          actions: [
            { label: "取消" },
            {
              label: "保存",
              onClick: () => {
                const v = (phone.querySelector("#newcat") || {}).value || "";
                if (!v.trim()) return toast("名称不能为空");
                A.STATE.categories.push({ id: A.uid(), name: v.trim(), color: A.THEMES[A.STATE.categories.length % A.THEMES.length], archived: false });
                A.saveState();
                refresh();
              },
            },
          ],
        });
        break;
      case "sched-add":
        toast("添加日程：敬请期待");
        break;
      case "menu-item":
        toast("该功能在原应用中依赖系统能力，此处仅还原界面");
        break;
      default:
        break;
    }
  }

  function toggleSetting(key) {
    const s = A.STATE.settings;
    s[key] = !s[key];
    A.saveState();
    refresh();
  }

  function pushRecord({ date, cat, start, end, note }) {
    A.STATE.records.push({ id: A.uid(), date, cat, start, end, note: note || "", important: false });
  }

  function earlyCheck() {
    dialog({
      title: "早起打卡",
      content: "你已经错过了今天的早起打卡时间了（04:00~10:00），补打卡需要消耗200坚果，是否进行补打卡？",
      actions: [
        { label: "取消" },
        { label: "确定", onClick: () => toast("补打卡成功，消耗200坚果") },
      ],
    });
  }

  function startSleep() {
    const sm = A.nowMinutes();
    A.STATE.timer = { cat: "sleep", startAt: Date.now() };
    A.saveState();
    toast("已开始睡觉，晚安~");
    refresh();
    tick();
  }

  function openTheme() {
    const mask = elFrom(`<div class="dialog-mask">
      <div class="dialog" style="max-width:320px">
        <div class="dt">更换主题</div>
        <div class="theme-grid">
          ${A.THEMES.map(
            (c) =>
              `<div class="tg ${A.STATE.theme.toLowerCase() === c ? "on" : ""}" data-theme="${c}" style="background:${c}">${A.STATE.theme.toLowerCase() === c ? ICONS.check() : ""}</div>`
          ).join("")}
        </div>
        <div style="height:12px"></div>
      </div>
    </div>`);
    phone.appendChild(mask);
    mask.addEventListener("click", (e) => {
      if (e.target === mask) mask.remove();
    });
  }

  function openCustomRange() {
    const from = A.todayKey();
    const to = A.todayKey();
    const rowHtml = (label, key, d) =>
      `<div style="display:flex;align-items:center;gap:8px;margin:10px 0;justify-content:flex-end">
        <span style="color:#888">${label}</span>
        <span data-cr="${key}" data-f="y" style="color:#72b7d2">${d.getFullYear()}</span><span>年</span>
        <span data-cr="${key}" data-f="m" style="color:#72b7d2">${d.getMonth() + 1}</span><span>月</span>
        <span data-cr="${key}" data-f="d" style="color:#72b7d2">${d.getDate()}</span><span>日</span>
      </div>`;
    const mask = elFrom(`<div class="dialog-mask"><div class="dialog">
      <div class="dt">自定义</div>
      <div class="dc" style="font-size:15px">${rowHtml("从", "from", A.fromKey(from))}${rowHtml("到", "to", A.fromKey(to))}</div>
      <div class="dacts"><button data-cancel>取消</button><button data-ok>完成</button></div>
    </div></div>`);
    phone.appendChild(mask);
    const draft = { from: A.fromKey(from), to: A.fromKey(to) };
    mask.addEventListener("click", (e) => {
      const cr = e.target.closest("[data-cr]");
      if (cr) {
        const k = cr.dataset.cr;
        const f = cr.dataset.f;
        const d = draft[k];
        if (f === "y") d.setFullYear(d.getFullYear() + 1);
        if (f === "m") d.setMonth(d.getMonth() + 1);
        if (f === "d") d.setDate(d.getDate() + 1);
        mask.querySelector(`[data-cr="${k}"][data-f="y"]`).textContent = d.getFullYear();
        mask.querySelector(`[data-cr="${k}"][data-f="m"]`).textContent = d.getMonth() + 1;
        mask.querySelector(`[data-cr="${k}"][data-f="d"]`).textContent = d.getDate();
        return;
      }
      if (e.target.closest("[data-cancel]") || e.target === mask) mask.remove();
      if (e.target.closest("[data-ok]")) {
        A.STATE.customFrom = A.dateKey(draft.from);
        A.STATE.customTo = A.dateKey(draft.to);
        A.saveState();
        toast(`已选择 ${A.STATE.customFrom} ~ ${A.STATE.customTo}`);
        mask.remove();
      }
    });
  }

  function exportData(kind) {
    const rows = [["日期", "分类", "开始", "结束", "时长(分钟)", "备注"]];
    A.STATE.records.forEach((r) => {
      const c = A.catOf(r.cat);
      const nr = A.normRange(r);
      rows.push([r.date, c.name, A.fmtClock(nr.start), A.fmtClock(nr.start + nr.len), nr.len, r.note || ""]);
    });
    const text = rows.map((r) => r.join(kind === "csv" ? "," : "\t")).join("\r\n");
    const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `aitime_records.${kind === "csv" ? "csv" : "txt"}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast("已导出到下载目录");
  }

  function doSearch(q) {
    const box = phone.querySelector("#search-result");
    if (!box) return;
    const kw = q.trim();
    if (!kw) {
      box.innerHTML = "";
      return;
    }
    const hits = A.STATE.records.filter((r) => {
      const c = A.catOf(r.cat);
      return (r.note || "").includes(kw) || c.name.includes(kw);
    });
    box.innerHTML = hits.length
      ? hits
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .map((r) => {
            const c = A.catOf(r.cat);
            const nr = A.normRange(r);
            return `<div class="rec"><span class="cdot" style="background:${c.color}"></span>
              <div class="rc-main"><div class="rc-1"><span class="rc-cat">${c.name}</span><span class="rc-time">${r.date} ${A.fmtClock(nr.start)}~${A.fmtClock(nr.start + nr.len)}</span></div>
              ${r.note ? `<div class="rc-2">${r.note}</div>` : ""}</div>
              <span class="rc-dur">${A.fmtDur(nr.len)}</span></div>`;
          })
          .join("")
      : `<div class="empty"><div class="etxt">没有找到相关记录</div></div>`;
  }

  /* ---------- 计时器心跳 ---------- */
  let lastMin = -1;
  function tick() {
    clearInterval(window.__tick);
    window.__tick = setInterval(() => {
      if (!A.STATE.timer) return;
      const m = Math.floor((Date.now() - A.STATE.timer.startAt) / 60000);
      if (m !== lastMin) {
        lastMin = m;
        const top = current();
        if (top && top.name === "home") refresh();
      }
    }, 20000);
  }

  /* ---------- 启动 ---------- */
  goRoot("home");
  if (A.STATE.timer) tick();

  window.__APP = { goRoot, push, back, refresh, toast, dialog, state: () => A.STATE };
})();
