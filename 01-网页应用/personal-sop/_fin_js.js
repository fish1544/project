const fs = require('fs');
const p = 'D:/Project/personal-sop/standalone.html';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Replace lines 3581-3815 (1-indexed) = index 3580 to 3814
const start = 3580; // <script>
const end = 3814;   // </script>

const newJs = `<script>
// ============================================================
// 记账系统 v4 - 动态分类 + 饼图 + 预算
// ============================================================
(function() {
  var DATA_KEY = 'sop-finance-v4';
  var CATS_KEY = 'sop-fin-cats-v1';

  var DEFAULT_CATS = [
    { key: 'food',     label: '餐饮', color: '#f59e0b' },
    { key: 'transport',label: '交通', color: '#3b82f6' },
    { key: 'shopping', label: '购物', color: '#f43f5e' },
    { key: 'study',    label: '学习', color: '#8b5cf6' },
    { key: 'fun',      label: '娱乐', color: '#22c55e' },
    { key: 'other',    label: '其他', color: '#94a3b8' }
  ];

  var data = { months: {}, budget: 1500 };
  var cats = [];

  function load() {
    try { data = Object.assign(data, JSON.parse(localStorage.getItem(DATA_KEY) || '{}')); } catch(e) {}
    try { cats = JSON.parse(localStorage.getItem(CATS_KEY) || 'null'); } catch(e) {}
    if (!cats || !Array.isArray(cats) || !cats.length) cats = DEFAULT_CATS.slice();
  }
  function save() {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    localStorage.setItem(CATS_KEY, JSON.stringify(cats));
  }

  // 迁移旧数据
  try {
    var old = JSON.parse(localStorage.getItem('sop-finance-v3') || 'null');
    if (old && !localStorage.getItem(DATA_KEY)) {
      data.months = old.months || {};
      data.budget = old.budget || 1500;
      save();
    }
  } catch(e) {}

  load();
  var viewOffset = 0;

  function monthStr(off) {
    var d = new Date(); d.setMonth(d.getMonth() + (off||0));
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  }
  function monthFull(ms) { var p = ms.split('-'); return p[0]+'年'+parseInt(p[1])+'月'; }
  function monthLabel(ms) { var p = ms.split('-'); return p[0]+'.'+parseInt(p[1]); }
  function getMonth(ms) {
    if (!data.months[ms]) {
      var o = {}; cats.forEach(function(c){ o[c.key] = 0; }); o.note = '';
      data.months[ms] = o;
    }
    return data.months[ms];
  }
  function getTotal(ms) {
    var m = data.months[ms]; if (!m) return 0;
    var t = 0; cats.forEach(function(c){ t += parseFloat(m[c.key])||0; });
    return t;
  }

  // ---- 饼图 (conic-gradient donut) ----
  function renderPie() {
    var el = document.getElementById('fin-pie');
    if (!el) return;
    var ms = monthStr(viewOffset);
    var segs = cats.map(function(c){
      var v = parseFloat(data.months[ms] && data.months[ms][c.key]) || 0;
      return { label: c.label, color: c.color, value: v };
    }).filter(function(s){ return s.value > 0; });
    var total = segs.reduce(function(a,b){ return a+b.value; }, 0);

    if (total === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:0.76rem">暂无数据<br><span style="font-size:0.66rem">录入后自动生成饼图</span></div>';
      return;
    }
    var acc = 0;
    var stops = segs.map(function(s){
      var start = acc / total * 360; acc += s.value;
      var end = acc / total * 360;
      return s.color + ' ' + start.toFixed(1) + 'deg ' + end.toFixed(1) + 'deg';
    }).join(', ');

    var legend = segs.map(function(s){
      var pct = Math.round(s.value/total*100);
      return '<div style="display:flex;align-items:center;gap:6px;font-size:0.72rem;margin-top:4px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:'+s.color+';flex-shrink:0"></span>' +
        '<span style="color:var(--muted);flex:1">'+s.label+'</span>' +
        '<span style="font-weight:600">¥'+s.value.toFixed(0)+'</span>' +
        '<span style="color:var(--muted);width:34px;text-align:right">'+pct+'%</span></div>';
    }).join('');

    el.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center">'+
        '<div style="width:120px;height:120px;border-radius:50%;background:conic-gradient('+stops+');position:relative">'+
          '<div style="position:absolute;inset:22px;background:var(--bg2);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center">'+
            '<span style="font-size:0.95rem;font-weight:700">¥'+total.toFixed(0)+'</span>'+
            '<span style="font-size:0.62rem;color:var(--muted)">总支出</span>'+
          '</div>'+
        '</div>'+
        '<div style="width:100%;margin-top:8px">'+legend+'</div>'+
      '</div>';
  }

  function renderSummary() {
    var ms = monthStr(viewOffset);
    var total = getTotal(ms);
    var budget = parseFloat(data.budget)||0;
    var pct = budget > 0 ? Math.min(100, Math.round(total/budget*100)) : 0;
    var barColor = pct >= 100 ? '#f43f5e' : (pct >= 80 ? '#f59e0b' : 'var(--accent)');
    var label = document.getElementById('finance-month-label');
    if (label) label.textContent = monthFull(ms) + ' · 月度汇总';
    var bb = document.getElementById('fin-budget-bar');
    if (bb) {
      bb.innerHTML =
        '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">'+
          '<span style="font-size:1.1rem;font-weight:700">¥'+total.toFixed(0)+'</span>'+
          '<span style="font-size:0.78rem;color:var(--muted)">/ 预算 ¥'+budget.toFixed(0)+'</span>'+
          '<span style="margin-left:auto;font-size:0.76rem;font-weight:600;padding:2px 8px;border-radius:100px;background:'+(pct>=100?'rgba(244,63,94,0.1)':'rgba(91,97,235,0.08)')+';color:'+barColor+'">'+pct+'%</span>'+
        '</div>'+
        '<div style="height:8px;background:var(--bg3);border-radius:100px;overflow:hidden">'+
          '<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:100px;transition:width 0.4s ease"></div>'+
        '</div>';
    }
  }

  function renderForm() {
    var el = document.getElementById('fin-input-form');
    if (!el) return;
    var ms = monthStr(viewOffset);
    var m = getMonth(ms);
    var html = '<div style="display:flex;flex-direction:column;gap:6px">';
    cats.forEach(function(c) {
      var val = m[c.key] || 0;
      html +=
        '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg);border:1px solid var(--rule);border-radius:var(--radius-sm)">'+
          '<span style="width:10px;height:10px;border-radius:50%;background:'+c.color+';flex-shrink:0"></span>'+
          '<span style="font-size:0.78rem;flex:1">'+c.label+'</span>'+
          '<span style="font-size:0.78rem;color:var(--muted)">¥</span>'+
          '<input type="number" data-cat="'+c.key+'" value="'+(val||'')+'" placeholder="0" style="width:76px;padding:4px 6px;border:1px solid var(--rule);border-radius:6px;font-size:0.82rem;text-align:right;background:var(--bg2);outline:none">'+
        '</div>';
    });
    html += '</div>';
    html += '<div style="margin-top:8px"><input type="text" id="fin-note" value="'+(m.note||'').replace(/"/g,'&quot;')+'" placeholder="备注（可选）" style="width:100%;padding:7px 10px;border:1px solid var(--rule);border-radius:var(--radius-sm);font-size:0.78rem;box-sizing:border-box;background:var(--bg);outline:none"></div>';
    html += '<div style="margin-top:10px;display:flex;gap:8px">'+
      '<button id="fin-save-btn" style="flex:1;padding:8px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;font-weight:600">保存</button>'+
      '<button id="fin-clear-btn" style="padding:8px 14px;background:none;border:1px solid var(--rule);border-radius:var(--radius-sm);cursor:pointer;font-size:0.78rem;color:var(--muted)">清空</button>'+
    '</div>';
    el.innerHTML = html;

    el.querySelectorAll('input[data-cat]').forEach(function(inp){
      inp.addEventListener('input', function(){
        var cat = this.getAttribute('data-cat');
        var v = parseFloat(this.value);
        m[cat] = isNaN(v) ? 0 : v;
      });
      inp.addEventListener('focus', function(){ this.style.borderColor='var(--accent)'; });
      inp.addEventListener('blur', function(){ this.style.borderColor='var(--rule)'; });
    });
    var ni = document.getElementById('fin-note');
    if (ni) ni.addEventListener('input', function(){ m.note = this.value; });
    var sb = document.getElementById('fin-save-btn');
    if (sb) sb.addEventListener('click', function(){
      save(); renderAll();
      this.textContent = '已保存 ✓'; var b = this;
      setTimeout(function(){ b.textContent = '保存'; }, 1200);
    });
    var cb = document.getElementById('fin-clear-btn');
    if (cb) cb.addEventListener('click', function(){
      if (!confirm('清空本月所有数据？')) return;
      delete data.months[monthStr(viewOffset)];
      save(); renderAll();
    });
  }

  function renderTrend() {
    var el = document.getElementById('fin-trend');
    if (!el) return;
    var months = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(); d.setMonth(d.getMonth()-i);
      var ms = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      months.push({ ms: ms, total: getTotal(ms) });
    }
    var maxVal = Math.max.apply(null, months.map(function(m){ return m.total; })) || 100;
    var html = '<div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding:0 4px">';
    months.forEach(function(m){
      var hExp = m.total > 0 ? Math.max(4, m.total/maxVal*100) : 0;
      var isView = m.ms === monthStr(viewOffset);
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer" data-ms="'+m.ms+'">'+
        '<div style="font-size:0.68rem;color:var(--muted)">'+(m.total>0?'¥'+m.total.toFixed(0):'')+'</div>'+
        '<div style="display:flex;align-items:flex-end;height:80px;width:100%;justify-content:center">'+
          '<div style="width:14px;height:'+hExp+'px;background:'+(isView?'var(--accent)':'rgba(91,97,235,0.3)')+';border-radius:4px 4px 0 0"></div>'+
        '</div>'+
        '<div style="font-size:0.68rem;color:'+(isView?'var(--accent)':'var(--muted)')+';font-weight:'+(isView?'700':'400')+'">'+monthLabel(m.ms)+'</div>'+
      '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
    el.querySelectorAll('[data-ms]').forEach(function(bar){
      bar.addEventListener('click', function(){
        var ms = this.getAttribute('data-ms');
        var now = monthStr(0);
        var p1 = ms.split('-'), p2 = now.split('-');
        viewOffset = (parseInt(p1[0])-parseInt(p2[0]))*12 + (parseInt(p1[1])-parseInt(p2[1]));
        renderAll();
      });
    });
  }

  function renderBudget() {
    var el = document.getElementById('fin-budget-edit');
    if (!el) return;
    el.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px">'+
        '<span style="font-size:0.78rem;color:var(--muted)">月预算</span>'+
        '<span style="font-size:0.78rem;color:var(--muted)">¥</span>'+
        '<input type="number" id="fin-budget-input" value="'+(data.budget||0)+'" placeholder="1500" style="width:80px;padding:4px 6px;border:1px solid var(--rule);border-radius:6px;font-size:0.84rem;text-align:right;background:var(--bg2);outline:none">'+
      '</div>';
    var inp = document.getElementById('fin-budget-input');
    if (inp) inp.addEventListener('change', function(){
      data.budget = parseFloat(this.value)||0; save(); renderAll();
    });
  }

  // ---- 分类管理弹窗 ----
  function renderCatList() {
    var el = document.getElementById('fin-cat-list');
    if (!el) return;
    el.innerHTML = cats.map(function(c, i){
      return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--rule)">'+
        '<input type="color" value="'+c.color+'" data-cat-color="'+i+'" style="width:28px;height:28px;border:1px solid var(--rule);border-radius:6px;padding:1px;cursor:pointer;background:var(--bg)">'+
        '<input type="text" value="'+c.label.replace(/"/g,'&quot;')+'" data-cat-name="'+i+'" style="flex:1;padding:5px 8px;border:1px solid var(--rule);border-radius:6px;font-size:0.82rem;background:var(--bg);outline:none">'+
        '<button data-cat-del="'+i+'" style="background:none;border:none;color:#f43f5e;cursor:pointer;font-size:1rem;padding:4px 6px" title="删除">×</button>'+
      '</div>';
    }).join('');
    el.querySelectorAll('[data-cat-color]').forEach(function(inp){
      inp.addEventListener('change', function(){
        cats[parseInt(this.getAttribute('data-cat-color'))].color = this.value; save(); renderAll();
      });
    });
    el.querySelectorAll('[data-cat-name]').forEach(function(inp){
      inp.addEventListener('change', function(){
        cats[parseInt(this.getAttribute('data-cat-name'))].label = this.value.trim(); save(); renderAll();
      });
    });
    el.querySelectorAll('[data-cat-del]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var i = parseInt(this.getAttribute('data-cat-del'));
        if (!confirm('删除分类「'+cats[i].label+'」？历史数据会保留在月份中但不再显示')) return;
        cats.splice(i, 1); save(); renderCatList(); renderAll();
      });
    });
  }

  function init() {
    var prev = document.getElementById('fin-prev-month');
    var next = document.getElementById('fin-next-month');
    if (prev) prev.addEventListener('click', function(){ viewOffset--; renderAll(); });
    if (next) next.addEventListener('click', function(){ viewOffset++; renderAll(); });

    var mc = document.getElementById('fin-manage-cats');
    if (mc) mc.addEventListener('click', function(){
      renderCatList();
      document.getElementById('fin-cat-modal').style.display = 'flex';
    });
    var addBtn = document.getElementById('fin-add-cat');
    if (addBtn) addBtn.addEventListener('click', function(){
      var name = document.getElementById('fin-new-cat-name').value.trim();
      var color = document.getElementById('fin-new-cat-color').value;
      if (!name) return;
      var key = 'c' + Date.now().toString(36);
      cats.push({ key: key, label: name, color: color });
      document.getElementById('fin-new-cat-name').value = '';
      save(); renderCatList(); renderAll();
    });

    renderAll();
  }

  function renderAll() {
    renderSummary();
    renderPie();
    renderForm();
    renderTrend();
    renderBudget();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>`;

lines.splice(start, end - start + 1, ...newJs.split('\n'));
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('JS replaced OK, new total lines:', lines.length);
