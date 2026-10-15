// ============================================================
// 课表渲染引擎 - 从 schedData 数据驱动渲染
// 核心：课表网格 + 空闲分析 + 时间块规划 + 课程调整 全部互通
// ============================================================
(function() {
  if (typeof schedData === 'undefined') return;

  var colorMap = {
    purple: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', dot: '#6366f1', pill: 'pill purple' },
    teal:   { bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.3)', dot: '#14b8a6', pill: 'pill teal' },
    amber:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', dot: '#f59e0b', pill: 'pill amber' },
    rose:   { bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', dot: '#f43f5e', pill: 'pill rose' },
    blue:   { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', dot: '#3b82f6', pill: 'pill blue' },
    green:  { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', dot: '#22c55e', pill: 'pill green' },
    gray:   { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', dot: '#64748b', pill: 'pill' }
  };

  // 课程调整数据
  var adjustKey = 'sop-sched-adjust';
  var adjustments = {};
  try { adjustments = JSON.parse(localStorage.getItem(adjustKey) || '{}'); } catch(e) {}

  // 时间块规划数据（07节编辑的空闲安排）
  var timeBlockKey = 'sop-timeblocks';
  var timeBlocks = {};
  try { timeBlocks = JSON.parse(localStorage.getItem(timeBlockKey) || '{}'); } catch(e) {}

  function saveTimeBlock(key, val) {
    if (val && val.trim()) {
      timeBlocks[key] = val.trim();
    } else {
      delete timeBlocks[key];
    }
    localStorage.setItem(timeBlockKey, JSON.stringify(timeBlocks));
  }

  function getTimeBlock(dayId, slotId) {
    var tbKey = dayId + '-' + slotId + '-free';
    return timeBlocks[tbKey] || '';
  }

  // 统一刷新所有视图
  function refreshAll() {
    renderGrid();
    renderMobileView();
    if (typeof window._renderHeroToday === 'function') window._renderHeroToday();
  }

  // ===== Render Schedule Grid (Desktop) =====
  function renderGrid() {
    var container = document.getElementById('schedule-grid');
    if (!container) return;

    var html = '<div class="sched-grid">';
    var slots = schedData.timeSlots;
    var days = schedData.days;

    html += '<div class="sched-corner">时间 / 星期</div>';
    days.forEach(function(day) {
      html += '<div class="sched-day-header" data-day="' + day.id + '">' + day.label + '</div>';
    });

    slots.forEach(function(slot) {
      html += '<div class="sched-time-label">';
      html += '<span class="slot-label">' + slot.label + '</span>';
      html += '<span class="slot-time">' + slot.time + '</span>';
      html += '</div>';

      days.forEach(function(day) {
        var key = day.id + '-' + slot.id;
        var cls = schedData.grid[day.id] && schedData.grid[day.id][slot.id];
        var adj = adjustments[key];

        if (cls && !adj) {
          var subjInfo = schedData.subjects[cls.subject] || { color: 'gray' };
          html += '<div class="sched-cell class-' + subjInfo.color + '" data-key="' + key + '" data-day="' + day.id + '" data-slot="' + slot.id + '">';
          html += '<div class="sched-subject">' + cls.subject + '</div>';
          html += '<div class="sched-teacher">' + (subjInfo.teacher || '') + '</div>';
          html += '<div class="sched-location">' + cls.location + '</div>';
          html += '<div class="sched-weeks">第' + cls.weeks + '周</div>';
          html += '</div>';
        } else if (cls && adj === 'cancelled') {
          var subjInfo2 = schedData.subjects[cls.subject] || { color: 'gray' };
          html += '<div class="sched-cell class-' + subjInfo2.color + ' cancelled" data-key="' + key + '" data-day="' + day.id + '" data-slot="' + slot.id + '">';
          html += '<div class="sched-subject">' + cls.subject + '</div>';
          html += '<div class="sched-location">' + cls.location + '</div>';
          html += '<div class="sched-weeks" style="color:#f43f5e">本周取消</div>';
          html += '</div>';
        } else if (cls && adj && adj.startsWith('adjusted:')) {
          var note = adj.substring(9);
          var subjInfo3 = schedData.subjects[cls.subject] || { color: 'gray' };
          html += '<div class="sched-cell class-' + subjInfo3.color + ' adjusted" data-key="' + key + '" data-day="' + day.id + '" data-slot="' + slot.id + '">';
          html += '<div class="sched-subject">' + cls.subject + '</div>';
          html += '<div class="sched-location">' + cls.location + '</div>';
          html += '<div class="sched-weeks" style="color:#f59e0b">' + note + '</div>';
          html += '</div>';
        } else {
          // 空闲块：显示用户在07节编辑的安排
          var plan = getTimeBlock(day.id, slot.id);
          html += '<div class="sched-cell free" data-key="' + key + '" data-free="1" data-day="' + day.id + '" data-slot="' + slot.id + '">';
          if (plan) {
            html += '<div class="sched-free-label" style="color:var(--accent2);font-weight:600">' + plan + '</div>';
          } else {
            html += '<div class="sched-free-label">空闲</div>';
          }
          html += '</div>';
        }
      });
    });

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.sched-cell').forEach(function(cell) {
      cell.addEventListener('click', function(e) {
        e.stopPropagation();
        showPopup(this);
      });
    });
  }



  // ===== Popup for cell adjustment =====
  var popup = null;
  var scrollCloseTimer = null;

  function showPopup(cell) {
    if (popup) { popup.remove(); popup = null; }
    var key = cell.getAttribute('data-key');
    var isFree = cell.getAttribute('data-free');
    var dayId = cell.getAttribute('data-day');
    var slotId = cell.getAttribute('data-slot');
    var rect = cell.getBoundingClientRect();
    var cls = null;
    if (schedData.grid[dayId] && schedData.grid[dayId][slotId]) {
      cls = schedData.grid[dayId][slotId];
    }

    popup = document.createElement('div');
    popup.className = 'sched-popup show';
    var popupHtml = '';

    if (isFree) {
      var plan = getTimeBlock(dayId, slotId);
      var slot = schedData.timeSlots.find(function(s) { return s.id == slotId; });
      popupHtml += '<h4>空闲时段</h4>';
      popupHtml += '<p style="font-size:0.8rem;color:var(--muted);margin-bottom:8px">' + (slot ? slot.time : '') + '</p>';
      popupHtml += '<input type="text" id="free-input-' + key + '" placeholder="输入这个时段的安排..." value="' + (plan || '') + '" style="width:100%;padding:6px 8px;border:1px solid var(--rule);border-radius:var(--radius-sm);font-size:0.82rem;outline:none;box-sizing:border-box;margin-bottom:6px">';
      popupHtml += '<button onclick="window._schedAction(\'savefree\',\'' + key + '\',\'' + dayId + '\',' + slotId + ')">保存安排</button>';
    } else if (cls) {
      var subjInfo = schedData.subjects[cls.subject] || {};
      popupHtml += '<h4>' + cls.subject + '</h4>';
      popupHtml += '<p style="font-size:0.8rem;color:var(--muted);margin-bottom:8px">';
      popupHtml += '教师：' + (subjInfo.teacher || '未知') + '<br>';
      popupHtml += '教室：' + cls.location + '<br>';
      popupHtml += '周次：第' + cls.weeks + '周</p>';

      var adj = adjustments[key];
      if (adj === 'cancelled') {
        popupHtml += '<button onclick="window._schedAction(\'restore\',\'' + key + '\')">恢复正常</button>';
      } else if (adj && adj.startsWith('adjusted:')) {
        popupHtml += '<button onclick="window._schedAction(\'restore\',\'' + key + '\')">恢复正常</button>';
      } else {
        popupHtml += '<button onclick="window._schedAction(\'cancel\',\'' + key + '\')">本周取消</button>';
        popupHtml += '<input type="text" id="adj-input-' + key + '" placeholder="如：改到崇智楼301 / 调到周三" style="width:100%;padding:6px 8px;border:1px solid var(--rule);border-radius:var(--radius-sm);font-size:0.82rem;outline:none;box-sizing:border-box;margin-bottom:4px">';
        popupHtml += '<button onclick="window._schedAction(\'adjust\',\'' + key + '\')">标记临时调整</button>';
      }
    }

    popupHtml += '<button onclick="window._closePopup()" style="margin-top:4px;color:var(--muted)">关闭</button>';
    popup.innerHTML = popupHtml;

    document.body.appendChild(popup);

    // 移动端优化定位：居中显示，避免超出屏幕
    var isMobile = window.innerWidth <= 900;
    if (isMobile) {
      var popupWidth = Math.min(window.innerWidth - 32, 320);
      var left = (window.innerWidth - popupWidth) / 2;
      var top = Math.min(rect.bottom + 8, window.innerHeight - 280);
      if (top < 60) top = 60;
      popup.style.width = popupWidth + 'px';
      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
    } else {
      popup.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
      popup.style.top = Math.min(rect.bottom + 4, window.innerHeight - 220) + 'px';
    }
  }

  window._closePopup = function() {
    if (popup) { popup.remove(); popup = null; }
  };

  window._schedAction = function(action, key, dayId, slotId) {
    if (action === 'cancel') {
      adjustments[key] = 'cancelled';
    } else if (action === 'restore') {
      delete adjustments[key];
    } else if (action === 'adjust') {
      var input = document.getElementById('adj-input-' + key);
      var note = input ? input.value.trim() : '';
      if (note) {
        adjustments[key] = 'adjusted:' + note;
      } else {
        return;
      }
    } else if (action === 'savefree') {
      var freeInput = document.getElementById('free-input-' + key);
      var plan = freeInput ? freeInput.value.trim() : '';
      var tbKey = dayId + '-' + slotId + '-free';
      saveTimeBlock(tbKey, plan);
    }

    localStorage.setItem(adjustKey, JSON.stringify(adjustments));
    window._closePopup();
    refreshAll();
  };

  document.addEventListener('click', function(e) {
    if (popup && !popup.contains(e.target) && !e.target.closest('.sched-cell') && !e.target.closest('.sched-mobile-card')) {
      window._closePopup();
    }
  });

  window.addEventListener('scroll', function() {
    if (!popup) return;
    if (scrollCloseTimer) clearTimeout(scrollCloseTimer);
    scrollCloseTimer = setTimeout(function() {
      window._closePopup();
    }, 100);
  }, { passive: true });

  // ===== Export button =====
  var exportBtn = document.getElementById('export-schedule');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      var data = JSON.stringify({ schedData: schedData, adjustments: adjustments, timeBlocks: timeBlocks }, null, 2);
      var blob = new Blob([data], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'schedule-data-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }


  // Helper: build an editable div
  function buildEditable(tbKey, val, placeholder) {
    var hasVal = val && val.trim();
    var style = 'font-size:0.78rem;padding:4px 6px;border-radius:4px;outline:none;min-height:1.4em;cursor:text;';
    if (!hasVal) style += 'color:var(--muted);opacity:0.5;';
    return '<div class="tb-editable" contenteditable="true" data-tbkey="' + tbKey + '" style="' + style + '" data-placeholder="' + placeholder + '">' + (hasVal ? val : placeholder) + '</div>';
  }

  function attachEditableHandlers(container) {
    container.querySelectorAll('.tb-editable').forEach(function(el) {
      var tbKey = el.getAttribute('data-tbkey');
      var placeholder = el.getAttribute('data-placeholder') || '';

      el.addEventListener('focus', function() {
        if (this.textContent === placeholder) {
          this.textContent = '';
        }
        this.style.opacity = '1';
        this.style.background = 'var(--bg)';
        this.style.boxShadow = '0 0 0 2px var(--accent)';
      });

      el.addEventListener('blur', function() {
        this.style.background = '';
        this.style.boxShadow = '';
        var val = this.textContent.trim();
        saveTimeBlock(tbKey, val);
        if (!val) {
          this.textContent = placeholder;
          this.style.opacity = '0.5';
        }
        // 同步刷新课表网格（空闲块显示更新）
        renderGrid();
        renderMobileView();
      });

      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
      });
    });
  }

  // ===== Render Mobile Day View =====
  function renderMobileView() {
    var container = document.getElementById('schedule-mobile');
    if (!container) return;

    var now = new Date();
    var todayDay = now.getDay();
    var dayMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
    var todayIdx = dayMap[todayDay];

    var html = '';

    // Tabs
    html += '<div class="sched-mobile-tabs">';
    schedData.days.forEach(function(day, idx) {
      var cls = idx === todayIdx ? ' today' : '';
      if (idx === todayIdx) cls += ' active';
      html += '<button class="sched-mobile-tab' + cls + '" data-day-idx="' + idx + '">' + day.label + '</button>';
    });
    html += '</div>';

    // Day contents
    schedData.days.forEach(function(day, dayIdx) {
      var isActive = dayIdx === todayIdx ? ' active' : '';
      html += '<div class="sched-mobile-day' + isActive + '" data-day-idx="' + dayIdx + '">';

      var dayGrid = schedData.grid[day.id];

      schedData.timeSlots.forEach(function(slot) {
        var key = day.id + '-' + slot.id;
        var cls = dayGrid && dayGrid[slot.id];
        var adj = adjustments[key];

        if (cls && adj !== 'cancelled' && !adj) {
          var subjInfo = schedData.subjects[cls.subject] || { color: 'gray' };
          var colorStyles = {
            purple: 'background:rgba(99,102,241,0.08);border-left-color:#6366f1',
            teal: 'background:rgba(20,184,166,0.08);border-left-color:#14b8a6',
            amber: 'background:rgba(245,158,11,0.08);border-left-color:#f59e0b',
            rose: 'background:rgba(244,63,94,0.08);border-left-color:#f43f5e',
            blue: 'background:rgba(59,130,246,0.08);border-left-color:#3b82f6',
            green: 'background:rgba(34,197,94,0.08);border-left-color:#22c55e',
            gray: 'background:rgba(100,116,139,0.08);border-left-color:#64748b'
          };
          var cs = colorStyles[subjInfo.color] || colorStyles.gray;

          html += '<div class="sched-mobile-card" data-key="' + key + '" data-day="' + day.id + '" data-slot="' + slot.id + '" style="' + cs + '">';
          html += '<div class="mc-time">' + slot.time + '</div>';
          html += '<div class="mc-name">' + cls.subject + '</div>';
          html += '<div class="mc-meta">' + (subjInfo.teacher || '') + ' · ' + cls.location + '</div>';
          html += '<div class="mc-weeks">第' + cls.weeks + '周</div>';
          html += '</div>';
        } else if (cls && adj === 'cancelled') {
          html += '<div class="sched-mobile-card" data-key="' + key + '" data-day="' + day.id + '" data-slot="' + slot.id + '" style="opacity:0.4;border-left-color:var(--rule);text-decoration:line-through">';
          html += '<div class="mc-time">' + slot.time + '</div>';
          html += '<div class="mc-name">' + cls.subject + '（本周取消）</div>';
          html += '</div>';
        } else if (cls && adj && adj.startsWith('adjusted:')) {
          var note = adj.substring(9);
          var subjInfo3 = schedData.subjects[cls.subject] || { color: 'gray' };
          var colorStyles3 = {
            purple: 'background:rgba(99,102,241,0.08);border-left-color:#6366f1',
            teal: 'background:rgba(20,184,166,0.08);border-left-color:#14b8a6',
            amber: 'background:rgba(245,158,11,0.08);border-left-color:#f59e0b',
            rose: 'background:rgba(244,63,94,0.08);border-left-color:#f43f5e',
            blue: 'background:rgba(59,130,246,0.08);border-left-color:#3b82f6',
            green: 'background:rgba(34,197,94,0.08);border-left-color:#22c55e',
            gray: 'background:rgba(100,116,139,0.08);border-left-color:#64748b'
          };
          var cs3 = colorStyles3[subjInfo3.color] || colorStyles3.gray;
          html += '<div class="sched-mobile-card" data-key="' + key + '" data-day="' + day.id + '" data-slot="' + slot.id + '" style="' + cs3 + '">';
          html += '<div class="mc-time">' + slot.time + '</div>';
          html += '<div class="mc-name">' + cls.subject + ' <span style="color:#f59e0b">' + note + '</span></div>';
          html += '<div class="mc-meta">' + cls.location + '</div>';
          html += '</div>';
        } else {
          // 空闲块：显示用户的安排
          var plan = getTimeBlock(day.id, slot.id);
          html += '<div class="sched-mobile-card" data-key="' + key + '" data-day="' + day.id + '" data-slot="' + slot.id + '" data-free="1" style="border-left-color:var(--accent2);background:rgba(20,184,166,0.04)">';
          html += '<div class="mc-time" style="color:var(--accent2)">' + slot.time + '</div>';
          html += '<div class="mc-name" style="color:var(--accent2)">' + (plan || '空闲') + '</div>';
          html += '</div>';
        }
      });

      html += '</div>';
    });

    container.innerHTML = html;

    // Tab switching
    container.querySelectorAll('.sched-mobile-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var idx = this.getAttribute('data-day-idx');
        container.querySelectorAll('.sched-mobile-tab').forEach(function(t) { t.classList.remove('active'); });
        container.querySelectorAll('.sched-mobile-day').forEach(function(d) { d.classList.remove('active'); });
        this.classList.add('active');
        container.querySelector('.sched-mobile-day[data-day-idx="' + idx + '"]').classList.add('active');
      });
    });

    // Mobile card click → same popup as desktop
    container.querySelectorAll('.sched-mobile-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        e.stopPropagation();
        showPopup(this);
      });
    });
  }

  // 供首页空闲块点击调用：跳到课表并打开该节的编辑弹窗
  window._openFreeSlotPopup = function(dayId, slotId) {
    var key = dayId + '-' + slotId;
    var cell = document.querySelector('.sched-cell[data-key="' + key + '"]') ||
               document.querySelector('.sched-mobile-card[data-key="' + key + '"]');
    if (cell) showPopup(cell);
  };

  // ===== Initial render =====
  renderGrid();
  renderMobileView();
})();
