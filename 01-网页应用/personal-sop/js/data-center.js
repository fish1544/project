// ============================================================
// 数据中心 - 本地数据管理 + 可选云同步 + 自动备份
// ============================================================
(function() {
  // ====== 1. 本地数据管理 ======
  function getAllStorageKeys() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('sop-') === 0) keys.push(k);
    }
    return keys.sort();
  }

  function getStorageSize(key) {
    var val = localStorage.getItem(key);
    return val ? val.length : 0;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function getKeyLabel(key) {
    var labels = {
      'sop-sched-adjust': '课程调整',
      'sop-timeblocks': '空闲时间安排',
      'sop-time-track': '时间追踪',
      'sop-time-custom-cats': '自定义时间分类',
      'sop-finance-v3': '记账数据',
      'sop-habit-data': '习惯打卡',
      'sop-habit-list': '习惯列表',
      'sop-checks': '清单勾选状态',
      'sop-focus-data': '专注计时',
      'sop-exam-data': '考试倒计时',
      'sop-book-plan': '阅读清单',
      'sop-medical-records': '医疗检查记录',
      'sop-cr-work-v2': '学委工作数据',
      'sop-editable-morning': '晨间流程',
      'sop-editable-evening': '晚间流程',
      'sop-editable-exercise': '运动清单',
      'sop-editable-medical': '医疗清单',
      'sop-editable-habits': '习惯目标',
      'sop-habit-grid-data': '习惯网格数据',
      'sop-shopping-v1': '购物库'
    };
    return labels[key] || key.replace('sop-editable-', '').replace('sop-', '');
  }

  function renderDataCenter() {
    var el = document.getElementById('dc-storage-list');
    if (!el) return;
    var keys = getAllStorageKeys();
    var totalSize = 0;

    var html = '<div style="display:flex;flex-direction:column;gap:4px">';
    keys.forEach(function(k) {
      var size = getStorageSize(k);
      totalSize += size;
      var label = getKeyLabel(k);
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border:1px solid var(--rule);border-radius:var(--radius-sm)">';
      html += '<span style="font-size:0.78rem;color:var(--ink);flex:1">' + label + '</span>';
      html += '<span style="font-size:0.72rem;color:var(--muted)">' + formatSize(size) + '</span>';
      html += '<button onclick="window.__delData(\'' + k + '\')" style="padding:2px 8px;background:none;border:1px solid var(--rule);border-radius:4px;cursor:pointer;font-size:0.7rem;color:#f43f5e">删除</button>';
      html += '</div>';
    });
    html += '</div>';

    if (keys.length === 0) {
      html = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:0.84rem">暂无数据</div>';
    }

    html += '<div style="margin-top:10px;padding:10px;background:var(--accent-soft);border-radius:var(--radius-sm);display:flex;align-items:center;gap:8px">';
    html += '<span style="font-size:0.78rem;color:var(--accent)">总占用</span>';
    html += '<span style="font-size:0.84rem;font-weight:700;color:var(--accent)">' + formatSize(totalSize) + '</span>';
    html += '</div>';

    el.innerHTML = html;
  }

  window.__delData = function(key) {
    if (!confirm('删除「' + getKeyLabel(key) + '」的数据？此操作不可撤销。')) return;
    localStorage.removeItem(key);
    renderDataCenter();
    if (typeof refreshAll === 'function') refreshAll();
    location.reload();
  };

  // ====== 2. 一键备份/恢复 ======
  function exportAllData() {
    var allData = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('sop-') === 0) {
        allData[k] = localStorage.getItem(k);
      }
    }
    var blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var now = new Date();
    var ts = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    a.href = url;
    a.download = 'SOP-Backup-' + ts + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出备份文件');
  }

  function importAllData(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        var count = 0;
        for (var k in data) {
          if (k.indexOf('sop-') === 0) {
            localStorage.setItem(k, data[k]);
            count++;
          }
        }
        showToast('已导入 ' + count + ' 项数据，刷新中...');
        setTimeout(function() { location.reload(); }, 1200);
      } catch(err) {
        alert('导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
  }

  // ====== 3. 自动保存指示器 ======
  var saveIndicator = null;
  var saveTimer = null;

  function initSaveIndicator() {
    if (document.getElementById('save-indicator')) return;
    var div = document.createElement('div');
    div.id = 'save-indicator';
    div.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9999;padding:6px 14px;background:var(--accent2);color:#fff;border-radius:100px;font-size:0.74rem;font-weight:600;opacity:0;transition:opacity 0.3s;pointer-events:none';
    document.body.appendChild(div);
    saveIndicator = div;

    // Hook into localStorage.setItem
    var origSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, val) {
      origSet(key, val);
      if (key.indexOf('sop-') === 0) showSaveIndicator();
    };
  }

  function showSaveIndicator() {
    if (!saveIndicator) return;
    saveIndicator.textContent = '已保存';
    saveIndicator.style.opacity = '1';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function() {
      saveIndicator.style.opacity = '0';
    }, 1200);
  }

  // ====== 4. 云同步（Firebase 免费方案，可选）======
  var SYNC_CONFIG_KEY = 'sop-sync-config';
  var syncConfig = {};
  try { syncConfig = JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY) || '{}'); } catch(e) {}

  var syncDb = null;
  var syncReady = false;

  function renderSyncPanel() {
    var el = document.getElementById('dc-sync-panel');
    if (!el) return;

    var isLinked = syncConfig.projectId && syncConfig.apiKey;

    var html = '';
    if (!isLinked) {
      html += '<div style="padding:12px;background:var(--bg);border:1px solid var(--rule);border-radius:var(--radius-sm)">';
      html += '<p style="font-size:0.78rem;color:var(--muted);margin-bottom:8px">连接 Google Firebase 后，数据自动云端备份，多设备实时同步。免费额度足够个人使用。</p>';
      html += '<p style="font-size:0.76rem;color:var(--muted);margin-bottom:8px">设置步骤：</p>';
      html += '<ol style="font-size:0.76rem;color:var(--muted);margin-bottom:10px;padding-left:18px;line-height:1.8">';
      html += '<li>打开 <strong>console.firebase.google.com</strong>（用 Google 账号登录）</li>';
      html += '<li>点「创建项目」→ 命名如 <code>sop-sync</code></li>';
      html += '<li>左侧菜单选 <strong>Realtime Database</strong> → 创建 → 选「测试模式」</li>';
      html += '<li>项目设置 → 常规 → 复制 <strong>项目 ID</strong> 和 <strong>Web API 密钥</strong></li>';
      html += '<li>填入下方两个输入框 → 点连接</li>';
      html += '</ol>';
      html += '<div style="display:flex;flex-direction:column;gap:6px">';
      html += '<input id="sync-project-id" type="text" placeholder="项目 ID（如 sop-sync-12345）" style="padding:8px 10px;border:1px solid var(--rule);border-radius:6px;font-size:0.78rem;background:var(--bg2);outline:none">';
      html += '<input id="sync-api-key" type="password" placeholder="Web API 密钥" style="padding:8px 10px;border:1px solid var(--rule);border-radius:6px;font-size:0.78rem;background:var(--bg2);outline:none">';
      html += '</div>';
      html += '<button id="sync-connect-btn" style="margin-top:8px;width:100%;padding:8px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.82rem;font-weight:600">连接 Firebase</button>';
      html += '</div>';
    } else {
      html += '<div style="padding:12px;background:var(--accent2-soft,rgba(20,184,166,0.08));border:1px solid rgba(20,184,166,0.3);border-radius:var(--radius-sm)">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">';
      html += '<svg width="16" height="16" style="color:var(--accent2)"><use href="#i-cloud"/></svg>';
      html += '<span style="font-size:0.82rem;font-weight:600;color:var(--accent2)">已连接云同步</span>';
      html += '</div>';
      html += '<div style="font-size:0.72rem;color:var(--muted);margin-bottom:8px">项目：' + syncConfig.projectId + '</div>';
      html += '<div style="display:flex;gap:6px">';
      html += '<button id="sync-now-btn" style="flex:1;padding:6px;background:var(--accent2);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.76rem;font-weight:600">立即同步</button>';
      html += '<button id="sync-disconnect-btn" style="padding:6px 12px;background:none;border:1px solid var(--rule);border-radius:6px;cursor:pointer;font-size:0.76rem;color:var(--muted)">断开</button>';
      html += '</div>';
      html += '<div id="sync-status" style="margin-top:6px;font-size:0.72rem;color:var(--muted)"></div>';
      html += '</div>';
    }
    el.innerHTML = html;

    var connectBtn = document.getElementById('sync-connect-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', function() {
        var pid = document.getElementById('sync-project-id').value.trim();
        var key = document.getElementById('sync-api-key').value.trim();
        if (!pid || !key) { alert('请填写项目 ID 和 API 密钥'); return; }
        syncConfig.projectId = pid;
        syncConfig.apiKey = key;
        syncConfig.deviceId = 'dev-' + Date.now().toString(36);
        localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncConfig));
        showToast('正在连接...');
        setTimeout(function() { location.reload(); }, 800);
      });
    }

    var syncNowBtn = document.getElementById('sync-now-btn');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', function() { doSync(); });
    }

    var discBtn = document.getElementById('sync-disconnect-btn');
    if (discBtn) {
      discBtn.addEventListener('click', function() {
        if (!confirm('断开云同步？本地数据保留，但不再自动同步。')) return;
        localStorage.removeItem(SYNC_CONFIG_KEY);
        syncConfig = {};
        renderSyncPanel();
      });
    }
  }

  // Simple REST API sync (no SDK needed)
  function doSync() {
    var status = document.getElementById('sync-status');
    if (status) status.textContent = '正在上传...';
    if (!syncConfig.projectId || !syncConfig.apiKey) return;

    var url = 'https://' + syncConfig.projectId + '.firebaseio.com/sop-data/' + syncConfig.deviceId + '.json?auth=' + syncConfig.apiKey;

    var allData = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('sop-') === 0) {
        allData[k] = localStorage.getItem(k);
      }
    }
    allData._timestamp = Date.now();

    fetch(url, {
      method: 'PUT',
      body: JSON.stringify(allData)
    }).then(function(res) {
      if (!res.ok) throw new Error('Upload failed');
      // Now download other devices' data
      var readUrl = 'https://' + syncConfig.projectId + '.firebaseio.com/sop-data.json?auth=' + syncConfig.apiKey;
      return fetch(readUrl);
    }).then(function(res) { return res.json(); }).then(function(data) {
      var deviceCount = 0;
      var latestData = null;
      var latestTime = 0;
      for (var dev in data) {
        if (dev === syncConfig.deviceId) continue;
        deviceCount++;
        if (data[dev] && data[dev]._timestamp > latestTime) {
          latestTime = data[dev]._timestamp;
          latestData = data[dev];
        }
      }
      if (latestData) {
        for (var k in latestData) {
          if (k.indexOf('sop-') === 0) {
            localStorage.setItem(k, latestData[k]);
          }
        }
        if (status) status.textContent = '已同步（合并 ' + deviceCount + ' 个设备的数据）';
        showToast('云同步完成');
        setTimeout(function() { location.reload(); }, 1000);
      } else {
        if (status) status.textContent = '已上传，暂无其他设备数据';
        showToast('已上传到云端');
      }
    }).catch(function(err) {
      if (status) status.textContent = '同步失败：' + err.message;
    });
  }

  // Auto-sync on load if connected
  function autoSync() {
    if (syncConfig.projectId && syncConfig.apiKey) {
      doSync();
    }
  }

  // ====== 5. Toast 提示 ======
  function showToast(msg) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:8px 20px;background:var(--ink);color:#fff;border-radius:100px;font-size:0.78rem;z-index:9999;opacity:0;transition:opacity 0.3s';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.style.opacity = '1'; }, 10);
    setTimeout(function() { t.style.opacity = '0'; }, 2000);
    setTimeout(function() { t.remove(); }, 2500);
  }

  // ====== 6. 自动备份到本地（每7天）======
  var AUTO_BACKUP_KEY = 'sop-last-backup';
  function checkAutoBackup() {
    var last = parseInt(localStorage.getItem(AUTO_BACKUP_KEY) || '0');
    var now = Date.now();
    if (now - last > 7 * 24 * 60 * 60 * 1000) {
      exportAllData();
      localStorage.setItem(AUTO_BACKUP_KEY, String(now));
    }
  }

  // ====== 初始化 ======
  function init() {
    initSaveIndicator();
    renderDataCenter();
    renderSyncPanel();

    var exportBtn = document.getElementById('dc-export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportAllData);

    var importBtn = document.getElementById('dc-import-btn');
    var importInput = document.getElementById('dc-import-input');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', function() { importInput.click(); });
      importInput.addEventListener('change', function() {
        if (this.files[0]) importAllData(this.files[0]);
      });
    }

    var clearBtn = document.getElementById('dc-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        if (!confirm('清空所有数据？建议先导出备份！')) return;
        var keys = getAllStorageKeys();
        keys.forEach(function(k) { localStorage.removeItem(k); });
        showToast('已清空');
        setTimeout(function() { location.reload(); }, 800);
      });
    }

    // Auto-sync on load (delay 2s to not block page)
    setTimeout(autoSync, 2000);
    // Auto-backup check (delay 5s)
    setTimeout(checkAutoBackup, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
