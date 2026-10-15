// ============================================================
// 学委工作 v2 + 时间追踪 + AI对比 + 导出
// ============================================================
(function() {
  // ====== AI通知生成 ======
  var aiNoticeBtn = document.getElementById('ai-notice-btn');
  if (aiNoticeBtn) {
    aiNoticeBtn.addEventListener('click', function() {
      var input = document.getElementById('ai-notice-input');
      var result = document.getElementById('ai-notice-result');
      if (!input || !input.value.trim()) { return; }
      var text = input.value.trim();
      result.innerHTML = '<div style="padding:12px;text-align:center;color:var(--muted)">生成中...</div>';

      // Rule-based notification generation
      setTimeout(function() {
        var lines = [];

        // Extract key info
        var timeMatch = text.match(/(\d+[点:：]\d*|上午|下午|第[一二三四五六七八九十]+节|周[一二三四五六日末])/g);
        var locMatch = text.match(/[\u4e00-\u9fa5]+楼\d+|\d+教室|[\u4e00-\u9fa5]+室\d+/g);
        var courseMatch = text.match(/[\u4e00-\u9fa5a-zA-Z0-9（）()]+课|[\u4e00-\u9fa5a-zA-Z0-9]+实践|[\u4e00-\u9fa5a-zA-Z0-9]+实验/g);

        lines.push('【通知】');
        if (courseMatch) lines.push('课程：' + courseMatch[0]);
        if (timeMatch) lines.push('时间调整：' + [...new Set(timeMatch)].join('、'));
        if (locMatch) lines.push('地点：' + locMatch[0]);

        // Clean up original text
        var cleaned = text.replace(/\s+/g, ' ').trim();
        if (cleaned.length > 10) {
          lines.push('');
          lines.push('详情：' + cleaned);
        }
        lines.push('');
        lines.push('请同学们注意调整，按时到课。');

        var html = '<div style="padding:12px;background:var(--accent-soft);border-radius:var(--radius-sm);font-size:0.84rem;line-height:1.8">';
        html += lines.join('\n').replace(/\n/g, '<br>');
        html += '</div>';
        html += '<button onclick="navigator.clipboard.writeText(this.previousElementDiv.innerText)" style="margin-top:8px;padding:6px 14px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.78rem">复制通知</button>';
        result.innerHTML = html;
      }, 500);
    });
  }

  // ====== 每日时间记录 ======
  var timeTrackKey = 'sop-time-track';
  var timeTrack = {};
  try { timeTrack = JSON.parse(localStorage.getItem(timeTrackKey) || '{}'); } catch(e) {}

  function saveTimeTrack() { localStorage.setItem(timeTrackKey, JSON.stringify(timeTrack)); }

  function getDateStr(offset) {
    var d = new Date();
    d.setDate(d.getDate() + (offset || 0));
    return d.toISOString().slice(0, 10);
  }

  var timeCats = [
    { key: 'class', label: '上课', icon: 'i-book', color: 'var(--accent)' },
    { key: 'study', label: '自习/编码', icon: 'i-target', color: 'var(--accent2)' },
    { key: 'reading', label: '阅读', icon: 'i-book-open', color: '#3b82f6' },
    { key: 'exercise', label: '运动', icon: 'i-activity', color: '#22c55e' },
    { key: 'gaming', label: '游戏/放松', icon: 'i-fire', color: '#f59e0b' },
    { key: 'social', label: '社交/生活', icon: 'i-megaphone', color: '#f43f5e' },
    { key: 'other', label: '其他', icon: 'i-pin', color: 'var(--muted)' }
  ];

  // Custom categories
  var customCatKey = 'sop-time-custom-cats';
  var customCats = [];
  try { customCats = JSON.parse(localStorage.getItem(customCatKey) || '[]'); } catch(e) {}
  function saveCustomCats() { localStorage.setItem(customCatKey, JSON.stringify(customCats)); }

  function getAllCats() {
    return timeCats.concat(customCats.map(function(c, i) {
      return { key: 'custom_' + i, label: c.label, icon: 'i-pin', color: c.color || 'var(--accent)' };
    }));
  }

  // Get class hours from schedule for a specific date
  function getClassHours(dateStr) {
    if (typeof schedData === 'undefined') return 0;
    var d = new Date(dateStr);
    var dayMap = ['sun','mon','tue','wed','thu','fri','sat'];
    var dayId = dayMap[d.getDay()];
    var count = 0;
    schedData.timeSlots.forEach(function(slot) {
      var cls = schedData.grid[dayId] && schedData.grid[dayId][slot.id];
      var key = dayId + '-' + slot.id;
      var adj = adjustments[key];
      if (cls && !adj) count++;
      else if (cls && adj === 'cancelled') { /* cancelled = no class */ }
      else if (cls && adj && adj.startsWith('adjusted:')) count++;
    });
    return count;
  }

  function getClassNames(dateStr) {
    if (typeof schedData === 'undefined') return [];
    var d = new Date(dateStr);
    var dayMap = ['sun','mon','tue','wed','thu','fri','sat'];
    var dayId = dayMap[d.getDay()];
    var names = [];
    schedData.timeSlots.forEach(function(slot) {
      var cls = schedData.grid[dayId] && schedData.grid[dayId][slot.id];
      var key = dayId + '-' + slot.id;
      var adj = adjustments[key];
      if (cls && !adj) names.push(cls.subject);
      else if (cls && adj && adj.startsWith('adjusted:')) names.push(cls.subject);
    });
    return names;
  }

  var activeDay = 0;

  function renderTimeTabs() {
    var el = document.getElementById('time-tracker-tabs');
    if (!el) return;
    var html = '';
    for (var i = -6; i <= 0; i++) {
      var ds = getDateStr(i);
      var d = new Date(ds);
      var label = (d.getMonth()+1) + '/' + d.getDate();
      var isToday = i === 0;
      var isActive = i === activeDay;
      html += '<button class="tab' + (isActive ? ' active' : '') + '" data-day="' + i + '" style="padding:6px 10px;border:1px solid ' + (isActive ? 'var(--accent)' : 'var(--rule)') + ';border-radius:var(--radius-sm);background:' + (isActive ? 'var(--accent-soft)' : 'none') + ';color:' + (isActive ? 'var(--accent)' : 'var(--muted)') + ';cursor:pointer;font-size:0.76rem;font-weight:' + (isActive ? '600' : '400') + '">' + label + (isToday ? '(今)' : '') + '</button>';
    }
    el.innerHTML = html;
    el.querySelectorAll('button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        activeDay = parseInt(this.getAttribute('data-day'));
        renderTimeTabs();
        renderTimeForm();
      });
    });
  }

  function renderTimeForm() {
    var el = document.getElementById('time-tracker-form');
    if (!el) return;
    var ds = getDateStr(activeDay);
    var dayData = timeTrack[ds] || {};
    var allCats = getAllCats();

    // Auto-fill class hours from schedule
    var classHours = getClassHours(ds);
    var classNames = getClassNames(ds);
    if (classHours > 0) {
      if (!dayData.class || dayData.class === 0) {
        dayData.class = classHours;
        timeTrack[ds] = dayData;
      }
    }

    var html = '';

    // Class info banner
    if (classHours > 0) {
      html += '<div style="padding:8px 12px;background:var(--accent-soft);border-radius:var(--radius-sm);margin-bottom:10px;font-size:0.78rem;color:var(--accent)">';
      html += '今日 ' + classHours + ' 节大课：' + classNames.join('、');
      html += '</div>';
    }

    // Categories with aligned layout
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    allCats.forEach(function(c) {
      var val = dayData[c.key] || '';
      var isClass = c.key === 'class';
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border:1px solid var(--rule);border-radius:var(--radius-sm)">';
      html += '<svg width="18" height="18" style="color:' + c.color + ';flex-shrink:0"><use href="#' + c.icon + '"/></svg>';
      html += '<span style="font-size:0.78rem;color:var(--muted);white-space:nowrap;width:80px;flex-shrink:0">' + c.label + '</span>';
      html += '<input type="number" step="0.5" min="0" data-cat="' + c.key + '" value="' + (val || '') + '" placeholder="0" style="width:60px;flex-shrink:0;padding:4px 6px;border:1px solid var(--rule);border-radius:6px;font-size:0.84rem;text-align:right;background:var(--bg2);outline:none" />';
      html += '<span style="font-size:0.78rem;color:var(--muted);flex-shrink:0">h</span>';
      if (isClass && classHours > 0) {
        html += '<span style="font-size:0.7rem;color:var(--accent);margin-left:auto">课表自动</span>';
      }
      // Delete button for custom categories
      if (c.key.indexOf('custom_') === 0) {
        var ci = parseInt(c.key.replace('custom_', ''));
        html += '<button onclick="window.__delCustomCat(' + ci + ')" style="margin-left:auto;border:none;background:none;color:#f43f5e;cursor:pointer;font-size:0.72rem;flex-shrink:0">删除</button>';
      }
      html += '</div>';
    });
    html += '</div>';

    // Add custom category
    html += '<div style="margin-top:8px;display:flex;gap:6px">';
    html += '<input id="new-cat-name" type="text" placeholder="新分类名称" style="flex:1;padding:6px 10px;border:1px solid var(--rule);border-radius:6px;font-size:0.78rem;background:var(--bg);outline:none" />';
    html += '<button id="add-cat-btn" style="padding:6px 14px;background:none;border:1px dashed var(--rule);border-radius:6px;cursor:pointer;font-size:0.76rem;color:var(--muted)">+ 添加分类</button>';
    html += '</div>';

    html += '<div style="margin-top:10px;display:flex;gap:8px"><button id="time-track-save" style="flex:1;padding:8px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;font-weight:600">保存</button></div>';
    html += '<div id="time-track-saved" style="margin-top:6px;font-size:0.76rem;color:var(--accent2);text-align:center"></div>';
    el.innerHTML = html;

    el.querySelectorAll('input[data-cat]').forEach(function(input) {
      input.addEventListener('input', function() {
        var cat = this.getAttribute('data-cat');
        var val = parseFloat(this.value);
        if (!timeTrack[ds]) timeTrack[ds] = {};
        timeTrack[ds][cat] = isNaN(val) ? 0 : val;
      });
    });

    var addCatBtn = document.getElementById('add-cat-btn');
    if (addCatBtn) {
      addCatBtn.addEventListener('click', function() {
        var nameInput = document.getElementById('new-cat-name');
        var name = nameInput ? nameInput.value.trim() : '';
        if (!name) return;
        customCats.push({ label: name, color: 'var(--accent)' });
        saveCustomCats();
        renderTimeForm();
      });
    }

    var saveBtn = document.getElementById('time-track-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        saveTimeTrack();
        var msg = document.getElementById('time-track-saved');
        if (msg) { msg.textContent = '已保存'; setTimeout(function(){ msg.textContent = ''; }, 1500); }
        renderWeeklyChart();
      });
    }
  }

  window.__delCustomCat = function(i) {
    customCats.splice(i, 1);
    saveCustomCats();
    renderTimeForm();
  };

  function renderWeeklyChart() {
    var el = document.getElementById('time-weekly-chart');
    if (!el) return;

    var allCats = getAllCats();
    // Collect this week's data
    var weekData = {};
    allCats.forEach(function(c) { weekData[c.key] = 0; });

    for (var i = -6; i <= 0; i++) {
      var ds = getDateStr(i);
      if (timeTrack[ds]) {
        allCats.forEach(function(c) {
          weekData[c.key] += timeTrack[ds][c.key] || 0;
        });
      }
    }

    var total = Object.values(weekData).reduce(function(a, b) { return a + b; }, 0);
    if (total === 0) {
      el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.84rem">本周暂无数据，先记录几天吧</div>';
      return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:8px">';
    allCats.forEach(function(c) {
      var val = weekData[c.key];
      var pct = total > 0 ? Math.round(val / total * 100) : 0;
      html += '<div style="display:flex;align-items:center;gap:8px">';
      html += '<svg width="16" height="16" style="color:' + c.color + ';flex-shrink:0"><use href="#' + c.icon + '"/></svg>';
      html += '<span style="font-size:0.78rem;width:80px;flex-shrink:0">' + c.label + '</span>';
      html += '<div style="flex:1;height:20px;background:var(--bg3);border-radius:6px;overflow:hidden">';
      html += '<div style="height:100%;width:' + pct + '%;background:' + c.color + ';border-radius:6px;transition:width 0.4s"></div>';
      html += '</div>';
      html += '<span style="font-size:0.76rem;width:60px;text-align:right;color:var(--muted)">' + val.toFixed(1) + 'h (' + pct + '%)</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="margin-top:12px;padding:8px 12px;background:var(--bg);border-radius:var(--radius-sm);font-size:0.8rem;color:var(--muted)">本周总计：<strong style="color:var(--ink)">' + total.toFixed(1) + 'h</strong></div>';
    el.innerHTML = html;
  }

  // ====== AI双周对比 ======
  var aiCompareBtn = document.getElementById('ai-compare-btn');
  if (aiCompareBtn) {
    aiCompareBtn.addEventListener('click', function() {
      var result = document.getElementById('ai-comparison-result');
      if (!result) return;
      result.innerHTML = '<div style="padding:12px;text-align:center;color:var(--muted)">分析中...</div>';

      setTimeout(function() {
        // Get this week and last week data
        var allCats = getAllCats();
        var thisWeek = {}, lastWeek = {};
        allCats.forEach(function(c) { thisWeek[c.key] = 0; lastWeek[c.key] = 0; });

        for (var i = 0; i <= 6; i++) {
          var ds = getDateStr(-i);
          if (timeTrack[ds]) {
            allCats.forEach(function(c) { thisWeek[c.key] += timeTrack[ds][c.key] || 0; });
          }
        }
        for (var j = 7; j <= 13; j++) {
          var ds2 = getDateStr(-j);
          if (timeTrack[ds2]) {
            allCats.forEach(function(c) { lastWeek[c.key] += timeTrack[ds2][c.key] || 0; });
          }
        }

        var thisTotal = Object.values(thisWeek).reduce(function(a, b) { return a + b; }, 0);
        var lastTotal = Object.values(lastWeek).reduce(function(a, b) { return a + b; }, 0);

        if (thisTotal === 0 && lastTotal === 0) {
          result.innerHTML = '<div style="padding:12px;text-align:center;color:var(--muted);font-size:0.84rem">需要先记录至少两周的数据才能对比</div>';
          return;
        }

        var lines = [];
        lines.push('【双周对比分析】');
        lines.push('');
        lines.push('本周总计 ' + thisTotal.toFixed(1) + 'h，上周 ' + lastTotal.toFixed(1) + 'h');

        if (lastTotal > 0) {
          var change = ((thisTotal - lastTotal) / lastTotal * 100).toFixed(0);
          lines.push('总时间' + (change >= 0 ? '增加' : '减少') + ' ' + Math.abs(change) + '%');
        }

        lines.push('');
        lines.push('变化明细：');

        allCats.forEach(function(c) {
          var diff = thisWeek[c.key] - lastWeek[c.key];
          if (Math.abs(diff) >= 0.5) {
            var arrow = diff > 0 ? '↑' : '↓';
            lines.push('· ' + c.label + ': ' + lastWeek[c.key].toFixed(1) + 'h → ' + thisWeek[c.key].toFixed(1) + 'h ' + arrow + Math.abs(diff).toFixed(1) + 'h');
          }
        });

        // Pattern analysis
        lines.push('');
        lines.push('模式洞察：');

        var studyTime = thisWeek.study + thisWeek.reading;
        var lastStudy = lastWeek.study + lastWeek.reading;
        if (studyTime > 0 && lastStudy > 0) {
          if (studyTime > lastStudy * 1.1) lines.push('· 学习时间上升，保持势头');
          else if (studyTime < lastStudy * 0.9) lines.push('· 学习时间下降，注意调整');
        }

        var gameRatio = thisTotal > 0 ? thisWeek.gaming / thisTotal : 0;
        var lastGameRatio = lastTotal > 0 ? lastWeek.gaming / lastTotal : 0;
        if (gameRatio > 0.25) lines.push('· 娱乐占比' + Math.round(gameRatio * 100) + '%，偏高');
        if (gameRatio > lastGameRatio + 0.05) lines.push('· 娱乐比例在上升');

        var classRatio = thisTotal > 0 ? thisWeek.class / thisTotal : 0;
        if (classRatio > 0.4) lines.push('· 课程占比大，注意碎片时间利用');

        if (thisWeek.exercise < 2) lines.push('· 运动不足2小时，建议增加');
        if (thisWeek.exercise > lastWeek.exercise) lines.push('· 运动增加，nice');

        lines.push('');
        lines.push('建议：');
        if (studyTime > lastStudy && gameRatio < 0.2) {
          lines.push('· 状态良好，继续保持当前节奏');
        } else if (gameRatio > 0.25) {
          lines.push('· 减少游戏时间，分配到学习或运动');
        } else {
          lines.push('· 稳定作息，增加深度学习时间');
        }

        var html = '<div style="padding:14px;background:var(--accent-soft);border-radius:var(--radius-sm);font-size:0.82rem;line-height:2;white-space:pre-wrap">' + lines.join('\n') + '</div>';
        result.innerHTML = html;
      }, 600);
    });
  }

  // ====== 医疗检查记录 ======
  var medKey = 'sop-medical-records';
  var medRecords = [];
  try { medRecords = JSON.parse(localStorage.getItem(medKey) || '[]'); } catch(e) {}

  function saveMed() { localStorage.setItem(medKey, JSON.stringify(medRecords)); }

  function renderMed() {
    var el = document.getElementById('medical-records');
    if (!el) return;
    if (medRecords.length === 0) {
      el.innerHTML = '';
      return;
    }
    var html = '';
    medRecords.forEach(function(r, i) {
      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--rule);border-radius:6px;margin-top:6px;font-size:0.78rem">';
      html += '<span style="color:var(--muted)">' + r.date + '</span>';
      html += '<span style="font-weight:600">' + escapeHtml(r.item) + '</span>';
      html += '<span style="color:var(--muted)">' + escapeHtml(r.result) + '</span>';
      html += '<button onclick="window.__delMed(' + i + ')" style="margin-left:auto;color:#f43f5e;border:none;background:none;cursor:pointer;font-size:0.74rem">删除</button>';
      html += '</div>';
    });
    el.innerHTML = html;
  }

  window.__delMed = function(i) { medRecords.splice(i, 1); saveMed(); renderMed(); };

  var medSaveBtn = document.getElementById('med-save-btn');
  if (medSaveBtn) {
    medSaveBtn.addEventListener('click', function() {
      var date = document.getElementById('med-date').value;
      var item = document.getElementById('med-item').value;
      var result = document.getElementById('med-result').value;
      if (!date || !item) return;
      medRecords.push({ date: date, item: item, result: result || '' });
      saveMed();
      renderMed();
      document.getElementById('med-date').value = '';
      document.getElementById('med-item').value = '';
      document.getElementById('med-result').value = '';
      document.getElementById('medical-add-row').style.display = 'none';
    });
  }

  // ====== 导出全部数据 ======
  var exportAllBtn = document.getElementById('export-all-data');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', function() {
      var allData = {};
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.startsWith('sop-')) {
          allData[key] = localStorage.getItem(key);
        }
      }
      allData['_exportTime'] = new Date().toISOString();
      var blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sop-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
    });
  }

  // ====== 导入数据 ======
  var importBtn = document.getElementById('import-data-btn');
  var importInput = document.getElementById('import-file-input');
  if (importBtn && importInput) {
    importBtn.addEventListener('click', function() { importInput.click(); });
    importInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (confirm('导入将覆盖现有数据，确定？')) {
            Object.keys(data).forEach(function(key) {
              if (key.startsWith('sop-')) localStorage.setItem(key, data[key]);
            });
            alert('导入成功，刷新页面生效');
            location.reload();
          }
        } catch(err) {
          alert('文件格式错误');
        }
      };
      reader.readAsText(file);
    });
  }

  // ====== Init ======
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function init() {
    renderCrLog();
    renderCrReq();
    renderCrAssign();
    renderTimeTabs();
    renderTimeForm();
    renderWeeklyChart();
    renderMed();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
