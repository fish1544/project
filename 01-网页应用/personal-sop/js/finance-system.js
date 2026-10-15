// ============================================================
// 记账系统 v3 - 纯支出追踪
// 月度汇总录入 · 6月趋势 · 预算管理
// ============================================================
(function() {
  var STORAGE_KEY = 'sop-finance-v3';
  var data = {
    months: {},
    budget: 1500
  };

  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) data = Object.assign(data, saved);
  } catch(e) {}

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  function monthStr(offset) {
    var d = new Date();
    d.setMonth(d.getMonth() + (offset || 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function monthLabel(ms) {
    var p = ms.split('-');
    return p[0] + '.' + parseInt(p[1]);
  }

  function monthFull(ms) {
    var p = ms.split('-');
    return p[0] + '年' + parseInt(p[1]) + '月';
  }

  var viewOffset = 0;

  function getMonth(ms) {
    if (!data.months[ms]) {
      data.months[ms] = { food: 0, transport: 0, shopping: 0, study: 0, fun: 0, other: 0, note: '' };
    }
    return data.months[ms];
  }

  function getMonthTotal(ms) {
    var m = data.months[ms];
    if (!m) return 0;
    return (m.food||0) + (m.transport||0) + (m.shopping||0) + (m.study||0) + (m.fun||0) + (m.other||0);
  }

  var categories = [
    { key: 'food',     label: '餐饮',       icon: 'i-receipt',  color: '#f59e0b' },
    { key: 'transport',label: '交通',       icon: 'i-activity', color: '#3b82f6' },
    { key: 'shopping', label: '购物',       icon: 'i-palette',  color: '#f43f5e' },
    { key: 'study',    label: '学习',       icon: 'i-book',     color: 'var(--accent)' },
    { key: 'fun',      label: '娱乐',       icon: 'i-fire',     color: '#22c55e' },
    { key: 'other',    label: '其他',       icon: 'i-pin',      color: 'var(--muted)' }
  ];

  function renderSummary() {
    var ms = monthStr(viewOffset);
    var m = getMonth(ms);
    var total = getMonthTotal(ms);
    var budget = parseFloat(data.budget) || 0;
    var pct = budget > 0 ? Math.min(100, Math.round(total / budget * 100)) : 0;
    var barColor = pct >= 100 ? '#f43f5e' : (pct >= 80 ? '#f59e0b' : 'var(--accent)');

    var label = document.getElementById('finance-month-label');
    if (label) label.textContent = monthFull(ms) + ' · 月度汇总';

    var budgetBar = document.getElementById('fin-budget-bar');
    if (budgetBar) {
      budgetBar.innerHTML =
        '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">' +
          '<span style="font-size:1.1rem;font-weight:700">¥' + total.toFixed(0) + '</span>' +
          '<span style="font-size:0.78rem;color:var(--muted)">/ 预算 ¥' + budget.toFixed(0) + '</span>' +
          '<span style="margin-left:auto;font-size:0.76rem;font-weight:600;padding:2px 8px;border-radius:100px;background:' + (pct>=100?'rgba(244,63,94,0.1)':'rgba(91,97,235,0.08)') + ';color:' + barColor + '">' + pct + '%</span>' +
        '</div>' +
        '<div style="height:8px;background:var(--bg3);border-radius:100px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:100px;transition:width 0.4s ease"></div>' +
        '</div>' +
        '<div style="font-size:0.76rem;color:var(--muted);margin-top:4px">点击下方预算数字设置</div>';
    }
  }

  function renderInputForm() {
    var el = document.getElementById('fin-input-form');
    if (!el) return;
    var ms = monthStr(viewOffset);
    var m = getMonth(ms);

    var html = '<div style="display:flex;flex-direction:column;gap:6px">';
    categories.forEach(function(c) {
      var val = m[c.key] || 0;
      html +=
        '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border:1px solid var(--rule);border-radius:var(--radius-sm)">' +
          '<svg width="18" height="18" style="color:' + c.color + ';flex-shrink:0"><use href="#' + c.icon + '"/></svg>' +
          '<span style="font-size:0.78rem;color:var(--muted);white-space:nowrap;width:60px;flex-shrink:0">' + c.label + '</span>' +
          '<span style="font-size:0.78rem;color:var(--muted);flex-shrink:0">¥</span>' +
          '<input type="number" data-cat="' + c.key + '" value="' + (val || '') + '" placeholder="0" style="width:80px;flex-shrink:0;padding:4px 6px;border:1px solid var(--rule);border-radius:6px;font-size:0.84rem;text-align:right;background:var(--bg2);outline:none" />' +
        '</div>';
    });
    html += '</div>';

    html += '<div style="margin-top:8px">' +
      '<input type="text" id="fin-note" value="' + (m.note || '') + '" placeholder="备注（可选）" style="width:100%;padding:8px 10px;border:1px solid var(--rule);border-radius:var(--radius-sm);font-size:0.78rem;box-sizing:border-box;background:var(--bg);outline:none" />' +
    '</div>';

    html += '<div style="margin-top:10px;display:flex;gap:8px">' +
      '<button id="fin-save-btn" style="flex:1;padding:8px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;font-weight:600">保存月度数据</button>' +
      '<button id="fin-clear-btn" style="padding:8px 14px;background:none;border:1px solid var(--rule);border-radius:var(--radius-sm);cursor:pointer;font-size:0.78rem;color:var(--muted)">清空</button>' +
    '</div>';

    el.innerHTML = html;

    el.querySelectorAll('input[data-cat]').forEach(function(input) {
      input.addEventListener('input', function() {
        var cat = this.getAttribute('data-cat');
        var val = parseFloat(this.value);
        m[cat] = isNaN(val) ? 0 : val;
      });
      input.addEventListener('focus', function() { this.style.borderColor = 'var(--accent)'; });
      input.addEventListener('blur', function() { this.style.borderColor = 'var(--rule)'; });
    });

    var noteInput = document.getElementById('fin-note');
    if (noteInput) noteInput.addEventListener('input', function() { m.note = this.value; });

    var saveBtn = document.getElementById('fin-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        save();
        renderAll();
        this.textContent = '已保存 ✓';
        var btn = this;
        setTimeout(function() { btn.textContent = '保存月度数据'; }, 1500);
      });
    }

    var clearBtn = document.getElementById('fin-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        if (!confirm('清空本月所有数据？')) return;
        delete data.months[monthStr(viewOffset)];
        save();
        renderAll();
      });
    }
  }

  function renderTrend() {
    var el = document.getElementById('fin-trend');
    if (!el) return;

    var months = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date();
      d.setMonth(d.getMonth() - i);
      var ms = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      months.push({ ms: ms, total: getMonthTotal(ms) });
    }

    var maxVal = Math.max.apply(null, months.map(function(m) { return m.total; })) || 100;

    var html = '<div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding:0 4px">';
    months.forEach(function(m) {
      var hExp = m.total > 0 ? Math.max(4, (m.total / maxVal * 100)) : 0;
      var isView = m.ms === monthStr(viewOffset);
      html +=
        '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer" data-ms="' + m.ms + '">' +
          '<div style="font-size:0.68rem;color:var(--muted)">' + (m.total > 0 ? '¥' + m.total.toFixed(0) : '') + '</div>' +
          '<div style="display:flex;align-items:flex-end;gap:2px;height:80px;width:100%;justify-content:center">' +
            '<div style="width:14px;height:' + hExp + 'px;background:' + (isView ? 'var(--accent)' : 'rgba(91,97,235,0.3)') + ';border-radius:4px 4px 0 0"></div>' +
          '</div>' +
          '<div style="font-size:0.68rem;color:' + (isView ? 'var(--accent)' : 'var(--muted)') + ';font-weight:' + (isView ? '700' : '400') + '">' + monthLabel(m.ms) + '</div>' +
        '</div>';
    });
    html += '</div>';

    el.innerHTML = html;

    el.querySelectorAll('[data-ms]').forEach(function(bar) {
      bar.addEventListener('click', function() {
        var ms = this.getAttribute('data-ms');
        var now = monthStr(0);
        var parts = ms.split('-');
        var nowParts = now.split('-');
        viewOffset = (parseInt(parts[0]) - parseInt(nowParts[0])) * 12 + (parseInt(parts[1]) - parseInt(nowParts[1]));
        renderAll();
      });
    });
  }

  function renderBudgetSettings() {
    var el = document.getElementById('fin-budget-edit');
    if (!el) return;
    el.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px">' +
        '<span style="font-size:0.78rem;color:var(--muted)">月预算</span>' +
        '<span style="font-size:0.78rem;color:var(--muted)">¥</span>' +
        '<input type="number" id="fin-budget-input" value="' + (data.budget || 0) + '" placeholder="1500" style="width:80px;padding:4px 6px;border:1px solid var(--rule);border-radius:6px;font-size:0.84rem;text-align:right;background:var(--bg2);outline:none" />' +
      '</div>';
    var input = document.getElementById('fin-budget-input');
    if (input) {
      input.addEventListener('change', function() {
        data.budget = parseFloat(this.value) || 0;
        save();
        renderAll();
      });
    }
  }

  function renderAll() {
    renderSummary();
    renderInputForm();
    renderTrend();
    renderBudgetSettings();
  }

  function init() {
    var prevBtn = document.getElementById('fin-prev-month');
    var nextBtn = document.getElementById('fin-next-month');
    if (prevBtn) prevBtn.addEventListener('click', function() { viewOffset--; renderAll(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { viewOffset++; renderAll(); });
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
