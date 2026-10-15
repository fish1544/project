// ============================================================
// 自律工具箱 - 渲染引擎
// 主题 / 习惯 / 专注 / 农场 / 睡眠 / 日记 / 考试 / 数据
// ============================================================
(function() {
  if (typeof tbData === 'undefined') return;

  var STORAGE_KEY = 'sop-toolbox-data';
  var THEME_KEY = 'sop-toolbox-theme';

  // ===== Load saved data =====
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) {}
  if (saved.habits) tbData.habits = saved.habits;
  if (saved.focusSessions) tbData.focusSessions = saved.focusSessions;
  if (saved.sleepRecords) tbData.sleepRecords = saved.sleepRecords;
  if (saved.diary) tbData.diary = saved.diary;
  if (saved.exams) tbData.exams = saved.exams;
  if (saved.studyTimeline) tbData.studyTimeline = saved.studyTimeline;

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      habits: tbData.habits,
      focusSessions: tbData.focusSessions,
      sleepRecords: tbData.sleepRecords,
      diary: tbData.diary,
      exams: tbData.exams,
      studyTimeline: tbData.studyTimeline
    }));
  }

  function addDiaryAuto(subtype, content) {
    var now = new Date();
    tbData.diary.unshift({
      id: tbUtils.genId(),
      type: 'auto',
      subtype: subtype,
      mood: tbData.currentMood,
      content: content,
      date: now.toISOString().slice(0, 10),
      time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
      timestamp: now.toISOString()
    });
    save();
  }

  // ============================================================
  // THEME SYSTEM
  // ============================================================
  function initTheme() {
    var container = document.getElementById('theme-switcher');
    if (!container) return;

    var savedTheme = localStorage.getItem(THEME_KEY) || 'default';

    tbThemes.forEach(function(t) {
      var dot = document.createElement('div');
      dot.className = 'theme-dot' + (t.id === savedTheme ? ' active' : '');
      dot.style.background = t.preview;
      dot.title = t.name + ' (' + t.desc + ')';
      dot.addEventListener('click', function() {
        document.documentElement.className = '';
        if (t.id !== 'default') {
          document.documentElement.classList.add('theme-' + t.id);
        }
        localStorage.setItem(THEME_KEY, t.id);
        container.querySelectorAll('.theme-dot').forEach(function(d) { d.classList.remove('active'); });
        dot.classList.add('active');
      });
      container.appendChild(dot);
    });

    // Apply saved theme
    if (savedTheme !== 'default') {
      document.documentElement.classList.add('theme-' + savedTheme);
    }
  }

  // ============================================================
  // HABIT TRACKER
  // ============================================================
  function renderHabits() {
    var chipsEl = document.getElementById('habit-chips');
    var ringEl = document.getElementById('habit-progress-ring');
    var textEl = document.getElementById('habit-progress-text');
    var streaksEl = document.getElementById('habit-streaks');
    if (!chipsEl) return;

    var today = tbUtils.today();
    var doneCount = 0;
    var total = tbData.habits.length;

    // Render chips
    var html = '';
    tbData.habits.forEach(function(h) {
      var isDone = h.done[today];
      if (isDone) doneCount++;
      html += '<div class="habit-chip' + (isDone ? ' done' : '') + '" data-id="' + h.id + '">';
      html += '<span class="habit-check">' + (isDone ? '✓' : '') + '</span>';
      html += '<span>' + h.icon + ' ' + h.name + '</span>';
      html += '</div>';
    });
    chipsEl.innerHTML = html;

    // Progress text
    var pct = total > 0 ? Math.round(doneCount / total * 100) : 0;
    if (textEl) textEl.textContent = doneCount + '/' + total + ' 已完成';

    // Update hero remaining count
    var heroRemaining = document.getElementById('hero-habit-remaining');
    if (heroRemaining) {
      var remaining = total - doneCount;
      heroRemaining.textContent = remaining > 0 ? remaining + '个习惯待打卡' : '今日习惯已全部完成';
    }

    // Progress ring (SVG)
    if (ringEl) {
      var r = 52;
      var circ = 2 * Math.PI * r;
      var offset = circ - (pct / 100) * circ;
      ringEl.innerHTML = '<svg class="progress-ring-svg" width="120" height="120">' +
        '<circle class="progress-ring-circle" cx="60" cy="60" r="' + r + '" stroke="var(--rule)" stroke-width="8" fill="none"/>' +
        '<circle class="progress-ring-circle" cx="60" cy="60" r="' + r + '" stroke="url(#grad1)" stroke-width="8" fill="none" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"/>' +
        '<defs><linearGradient id="grad1"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent2)"/></linearGradient></defs>' +
        '</svg>' +
        '<div style="margin-top:-80px;margin-bottom:40px;font-size:1.8rem;font-weight:700;color:var(--accent)">' + pct + '%</div>';
    }

    // Attach click handlers
    chipsEl.querySelectorAll('.habit-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var h = tbData.habits.find(function(x) { return x.id === id; });
        if (!h) return;
        var wasDone = h.done[today];
        if (wasDone) { delete h.done[today]; }
        else { h.done[today] = true; addDiaryAuto('habit', '完成习惯：' + h.name); }
        save();
        renderHabits();
      });
    });

    // Streaks
    if (streaksEl) {
      var sHtml = '';
      tbData.habits.forEach(function(h) {
        var streak = tbUtils.calcStreak(h.done);
        sHtml += '<div class="habit-streak-item">';
        sHtml += '<span class="habit-streak-icon">' + h.icon + '</span>';
        sHtml += '<div class="habit-streak-info"><div class="habit-streak-name">' + h.name + '</div>';
        sHtml += '<div class="habit-streak-sub">' + (streak > 0 ? '连续 ' + streak + ' 天' : '今天还没打卡') + '</div></div>';
        sHtml += '<span class="habit-streak-num">' + streak + '</span>';
        sHtml += '</div>';
      });
      streaksEl.innerHTML = sHtml;
    }

    // Weekly view - INTP: pattern-oriented, not daily grind
    var weeklyEl = document.getElementById('habit-weekly');
    if (weeklyEl) {
      var weekDays = tbUtils.getWeekDates();
      var wHtml = '';
      // Header
      wHtml += '<div style="display:flex;align-items:center;gap:2px;margin-bottom:8px">';
      wHtml += '<div style="width:80px;flex-shrink:0"></div>';
      weekDays.forEach(function(d, i) {
        var isToday = d === today;
        var dayLabels = ['一','二','三','四','五','六','日'];
        wHtml += '<div style="flex:1;text-align:center;font-size:0.7rem;color:' + (isToday ? 'var(--accent)' : 'var(--muted)') + ';font-weight:' + (isToday ? '700' : '400') + '">周' + dayLabels[i] + '</div>';
      });
      wHtml += '<div style="width:36px;flex-shrink:0;text-align:center;font-size:0.7rem;color:var(--muted)">率</div>';
      wHtml += '</div>';

      tbData.habits.forEach(function(h) {
        var doneCount = 0;
        wHtml += '<div style="display:flex;align-items:center;gap:2px;margin-bottom:4px">';
        wHtml += '<div style="width:80px;flex-shrink:0;font-size:0.76rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + h.icon + ' ' + h.name + '</div>';
        weekDays.forEach(function(d) {
          var isDone = h.done[d];
          if (isDone) doneCount++;
          wHtml += '<div style="flex:1;display:flex;justify-content:center"><div style="width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:0.68rem;' + (isDone ? 'background:var(--accent2);color:#fff' : 'background:var(--bg3);color:var(--muted)') + '">' + (isDone ? '✓' : '') + '</div></div>';
        });
        var rate = Math.round(doneCount / 7 * 100);
        var rateColor = rate >= 70 ? 'var(--accent2)' : (rate >= 40 ? '#f59e0b' : '#f43f5e');
        wHtml += '<div style="width:36px;flex-shrink:0;text-align:center;font-size:0.72rem;font-weight:700;color:' + rateColor + '">' + rate + '%</div>';
        wHtml += '</div>';
      });
      weeklyEl.innerHTML = wHtml;
    }
  }

  // Add habit button
  var habitAddBtn = document.getElementById('habit-add-btn');
  if (habitAddBtn) {
    habitAddBtn.addEventListener('click', function() {
      var name = prompt('习惯名称：');
      if (!name) return;
      var icon = prompt('习惯图标（可选）：', '') || '📌';
      tbData.habits.push({ id: tbUtils.genId(), name: name, icon: icon, done: {} });
      save();
      renderHabits();
    });
  }

  // ============================================================
  // FOCUS TIMER
  // ============================================================
  var focusDisplay = document.getElementById('focus-display');
  var focusTaskDisplay = document.getElementById('focus-task-display');
  var focusToggleBtn = document.getElementById('focus-toggle-btn');
  var focusTaskInput = document.getElementById('focus-task-input');
  var focusFloat = document.getElementById('focus-float');
  var focusFloatTime = document.getElementById('focus-float-time');

  function updateFocusDisplay() {
    var elapsed = Math.floor((Date.now() - tbData.focusState.startTime) / 1000);
    var h = Math.floor(elapsed / 3600);
    var m = Math.floor((elapsed % 3600) / 60);
    var s = elapsed % 60;
    var str = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    if (focusDisplay) focusDisplay.textContent = str;
    if (focusFloatTime) focusFloatTime.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function startFocus() {
    var taskName = (focusTaskInput && focusTaskInput.value.trim()) || '专注学习';
    tbData.focusState.running = true;
    tbData.focusState.startTime = Date.now();
    tbData.focusState.taskName = taskName;
    tbData.focusState.timer = setInterval(updateFocusDisplay, 1000);

    if (focusTaskDisplay) focusTaskDisplay.textContent = '正在专注：' + taskName;
    if (focusToggleBtn) { focusToggleBtn.textContent = '停止专注'; focusToggleBtn.style.background = '#f43f5e'; }
    if (focusFloat) { focusFloat.classList.add('show'); focusFloat.style.right = '20px'; focusFloat.style.bottom = '20px'; }
    if (focusTaskInput) focusTaskInput.disabled = true;
  }

  function stopFocus() {
    var duration = Math.floor((Date.now() - tbData.focusState.startTime) / 1000);
    clearInterval(tbData.focusState.timer);
    tbData.focusState.running = false;

    if (duration >= 60) {
      var session = {
        id: tbUtils.genId(),
        taskName: tbData.focusState.taskName,
        date: new Date().toISOString(),
        duration: duration
      };
      tbData.focusSessions.unshift(session);

      // Add to study timeline
      tbData.studyTimeline.unshift({
        id: tbUtils.genId(),
        title: tbData.focusState.taskName,
        category: '专注',
        duration: Math.round(duration / 60),
        date: new Date().toISOString()
      });

      addDiaryAuto('focus', '⏱ 专注 ' + tbUtils.minsToHHMM(Math.round(duration / 60)) + '：' + tbData.focusState.taskName);
      save();
    }

    tbData.focusState.startTime = 0;
    tbData.focusState.taskName = '';

    if (focusDisplay) focusDisplay.textContent = '00:00:00';
    if (focusTaskDisplay) focusTaskDisplay.textContent = '未开始';
    if (focusToggleBtn) { focusToggleBtn.textContent = '开始专注'; focusToggleBtn.style.background = ''; }
    if (focusFloat) focusFloat.classList.remove('show');
    if (focusTaskInput) focusTaskInput.disabled = false;

    renderFocusStats();
    renderFocusLogs();
  }

  if (focusToggleBtn) {
    focusToggleBtn.addEventListener('click', function() {
      if (tbData.focusState.running) { stopFocus(); } else { startFocus(); }
    });
  }

  // Float click to stop
  if (focusFloat) {
    focusFloat.addEventListener('click', function() {
      if (confirm('停止专注？')) stopFocus();
    });
  }

  function renderFocusStats() {
    var el = document.getElementById('focus-stats');
    if (!el) return;

    var today = tbUtils.today();
    var todaySessions = tbData.focusSessions.filter(function(s) {
      return s.date.slice(0, 10) === today;
    });
    var totalSecs = todaySessions.reduce(function(sum, s) { return sum + s.duration; }, 0);
    var totalMins = Math.round(totalSecs / 60);

    var html = '';
    html += '<div class="focus-stat-item"><div class="focus-stat-val">' + todaySessions.length + '</div><div class="focus-stat-lbl">今日次数</div></div>';
    html += '<div class="focus-stat-item"><div class="focus-stat-val">' + tbUtils.minsToHHMM(totalMins) + '</div><div class="focus-stat-lbl">今日时长</div></div>';

    // Weekly stats - INTP: pattern data
    var weekStart = new Date();
    var dayOfWeek = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    var weekSessions = tbData.focusSessions.filter(function(s) {
      return new Date(s.date) >= weekStart;
    });
    var weekSecs = weekSessions.reduce(function(sum, s) { return sum + s.duration; }, 0);
    var weekMins = Math.round(weekSecs / 60);
    html += '<div class="focus-stat-item"><div class="focus-stat-val">' + tbUtils.minsToHHMM(weekMins) + '</div><div class="focus-stat-lbl">本周累计</div></div>';
    html += '<div class="focus-stat-item"><div class="focus-stat-val">' + tbData.focusSessions.length + '</div><div class="focus-stat-lbl">总次数</div></div>';
    el.innerHTML = html;
  }

  function renderFocusLogs() {
    var el = document.getElementById('focus-logs');
    if (!el) return;

    if (tbData.focusSessions.length === 0) {
      el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:0.84rem">还没有专注记录，点击上方「开始专注」</div>';
      return;
    }

    var html = '';
    tbData.focusSessions.slice(0, 10).forEach(function(s) {
      var mins = Math.round(s.duration / 60);
      html += '<div class="timeline-item">';
      html += '<div class="timeline-dot"></div>';
      html += '<div class="timeline-content">';
      html += '<h4>' + s.taskName + '</h4>';
      html += '<p>' + tbUtils.formatDate(s.date) + ' · ' + tbUtils.minsToHHMM(mins) + '</p>';
      html += '</div></div>';
    });
    el.innerHTML = html;
  }


  // ============================================================
  // SLEEP TRACKER
  // ============================================================
  function renderSleepCalc() {
    var btn = document.getElementById('sleep-calc-btn');
    var input = document.getElementById('sleep-time-input');
    var recsEl = document.getElementById('sleep-recommendations');
    if (!btn || !input || !recsEl) return;

    btn.addEventListener('click', function() {
      var timeVal = input.value;
      if (!timeVal) { alert('请输入入睡时间'); return; }

      var parts = timeVal.split(':');
      var sleepTime = new Date();
      sleepTime.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
      if (sleepTime < new Date()) sleepTime.setDate(sleepTime.getDate() + 1);

      var html = '<div style="font-size:0.84rem;color:var(--muted);margin-bottom:8px">推荐起床时间（点击设闹钟）：</div>';
      [6, 5, 4].forEach(function(cycles) {
        var wakeTime = new Date(sleepTime.getTime() + cycles * 90 * 60000);
        var hours = (cycles * 1.5).toFixed(1);
        var timeStr = String(wakeTime.getHours()).padStart(2, '0') + ':' + String(wakeTime.getMinutes()).padStart(2, '0');

        html += '<div class="sleep-rec-card" onclick="window._setAlarm(' + wakeTime.getHours() + ',' + wakeTime.getMinutes() + ')">';
        html += '<span class="sleep-rec-time">' + timeStr + '</span>';
        html += '<div class="sleep-rec-info">';
        html += '<div class="sleep-rec-cycles">' + cycles + ' 个睡眠周期</div>';
        html += '<div class="sleep-rec-hours">' + hours + ' 小时' + (cycles >= 5 ? ' 推荐' : '') + '</div>';
        html += '</div></div>';
      });

      recsEl.innerHTML = html;
    });
  }

  window._setAlarm = function(h, m) {
    if (navigator.userAgent.match(/android/i)) {
      window.open('intent://alarm;set?hour=' + h + '&minute=' + m + '#Intent;scheme=intent;package=com.android.deskclock;end;');
    } else {
      alert('闹钟时间：' + h + ':' + String(m).padStart(2, '0') + '\n（请在手机时钟app中手动设置）');
    }
  };

  function renderSleepRecords() {
    var statsEl = document.getElementById('sleep-stats');
    var recordsEl = document.getElementById('sleep-records');
    var toggleBtn = document.getElementById('sleep-toggle-btn');
    if (!recordsEl) return;

    // Toggle button
    if (toggleBtn) {
      if (tbData.pendingSleep) {
        toggleBtn.textContent = '起床';
        toggleBtn.style.background = '#f43f5e';
      } else {
        toggleBtn.textContent = '入睡';
        toggleBtn.style.background = '';
      }
      toggleBtn.onclick = function() {
        if (!tbData.pendingSleep) {
          tbData.pendingSleep = new Date().toISOString();
          save();
          addDiaryAuto('sleep', '入睡记录：' + tbUtils.formatDate(tbData.pendingSleep));
          renderSleepRecords();
        } else {
          var wakeTime = new Date();
          var sleepTime = new Date(tbData.pendingSleep);
          var duration = Math.round((wakeTime - sleepTime) / 60000);
          if (duration < 5) { alert('睡眠不足5分钟，不记录'); tbData.pendingSleep = null; save(); renderSleepRecords(); return; }

          var cycles = duration / 90;
          var nearestCycle = Math.round(cycles);
          var efficiency = nearestCycle > 0 ? Math.round((1 - Math.abs(cycles - nearestCycle) / nearestCycle) * 100) : 0;

          tbData.sleepRecords.unshift({
            id: tbUtils.genId(),
            sleepTime: tbData.pendingSleep,
            wakeTime: wakeTime.toISOString(),
            duration: duration,
            efficiency: efficiency
          });
          tbData.pendingSleep = null;
          save();
          addDiaryAuto('sleep', '起床：睡眠 ' + tbUtils.minsToHHMM(duration) + '，效率 ' + efficiency + '%');
          renderSleepRecords();
        }
      };
    }

    // Stats (last 7)
    var recent = tbData.sleepRecords.slice(0, 7);
    if (statsEl) {
      if (recent.length === 0) {
        statsEl.innerHTML = '<div style="color:var(--muted);font-size:0.84rem">暂无睡眠记录</div>';
      } else {
        var avgMins = Math.round(recent.reduce(function(s, r) { return s + r.duration; }, 0) / recent.length);
        var avgEff = Math.round(recent.reduce(function(s, r) { return s + r.efficiency; }, 0) / recent.length);
        statsEl.innerHTML =
          '<div class="focus-stat-item"><div class="focus-stat-val">' + tbUtils.minsToHHMM(avgMins) + '</div><div class="focus-stat-lbl">平均时长</div></div>' +
          '<div class="focus-stat-item"><div class="focus-stat-val">' + avgEff + '%</div><div class="focus-stat-lbl">平均效率</div></div>' +
          '<div class="focus-stat-item"><div class="focus-stat-val">' + recent.length + '</div><div class="focus-stat-lbl">近7天记录</div></div>';
      }
    }

    // Records list
    if (tbData.sleepRecords.length === 0) {
      recordsEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:0.84rem">点击「入睡」开始记录</div>';
    } else {
      var html = '';
      tbData.sleepRecords.slice(0, 10).forEach(function(r) {
        var effColor = r.efficiency >= 80 ? '#22c55e' : (r.efficiency >= 60 ? '#f59e0b' : '#f43f5e');
        html += '<div class="sleep-record-item">';
        html += '<div style="flex:1">';
        html += '<div style="font-size:0.84rem;font-weight:600">' + tbUtils.formatDate(r.sleepTime) + ' → ' + tbUtils.formatDate(r.wakeTime) + '</div>';
        html += '<div style="font-size:0.76rem;color:var(--muted)">时长 ' + tbUtils.minsToHHMM(r.duration) + '</div>';
        html += '</div>';
        html += '<div style="text-align:right"><span style="font-size:1.1rem;font-weight:700;color:' + effColor + '">' + r.efficiency + '%</span>';
        html += '<div style="font-size:0.68rem;color:var(--muted)">效率</div></div>';
        html += '</div>';
      });
      recordsEl.innerHTML = html;
    }
  }

  // ============================================================
  // DIARY
  // ============================================================
  function renderMoodPicker() {
    var el = document.getElementById('mood-picker');
    if (!el) return;
    var moods = ['好','一般','差','燃','开心'];
    var html = '';
    moods.forEach(function(m) {
      html += '<button class="mood-btn' + (m === tbData.currentMood ? ' active' : '') + '" data-mood="' + m + '">' + m + '</button>';
    });
    el.innerHTML = html;
    el.querySelectorAll('.mood-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        tbData.currentMood = this.getAttribute('data-mood');
        el.querySelectorAll('.mood-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        save();
      });
    });
  }

  function renderDiary() {
    var listEl = document.getElementById('diary-list');
    if (!listEl) return;

    if (tbData.diary.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:0.84rem">还没有日记，写第一条吧</div>';
      return;
    }

    var html = '';
    var lastDate = '';
    tbData.diary.slice(0, 30).forEach(function(d) {
      if (d.date !== lastDate) {
        html += '<div style="padding:8px 0 4px;font-size:0.78rem;font-weight:700;color:var(--accent);border-bottom:1px solid var(--rule)">' + d.date + '</div>';
        lastDate = d.date;
      }
      html += '<div class="diary-entry">';
      html += '<div class="diary-entry-header">';
      html += '<span class="diary-entry-time">' + d.time + '</span>';
      html += '<span class="diary-entry-mood">' + (d.mood || '') + '</span>';
      html += '<span class="diary-entry-badge ' + (d.type === 'auto' ? 'auto' : 'diary') + '">' + (d.type === 'auto' ? d.subtype : '日记') + '</span>';
      html += '<button class="diary-entry-delete" data-id="' + d.id + '">删</button>';
      html += '</div>';
      html += '<div class="diary-entry-content">' + d.content + '</div>';
      html += '</div>';
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.diary-entry-delete').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        tbData.diary = tbData.diary.filter(function(d) { return d.id !== id; });
        save();
        renderDiary();
      });
    });
  }

  var diaryAddBtn = document.getElementById('diary-add-btn');
  var diaryInput = document.getElementById('diary-input');
  if (diaryAddBtn && diaryInput) {
    diaryAddBtn.addEventListener('click', function() {
      var content = diaryInput.value.trim();
      if (!content) { alert('写点什么吧'); return; }
      var now = new Date();
      tbData.diary.unshift({
        id: tbUtils.genId(),
        type: 'diary',
        subtype: 'diary',
        mood: tbData.currentMood,
        content: content,
        date: now.toISOString().slice(0, 10),
        time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
        timestamp: now.toISOString()
      });
      diaryInput.value = '';
      save();
      renderDiary();
    });
  }

  // ============================================================
  // EXAM COUNTDOWN
  // ============================================================
  function renderExams() {
    var el = document.getElementById('exam-list');
    if (!el) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var html = '';
    tbData.exams.forEach(function(e) {
      var examDate = new Date(e.date);
      examDate.setHours(0, 0, 0, 0);
      var days = Math.round((examDate - today) / 86400000);
      var isUrgent = days <= 14 && days >= 0;
      var isPast = days < 0;

      html += '<div class="exam-card">';
      if (isPast) {
        html += '<div class="exam-countdown" style="color:var(--muted)">已考</div>';
      } else {
        html += '<div class="exam-countdown' + (isUrgent ? ' urgent' : '') + '">' + days + '<span style="font-size:0.7rem">天</span></div>';
      }
      html += '<div class="exam-info">';
      html += '<div class="exam-name">' + e.name + '</div>';
      html += '<div class="exam-date">' + e.date + '</div>';
      if (!isPast && days <= e.remindDays) {
        html += '<div class="exam-remind">该开始复习了！</div>';
      } else if (!isPast) {
        html += '<div class="exam-remind">提前 ' + e.remindDays + ' 天提醒</div>';
      }
      html += '</div>';
      html += '<button class="exam-delete" data-id="' + e.id + '">删</button>';
      html += '</div>';
    });
    el.innerHTML = html;

    el.querySelectorAll('.exam-delete').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        if (confirm('删除这条考试记录？')) {
          tbData.exams = tbData.exams.filter(function(e) { return e.id !== id; });
          save();
          renderExams();
        }
      });
    });
  }

  var examAddBtn = document.getElementById('exam-add-btn');
  if (examAddBtn) {
    examAddBtn.addEventListener('click', function() {
      var name = prompt('考试名称：');
      if (!name) return;
      var date = prompt('考试日期（YYYY-MM-DD）：');
      if (!date) return;
      var remind = parseInt(prompt('提前几天提醒？', '14')) || 14;
      tbData.exams.push({ id: tbUtils.genId(), name: name, date: date, remindDays: remind });
      tbData.exams.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
      save();
      renderExams();
    });
  }

  // ============================================================
  // DATA EXPORT / IMPORT
  // ============================================================
  function initDataExport() {
    // Add export/import bar to the SOP upgrade section or footer
    var footer = document.querySelector('.sop-footer');
    if (!footer) return;

    var bar = document.createElement('div');
    bar.className = 'data-export-bar';
    bar.innerHTML = 
      '<button id="tb-export-btn" style="padding:8px 16px;background:var(--grad);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;font-weight:600">📦 导出全部数据</button>' +
      '<button id="tb-import-btn" style="padding:8px 16px;background:var(--bg2);color:var(--accent);border:1px solid var(--rule);border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;font-weight:600">📥 导入数据</button>' +
      '<button id="tb-reset-btn" style="padding:8px 16px;background:rgba(244,63,94,0.06);color:#f43f5e;border:1px solid rgba(244,63,94,0.3);border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;font-weight:600">🗑 重置全部</button>';
    footer.appendChild(bar);

    document.getElementById('tb-export-btn').addEventListener('click', function() {
      var allData = {
        toolbox: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
        schedule: JSON.parse(localStorage.getItem('sop-sched-adjust') || '{}'),
        classRep: JSON.parse(localStorage.getItem('sop-cr-data') || '{}'),
        theme: localStorage.getItem(THEME_KEY),
        checklists: {},
        exportDate: new Date().toISOString()
      };
      document.querySelectorAll('.check-box.checked').forEach(function(cb) {
        var group = cb.closest('.checklist');
        if (group) {
          var g = group.getAttribute('data-group');
          if (!allData.checklists[g]) allData.checklists[g] = [];
          allData.checklists[g].push(cb.nextElementSibling.textContent.trim());
        }
      });
      var blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'sop-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('tb-import-btn').addEventListener('click', function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          try {
            var data = JSON.parse(ev.target.result);
            if (data.toolbox) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.toolbox));
            if (data.schedule) localStorage.setItem('sop-sched-adjust', JSON.stringify(data.schedule));
            if (data.classRep) localStorage.setItem('sop-cr-data', JSON.stringify(data.classRep));
            if (data.theme) localStorage.setItem(THEME_KEY, data.theme);
            alert('导入成功！页面将刷新...');
            location.reload();
          } catch(err) {
            alert('导入失败：' + err.message);
          }
        };
        reader.readAsText(file);
      });
      input.click();
    });

    document.getElementById('tb-reset-btn').addEventListener('click', function() {
      if (confirm('确定重置全部数据？此操作不可撤销！')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('sop-sched-adjust');
        localStorage.removeItem('sop-cr-data');
        localStorage.removeItem(THEME_KEY);
        alert('已重置，页面将刷新...');
        location.reload();
      }
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  initTheme();
  renderHabits();
  renderFocusStats();
  renderFocusLogs();
  renderSleepCalc();
  renderSleepRecords();
  renderMoodPicker();
  renderDiary();
  renderExams();
  initDataExport();

  // Auto-refresh exam countdowns
  setInterval(function() {
    renderExams();
  }, 60000);
})();
