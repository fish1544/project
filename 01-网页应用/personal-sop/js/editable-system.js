// ============================================================
// 通用可编辑清单系统
// 自动将所有 data-group 清单变为可增删改查
// ============================================================
(function() {
  var STORAGE_PREFIX = 'sop-editable-';

  function saveGroup(groupName, items) {
    localStorage.setItem(STORAGE_PREFIX + groupName, JSON.stringify(items));
  }

  function loadGroup(groupName) {
    try {
      var data = localStorage.getItem(STORAGE_PREFIX + groupName);
      return data ? JSON.parse(data) : null;
    } catch(e) { return null; }
  }

  function getCheckState(groupName, text) {
    var checkData = {};
    try { checkData = JSON.parse(localStorage.getItem('sop-checks') || '{}'); } catch(e) {}
    var groupChecks = checkData[groupName] || [];
    return groupChecks.indexOf(text) !== -1;
  }

  function setCheckState(groupName, text, checked) {
    var checkData = {};
    try { checkData = JSON.parse(localStorage.getItem('sop-checks') || '{}'); } catch(e) {}
    if (!checkData[groupName]) checkData[groupName] = [];
    var idx = checkData[groupName].indexOf(text);
    if (checked && idx === -1) checkData[groupName].push(text);
    if (!checked && idx !== -1) checkData[groupName].splice(idx, 1);
    localStorage.setItem('sop-checks', JSON.stringify(checkData));
  }

  // Extract items from existing checklist HTML
  function extractItems(container) {
    var items = [];
    container.querySelectorAll('li').forEach(function(li) {
      var textEl = li.querySelector('.check-text');
      var tagEl = li.querySelector('.check-tag');
      var text = textEl ? textEl.textContent.trim() : li.textContent.trim();
      var tag = tagEl ? tagEl.textContent.trim() : '';
      var isChecked = li.querySelector('.check-box.checked') !== null;
      items.push({ text: text, tag: tag, checked: isChecked });
    });
    return items;
  }

  // Render editable list
  function renderList(container, groupName, items) {
    var html = '';
    items.forEach(function(item, idx) {
      html += '<li class="editable-item" data-idx="' + idx + '">';
      html += '<div class="check-box' + (item.checked ? ' checked' : '') + '"></div>';
      html += '<span class="check-text" contenteditable="true" data-placeholder="输入内容...">' + escapeHtml(item.text) + '</span>';
      if (item.tag) {
        html += '<span class="check-tag ' + item.tag + '">' + item.tag + '</span>';
      }
      html += '<button class="item-del-btn" title="删除">✕</button>';
      html += '</li>';
    });

    // Add new item input
    html += '<li class="editable-add-row">';
    html += '<button class="item-add-btn">+ 添加</button>';
    html += '</li>';

    container.innerHTML = html;

    // Attach handlers
    attachHandlers(container, groupName, items);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function attachHandlers(container, groupName, items) {
    // Checkbox toggle
    container.querySelectorAll('.check-box').forEach(function(box, idx) {
      box.addEventListener('click', function() {
        items[idx].checked = !items[idx].checked;
        box.classList.toggle('checked');
        saveGroup(groupName, items);
      });
    });

    // Text edit (save on blur)
    container.querySelectorAll('.check-text').forEach(function(textEl, idx) {
      textEl.addEventListener('blur', function() {
        items[idx].text = this.textContent.trim();
        saveGroup(groupName, items);
      });
      textEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
      });
    });

    // Delete button
    container.querySelectorAll('.item-del-btn').forEach(function(btn, idx) {
      btn.addEventListener('click', function() {
        items.splice(idx, 1);
        saveGroup(groupName, items);
        renderList(container, groupName, items);
      });
    });

    // Add button
    var addBtn = container.querySelector('.item-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        items.push({ text: '新条目（点击编辑）', tag: '', checked: false });
        saveGroup(groupName, items);
        renderList(container, groupName, items);
        // Focus the last item's text
        var lastText = container.querySelector('.editable-item:last-child .check-text');
        if (lastText) {
          lastText.focus();
          var range = document.createRange();
          range.selectNodeContents(lastText);
          range.collapse(false);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }
  }

  // Initialize all checklists
  function initAll() {
    var checklists = document.querySelectorAll('.checklist[data-group]');
    checklists.forEach(function(cl) {
      try {
        var groupName = cl.getAttribute('data-group');

        // Check if user has saved data
        var saved = loadGroup(groupName);
        if (saved && Array.isArray(saved)) {
          // Use saved data
          renderList(cl, groupName, saved);
        } else {
          // First time: extract from static HTML, make editable
          var items = extractItems(cl);
          saveGroup(groupName, items);
          renderList(cl, groupName, items);
        }
      } catch(e) {
        // If one checklist fails, reset it from DOM and continue
        try {
          var items2 = extractItems(cl);
          var gn = cl.getAttribute('data-group');
          saveGroup(gn, items2);
          renderList(cl, gn, items2);
        } catch(e2) {}
      }
    });
  }

  // ============================================================
  // Editable Table System (for habit targets, budget, etc.)
  // ============================================================
  window.EditableTable = function(containerId, columns, defaultRows, storageKey) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var saved = loadGroup(storageKey);
    var data = (saved && Array.isArray(saved)) ? saved : defaultRows;
    if (!saved || !Array.isArray(saved)) saveGroup(storageKey, data);

    function render() {
      var html = '<div class="table-wrap"><table>';
      html += '<thead><tr>';
      columns.forEach(function(col) {
        html += '<th>' + col.label + '</th>';
      });
      html += '<th style="width:40px">操作</th>';
      html += '</tr></thead><tbody>';

      if (data.length === 0) {
        html += '<tr class="et-empty-row">';
        html += '<td colspan="' + (columns.length + 1) + '" style="text-align:center;padding:20px;color:var(--muted);font-size:0.8rem">暂无数据，点击下方"添加行"开始</td>';
        html += '</tr>';
      } else {
        data.forEach(function(row, idx) {
          html += '<tr data-idx="' + idx + '">';
          columns.forEach(function(col) {
            var val = row[col.key] || '';
            html += '<td><span class="et-cell" contenteditable="true" data-key="' + col.key + '" data-idx="' + idx + '">' + escapeHtml(val) + '</span></td>';
          });
          html += '<td><button class="et-del" data-idx="' + idx + '" style="color:#f43f5e;background:none;border:none;cursor:pointer;font-size:0.78rem">✕</button></td>';
          html += '</tr>';
        });
      }

      html += '</tbody></table></div>';
      html += '<button class="et-add" style="margin-top:10px;padding:8px 20px;background:var(--accent-soft);border:1px dashed var(--accent);border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;color:var(--accent);font-weight:600;width:100%">+ 添加行</button>';

      container.innerHTML = html;

      // Cell edit
      container.querySelectorAll('.et-cell').forEach(function(cell) {
        cell.addEventListener('blur', function() {
          var idx = parseInt(this.getAttribute('data-idx'));
          var key = this.getAttribute('data-key');
          data[idx][key] = this.textContent.trim();
          saveGroup(storageKey, data);
        });
        cell.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
        });
      });

      // Delete row
      container.querySelectorAll('.et-del').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(this.getAttribute('data-idx'));
          data.splice(idx, 1);
          saveGroup(storageKey, data);
          render();
        });
      });

      // Add row
      var addBtn = container.querySelector('.et-add');
      if (addBtn) {
        addBtn.addEventListener('click', function() {
          var newRow = {};
          columns.forEach(function(col) { newRow[col.key] = ''; });
          data.push(newRow);
          saveGroup(storageKey, data);
          render();
          // Focus last row first cell
          var lastCell = container.querySelector('tbody tr:last-child .et-cell');
          if (lastCell) lastCell.focus();
        });
      }
    }

    render();
    return { refresh: render, getData: function() { return data; } };
  };

  // ============================================================
  // Editable Text Block (for hero tag, callouts, etc.)
  // ============================================================
  window.EditableText = function(elementId, storageKey, placeholder) {
    var el = document.getElementById(elementId);
    if (!el) return;

    var saved = localStorage.getItem(STORAGE_PREFIX + 'text-' + storageKey);
    if (saved) el.textContent = saved;

    el.setAttribute('contenteditable', 'true');
    el.style.outline = 'none';
    el.style.cursor = 'text';
    el.style.borderBottom = '1px dashed var(--rule)';
    if (placeholder && !el.textContent.trim()) el.textContent = placeholder;

    el.addEventListener('blur', function() {
      localStorage.setItem(STORAGE_PREFIX + 'text-' + storageKey, el.textContent.trim());
      el.style.borderBottom = '1px dashed transparent';
    });
    el.addEventListener('focus', function() {
      el.style.borderBottom = '1px dashed var(--accent)';
    });
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    });
  };

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
