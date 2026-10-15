// ============================================================
// 实时时间系统
// 功能：实时时钟、学期周次、今日课程状态、课表高亮、习惯网格高亮
// ============================================================
(function() {
  var DAY_MAP = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun' };
  var DAY_LABELS = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 0: '周日' };

  function getSemesterWeek() {
    if (!schedData || !schedData.meta || !schedData.meta.semesterStart) return 1;
    var start = new Date(schedData.meta.semesterStart);
    start.setHours(0, 0, 0, 0);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var diffDays = Math.floor((now - start) / 86400000);
    if (diffDays < 0) return 0;
    return Math.floor(diffDays / 7) + 1;
  }

  function getWeekProgress() {
    if (!schedData || !schedData.meta) return 0;
    var start = new Date(schedData.meta.semesterStart);
    start.setHours(0, 0, 0, 0);
    var now = new Date();
    var diffDays = Math.floor((now - start) / 86400000);
    var totalDays = (schedData.meta.totalWeeks || 16) * 7;
    return Math.min(100, Math.max(0, Math.round(diffDays / totalDays * 100)));
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function getNow() {
    var d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      date: d.getDate(),
      day: d.getDay(),
      dayKey: DAY_MAP[d.getDay()],
      dayLabel: DAY_LABELS[d.getDay()],
      hours: d.getHours(),
      minutes: d.getMinutes(),
      seconds: d.getSeconds(),
      timeStr: pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()),
      dateStr: d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日',
      weekNum: getSemesterWeek()
    };
  }

  function parseTimeRange(timeStr) {
    var parts = timeStr.split('-');
    if (parts.length !== 2) return null;
    var sParts = parts[0].trim().split(':');
    var eParts = parts[1].trim().split(':');
    return {
      startH: parseInt(sParts[0]), startM: parseInt(sParts[1]),
      endH: parseInt(eParts[0]), endM: parseInt(eParts[1])
    };
  }

  function getTimeStatus(timeStr, now) {
    var t = parseTimeRange(timeStr);
    if (!t) return 'unknown';
    var nowMin = now.hours * 60 + now.minutes;
    var startMin = t.startH * 60 + t.startM;
    var endMin = t.endH * 60 + t.endM;
    if (nowMin < startMin) {
      var diff = startMin - nowMin;
      if (diff <= 10) return 'soon';
      return 'upcoming';
    }
    if (nowMin >= startMin && nowMin <= endMin) return 'ongoing';
    return 'ended';
  }

  function statusLabel(status) {
    switch(status) {
      case 'ongoing': return { text: '正在进行', cls: 'rs-ongoing' };
      case 'soon': return { text: '即将开始', cls: 'rs-soon' };
      case 'upcoming': return { text: '待上', cls: 'rs-upcoming' };
      case 'ended': return { text: '已结束', cls: 'rs-ended' };
      default: return { text: '', cls: '' };
    }
  }

  function isClassInWeeks(weeksStr, weekNum) {
    if (!weeksStr) return true;
    var parts = weeksStr.split(',');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (p.indexOf('-') !== -1) {
        var range = p.split('-');
        var s = parseInt(range[0]);
        var e = parseInt(range[1]);
        if (weekNum >= s && weekNum <= e) return true;
      } else {
        if (weekNum === parseInt(p)) return true;
      }
    }
    return false;
  }

  function getTodayClasses(now) {
    if (!schedData || !schedData.grid || !schedData.grid[now.dayKey]) return [];
    var dayGrid = schedData.grid[now.dayKey];
    var classes = [];
    schedData.timeSlots.forEach(function(slot) {
      var entry = dayGrid[slot.id];
      if (entry && isClassInWeeks(entry.weeks, now.weekNum)) {
        var status = getTimeStatus(slot.time, now);
        classes.push({
          slotId: slot.id,
          slotLabel: slot.label,
          time: slot.time,
          subject: entry.subject,
          location: entry.location,
          weeks: entry.weeks,
          teacher: (schedData.subjects[entry.subject] || {}).teacher || '',
          color: (schedData.subjects[entry.subject] || {}).color || 'purple',
          status: status
        });
      }
    });
    return classes;
  }

  // ===== Render: Status Bar =====
  function renderStatusBar() {
    var el = document.getElementById('realtime-status');
    if (!el) return;
    var now = getNow();

    var weekInfo = now.weekNum > 0 && now.weekNum <= (schedData.meta.totalWeeks || 16)
      ? '第' + now.weekNum + '周'
      : now.weekNum === 0 ? '未开学' : '已放假';

    el.innerHTML =
      '<div class="rt-clock">' + now.timeStr + '</div>' +
      '<div class="rt-date">' + now.dateStr + ' ' + now.dayLabel + '</div>' +
      '<div class="rt-week">' + weekInfo + '</div>';
  }


  // ===== Render: Semester Progress =====
  function renderSemesterProgress() {
    var el = document.getElementById('realtime-semester');
    if (!el) return;
    var now = getNow();
    var progress = getWeekProgress();
    var totalWeeks = (schedData.meta.totalWeeks || 16);
    var weekLabel = now.weekNum > 0 && now.weekNum <= totalWeeks
      ? '第 ' + now.weekNum + ' / ' + totalWeeks + ' 周'
      : '不在学期内';

    el.innerHTML =
      '<div class="rt-sem-row">' +
        '<span class="rt-sem-label">学期进度</span>' +
        '<span class="rt-sem-week">' + weekLabel + '</span>' +
        '<span class="rt-sem-pct">' + progress + '%</span>' +
      '</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>';
  }

  // ===== Render: Schedule Grid Highlight =====
  function renderScheduleHighlight() {
    var now = getNow();
    var todayKey = now.dayKey;

    // Highlight today's column header
    document.querySelectorAll('.sched-day-header').forEach(function(h) {
      h.classList.remove('sched-today-header');
      if (h.getAttribute('data-day') === todayKey) {
        h.classList.add('sched-today-header');
      }
    });

    // Highlight current/ongoing/next class cells
    var classes = getTodayClasses(now);
    document.querySelectorAll('.sched-cell').forEach(function(cell) {
      cell.classList.remove('sched-cell-ongoing', 'sched-cell-soon');
    });

    classes.forEach(function(c) {
      var cell = document.querySelector('.sched-cell[data-day="' + todayKey + '"][data-slot="' + c.slotId + '"]');
      if (!cell) return;
      if (c.status === 'ongoing') cell.classList.add('sched-cell-ongoing');
      if (c.status === 'soon') cell.classList.add('sched-cell-soon');
    });
  }

  // ===== Render: Habit Grid Today Highlight =====
  function renderHabitTodayHighlight() {
    var now = getNow();
    var todayIdx = now.day === 0 ? 6 : now.day - 1; // 0=Mon ... 6=Sun
    var grid = document.getElementById('habit-grid');
    if (!grid) return;
    var cells = grid.querySelectorAll('.habit-cell');
    cells.forEach(function(cell) {
      cell.classList.remove('habit-today-col');
    });
    // Every 7th cell starting from todayIdx
    for (var i = todayIdx; i < cells.length; i += 7) {
      cells[i].classList.add('habit-today-col');
    }
  }

  // ===== Render: Exam Countdown Live =====
  function renderExamCountdown() {
    var els = document.querySelectorAll('[data-exam-date]');
    els.forEach(function(el) {
      var dateStr = el.getAttribute('data-exam-date');
      if (!dateStr) return;
      var exam = new Date(dateStr + 'T00:00:00');
      var now = new Date();
      now.setHours(0, 0, 0, 0);
      var diff = Math.ceil((exam - now) / 86400000);
      var span = el.querySelector('.exam-days');
      if (!span) return;
      if (diff > 0) {
        span.textContent = diff + ' 天';
        el.classList.remove('exam-today', 'exam-past');
      } else if (diff === 0) {
        span.textContent = '今天';
        el.classList.add('exam-today');
      } else {
        span.textContent = '已结束';
        el.classList.add('exam-past');
      }
    });
  }

  // ===== Init =====
  function init() {
    // Inject CSS
    var css =
      '<style id="realtime-css">' +
      '.rt-statusbar{display:flex;align-items:center;gap:12px;padding:6px 12px;background:var(--bg2);border:1px solid var(--rule);border-radius:var(--radius);margin-bottom:8px}' +
      '.rt-clock{font-family:var(--font-mono);font-size:0.95rem;font-weight:700;color:var(--accent);min-width:72px}' +
      '.rt-date{font-size:0.76rem;color:var(--ink);font-weight:600}' +
      '.rt-week{font-size:0.72rem;margin-left:auto;padding:1px 8px;background:var(--accent-soft);border-radius:100px;color:var(--accent);font-weight:600}' +
      '.rt-empty{padding:16px;text-align:center;color:var(--muted);font-size:0.84rem}' +
      '.rt-class-list{display:flex;flex-direction:column;gap:6px}' +
      '.rt-class-item{display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:var(--radius-sm);border-left:3px solid var(--rule);background:var(--bg);transition:var(--transition)}' +
      '.rt-color-purple{border-left-color:var(--accent)}' +
      '.rt-color-teal{border-left-color:var(--accent2)}' +
      '.rt-color-amber{border-left-color:#f59e0b}' +
      '.rt-color-rose{border-left-color:#f43f5e}' +
      '.rt-color-blue{border-left-color:#3b82f6}' +
      '.rt-color-green{border-left-color:#22c55e}' +
      '.rt-color-gray{border-left-color:#9ca3af}' +
      '.rt-class-item.rs-ongoing{background:var(--accent-soft);box-shadow:0 0 0 1px var(--accent)}' +
      '.rt-class-item.rs-soon{background:rgba(245,158,11,0.06)}' +
      '.rt-class-time{display:flex;flex-direction:column;align-items:center;min-width:70px}' +
      '.rt-slot{font-family:var(--font-mono);font-size:0.78rem;font-weight:600;color:var(--ink)}' +
      '.rt-status{font-size:0.68rem;font-weight:600;padding:1px 6px;border-radius:100px;margin-top:2px}' +
      '.rs-ongoing{background:var(--accent);color:#fff}' +
      '.rs-soon{background:#f59e0b;color:#fff}' +
      '.rs-upcoming{background:var(--bg3);color:var(--muted)}' +
      '.rs-ended{background:transparent;color:var(--muted);opacity:0.4}' +
      '.rt-class-info{flex:1}' +
      '.rt-class-name{font-size:0.84rem;font-weight:600;color:var(--ink)}' +
      '.rt-class-meta{font-size:0.74rem;color:var(--muted);margin-top:1px}' +
      '.rt-sem-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}' +
      '.rt-sem-label{font-size:0.76rem;font-weight:600;color:var(--ink)}' +
      '.rt-sem-week{font-size:0.72rem;color:var(--muted)}' +
      '.rt-sem-pct{margin-left:auto;font-size:0.76rem;font-weight:700;color:var(--accent)}' +
      '.rt-sem-row+.progress-bar{height:4px;background:var(--bg3);border-radius:100px;overflow:hidden}' +
      '.rt-sem-row+.progress-bar .progress-fill{height:100%;background:var(--accent);border-radius:100px;transition:width 0.4s ease}' +
      '.sched-today-header{background:var(--accent-soft)!important;color:var(--accent)!important;font-weight:700}' +
      '.sched-cell-ongoing{box-shadow:0 0 0 2px var(--accent)!important;animation:pulse-border 2s ease-in-out infinite}' +
      '.sched-cell-soon{box-shadow:0 0 0 2px #f59e0b!important}' +
      '@keyframes pulse-border{0%,100%{box-shadow:0 0 0 2px var(--accent)}50%{box-shadow:0 0 0 2px var(--accent),0 0 8px rgba(91,97,235,0.3)}}' +
      '.habit-today-col{box-shadow:inset 0 0 0 2px var(--accent)!important}' +
      '.exam-today{background:rgba(244,63,94,0.1)!important;border-color:#f43f5e!important}' +
      '.exam-past{opacity:0.4}' +
      '</style>';
    if (!document.getElementById('realtime-css')) {
      document.head.insertAdjacentHTML('beforeend', css);
    }

    renderStatusBar();
    renderSemesterProgress();
    renderScheduleHighlight();
    renderHabitTodayHighlight();
    renderExamCountdown();

    // Update every second for clock, every 30s for everything else
    setInterval(renderStatusBar, 1000);
    setInterval(function() {
      renderScheduleHighlight();
      renderExamCountdown();
    }, 30000);
    setInterval(function() {
      renderSemesterProgress();
      renderHabitTodayHighlight();
    }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
