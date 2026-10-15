// ============================================================
// 学委工作渲染引擎
// ============================================================
(function() {
  if (typeof crData === 'undefined') return;

  var STORAGE_KEY = 'sop-cr-data';
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) {}
  if (saved.teachers) crData.teachers = saved.teachers;
  if (saved.logStatus) crData.logStatus = saved.logStatus;
  if (saved.assignments) crData.assignments = saved.assignments;
  if (saved.notices) crData.notices = saved.notices;
  if (saved.courseReqs) crData.courseReqs = saved.courseReqs;

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      teachers: crData.teachers,
      logStatus: crData.logStatus,
      assignments: crData.assignments,
      notices: crData.notices,
      courseReqs: crData.courseReqs
    }));
  }

  function getWeekNum() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    var yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  var currentWeek = getWeekNum();

  // ===== Render Teacher Sign Grid =====
  function renderTeachers() {
    var container = document.getElementById('teacher-sign-grid');
    if (!container) return;

    var html = '<div class="table-wrap"><table>';
    html += '<thead><tr><th>教师</th><th>课程</th><th>签字方式</th><th>备注</th><th>操作</th></tr></thead><tbody>';

    crData.teachers.forEach(function(t, idx) {
      var signLabel, signClass;
      if (t.signType === 'proxy') {
        signLabel = '学委代签';
        signClass = 'pill green';
      } else if (t.signType === 'self') {
        signLabel = '老师亲自签';
        signClass = 'pill amber';
      } else {
        signLabel = '待确认';
        signClass = 'pill rose';
      }

      html += '<tr id="teacher-row-' + idx + '">';
      html += '<td><strong>' + t.name + '</strong></td>';
      html += '<td>' + t.course + '</td>';
      html += '<td><span class="' + signClass + '" id="sign-badge-' + idx + '">' + signLabel + '</span></td>';
      html += '<td style="font-size:0.82rem;color:var(--muted)">' + (t.note || '') + '</td>';
      html += '<td><button onclick="window._toggleSign(' + idx + ')" style="padding:4px 10px;border:1px solid var(--rule);border-radius:6px;background:var(--bg);cursor:pointer;font-size:0.76rem">切换</button>';
      html += ' <button onclick="window._delTeacher(' + idx + ')" style="padding:4px 10px;border:1px solid rgba(244,63,94,0.3);border-radius:6px;background:rgba(244,63,94,0.06);cursor:pointer;font-size:0.76rem;color:#f43f5e">删</button></td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Summary
    var proxyCount = crData.teachers.filter(function(t) { return t.signType === 'proxy'; }).length;
    var selfCount = crData.teachers.filter(function(t) { return t.signType === 'self'; }).length;
    html += '<div style="display:flex;gap:12px;margin-top:12px">';
    html += '<span class="pill green">代签：' + proxyCount + ' 位老师</span>';
    html += '<span class="pill amber">亲自签：' + selfCount + ' 位老师</span>';
    html += '<span class="pill purple">共 ' + crData.teachers.length + ' 位</span>';
    html += '</div>';

    container.innerHTML = html;
  }

  window._toggleSign = function(idx) {
    var t = crData.teachers[idx];
    if (t.signType === 'proxy') t.signType = 'self';
    else if (t.signType === 'self') t.signType = 'unknown';
    else t.signType = 'proxy';
    save();
    renderTeachers();
  };

  window._delTeacher = function(idx) {
    if (confirm('确定删除 ' + crData.teachers[idx].name + ' 的记录？')) {
      crData.teachers.splice(idx, 1);
      save();
      renderTeachers();
    }
  };

  // Add teacher button
  var addTeacherBtn = document.getElementById('cr-add-teacher');
  if (addTeacherBtn) {
    addTeacherBtn.addEventListener('click', function() {
      var name = prompt('教师姓名：');
      if (!name) return;
      var course = prompt('课程名称：') || '';
      var signType = prompt('签字方式（输入：proxy=代签 / self=亲自签 / unknown=待确认）：', 'proxy') || 'proxy';
      var note = prompt('备注（可选）：') || '';
      crData.teachers.push({ name: name, course: course, signType: signType, note: note });
      save();
      renderTeachers();
    });
  }

  // ===== Render Log Status Grid =====
  function renderLogStatus() {
    var container = document.getElementById('log-status-grid');
    if (!container) return;
    if (typeof schedData === 'undefined') {
      container.innerHTML = '<p style="color:var(--muted);font-size:0.84rem">课表数据未加载，无法生成日志清单。</p>';
      return;
    }

    var weekKey = 'W' + currentWeek;
    if (!crData.logStatus[weekKey]) {
      crData.logStatus[weekKey] = {};
    }

    // Collect unique courses this week
    var courses = {};
    var days = schedData.days;
    var slots = schedData.timeSlots;
    days.forEach(function(day) {
      slots.forEach(function(slot) {
        var cls = schedData.grid[day.id] && schedData.grid[day.id][slot.id];
        if (cls) {
          if (!courses[cls.subject]) {
            var tInfo = schedData.subjects[cls.subject] || {};
            courses[cls.subject] = { subject: cls.subject, teacher: tInfo.teacher || '', slots: [] };
          }
          courses[cls.subject].slots.push(day.label + ' ' + slot.label);
        }
      });
    });

    var statusLabels = ['待填', '已填', '已签', '已交'];
    var statusColors = ['pill rose', 'pill amber', 'pill blue', 'pill green'];

    var html = '<div style="margin-bottom:8px;font-size:0.82rem;color:var(--muted)">第 ' + currentWeek + ' 周 · ' + Object.keys(courses).length + ' 门课程需要填写</div>';
    html += '<div class="table-wrap"><table>';
    html += '<thead><tr><th>课程</th><th>教师</th><th>上课时间</th><th>签字方式</th><th>日志状态</th></tr></thead><tbody>';

    Object.keys(courses).forEach(function(key) {
      var c = courses[key];
      var logKey = c.subject;
      var status = crData.logStatus[weekKey][logKey] || 0;

      // Find teacher sign type
      var teacherInfo = crData.teachers.find(function(t) {
        return t.course.indexOf(c.subject) !== -1 || c.subject.indexOf(t.course) !== -1 || t.course === c.subject;
      });
      var signInfo = '—';
      if (teacherInfo) {
        if (teacherInfo.signType === 'proxy') signInfo = '<span class="pill green">代签</span>';
        else if (teacherInfo.signType === 'self') signInfo = '<span class="pill amber">亲自签</span>';
        else signInfo = '<span class="pill rose">待确认</span>';
      }

      html += '<tr>';
      html += '<td><strong>' + c.subject + '</strong></td>';
      html += '<td>' + (c.teacher || '') + '</td>';
      html += '<td style="font-size:0.78rem">' + c.slots.join('、') + '</td>';
      html += '<td>' + signInfo + '</td>';
      html += '<td><span class="' + statusColors[status] + '" style="cursor:pointer" onclick="window._cycleLog(\'' + weekKey + '\',\'' + logKey + '\')">' + statusLabels[status] + ' ↻</span></td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Summary progress
    var total = Object.keys(courses).length;
    var done = Object.keys(courses).filter(function(k) {
      return (crData.logStatus[weekKey][k] || 0) >= 3;
    }).length;
    var pct = total > 0 ? Math.round(done / total * 100) : 0;

    html += '<div class="progress-wrap" style="margin-top:12px">';
    html += '<div class="progress-label"><span>本周日志完成进度</span><span class="pct">' + done + '/' + total + ' (' + pct + '%)</span></div>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
    html += '</div>';

    container.innerHTML = html;
  }

  window._cycleLog = function(weekKey, logKey) {
    if (!crData.logStatus[weekKey]) crData.logStatus[weekKey] = {};
    var s = (crData.logStatus[weekKey][logKey] || 0);
    s = (s + 1) % 4;
    crData.logStatus[weekKey][logKey] = s;
    save();
    renderLogStatus();
  };

  // ===== Render Assignments =====
  function renderAssignments() {
    var container = document.getElementById('assign-grid');
    if (!container) return;

    if (crData.assignments.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:0.84rem">暂无作业记录。点击「+ 添加作业」开始记录。</div>';
      return;
    }

    var html = '';
    crData.assignments.forEach(function(a, idx) {
      var total = crData.classInfo.studentCount;
      var collected = a.collected || 0;
      var pct = Math.round(collected / total * 100);
      var isOverdue = new Date(a.deadline) < new Date() && collected < total;
      var isDone = a.status === 'submitted';

      var statusLabel, statusClass;
      if (isDone) { statusLabel = '已提交老师'; statusClass = 'pill green'; }
      else if (isOverdue) { statusLabel = '已逾期'; statusClass = 'pill rose'; }
      else if (pct === 100) { statusLabel = '已收齐'; statusClass = 'pill green'; }
      else { statusLabel = '收交中'; statusClass = 'pill amber'; }

      html += '<div style="padding:16px;background:var(--bg2);border:1px solid var(--rule);border-radius:var(--radius);margin-bottom:12px' + (isDone ? ';opacity:0.6' : '') + '">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">';
      html += '<strong style="font-size:0.9rem">' + a.course + '</strong>';
      html += '<span class="' + statusClass + '">' + statusLabel + '</span>';
      html += '<span style="font-size:0.76rem;color:var(--muted)">截止：' + a.deadline + '</span>';
      html += '<span style="margin-left:auto;display:flex;gap:4px">';
      html += '<button onclick="window._adjAssign(' + idx + ',1)" style="padding:2px 8px;border:1px solid var(--rule);border-radius:6px;background:var(--bg);cursor:pointer;font-size:0.72rem">+1</button>';
      html += '<button onclick="window._adjAssign(' + idx + ',-1)" style="padding:2px 8px;border:1px solid var(--rule);border-radius:6px;background:var(--bg);cursor:pointer;font-size:0.72rem">-1</button>';
      html += '<button onclick="window._toggleAssignDone(' + idx + ')" style="padding:2px 8px;border:1px solid var(--rule);border-radius:6px;background:var(--bg);cursor:pointer;font-size:0.72rem">' + (isDone ? '撤销' : '完成') + '</button>';
      html += '<button onclick="window._delAssign(' + idx + ')" style="padding:2px 8px;border:1px solid rgba(244,63,94,0.3);border-radius:6px;background:rgba(244,63,94,0.06);cursor:pointer;font-size:0.72rem;color:#f43f5e">删</button>';
      html += '</span></div>';

      html += '<p style="font-size:0.82rem;color:var(--ink);margin-bottom:8px">' + a.content + '</p>';

      if (a.submitMethod) {
        html += '<p style="font-size:0.76rem;color:var(--muted);margin-bottom:8px">提交方式：' + a.submitMethod + '</p>';
      }

      // Progress bar
      html += '<div class="progress-wrap">';
      html += '<div class="progress-label"><span>收交进度</span><span class="pct">' + collected + '/' + total + ' (' + pct + '%)</span></div>';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      html += '</div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  window._adjAssign = function(idx, delta) {
    var a = crData.assignments[idx];
    a.collected = Math.max(0, Math.min(crData.classInfo.studentCount, (a.collected || 0) + delta));
    save();
    renderAssignments();
  };

  window._toggleAssignDone = function(idx) {
    var a = crData.assignments[idx];
    if (a.status === 'submitted') {
      a.status = 'collecting';
    } else {
      a.status = 'submitted';
      a.collected = crData.classInfo.studentCount;
    }
    save();
    renderAssignments();
  };

  window._delAssign = function(idx) {
    if (confirm('确定删除这条作业记录？')) {
      crData.assignments.splice(idx, 1);
      save();
      renderAssignments();
    }
  };

  var addAssignBtn = document.getElementById('cr-add-assign');
  if (addAssignBtn) {
    addAssignBtn.addEventListener('click', function() {
      var course = prompt('课程名称（如：数据结构）：');
      if (!course) return;
      var content = prompt('作业内容：');
      if (!content) return;
      var deadline = prompt('截止时间（如：2026-09-15）：');
      var submitMethod = prompt('提交方式（如：群内接龙/私发学委/系统提交）：') || '';
      crData.assignments.unshift({
        course: course,
        content: content,
        deadline: deadline || '',
        submitMethod: submitMethod,
        collected: 0,
        status: 'collecting',
        created: new Date().toISOString()
      });
      save();
      renderAssignments();
    });
  }

  // ===== Render Notices =====
  function renderNotices() {
    var container = document.getElementById('notice-grid');
    if (!container) return;

    if (crData.notices.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted);font-size:0.84rem">暂无通知记录。点击「+ 记录通知」开始记录。</div>';
      return;
    }

    var statusLabels = ['待转发', '已转发', '已确认'];
    var statusColors = ['pill rose', 'pill amber', 'pill green'];

    var html = '<div class="table-wrap"><table>';
    html += '<thead><tr><th>时间</th><th>来源</th><th>内容</th><th>类型</th><th>截止</th><th>状态</th><th>操作</th></tr></thead><tbody>';

    crData.notices.forEach(function(n, idx) {
      var status = n.status || 0;
      html += '<tr>';
      html += '<td style="font-size:0.76rem;white-space:nowrap">' + (n.time || '') + '</td>';
      html += '<td style="font-size:0.8rem">' + (n.source || '') + '</td>';
      html += '<td style="font-size:0.8rem;max-width:200px">' + (n.content || '') + '</td>';
      html += '<td style="font-size:0.76rem">' + (n.type || '') + '</td>';
      html += '<td style="font-size:0.76rem">' + (n.deadline || '—') + '</td>';
      html += '<td><span class="' + statusColors[status] + '" style="cursor:pointer" onclick="window._cycleNotice(' + idx + ')">' + statusLabels[status] + ' ↻</span></td>';
      html += '<td><button onclick="window._delNotice(' + idx + ')" style="padding:2px 8px;border:1px solid rgba(244,63,94,0.3);border-radius:6px;background:rgba(244,63,94,0.06);cursor:pointer;font-size:0.72rem;color:#f43f5e">删</button></td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Summary
    var pending = crData.notices.filter(function(n) { return (n.status || 0) === 0; }).length;
    var forwarded = crData.notices.filter(function(n) { return (n.status || 0) === 1; }).length;
    var confirmed = crData.notices.filter(function(n) { return (n.status || 0) === 2; }).length;
    html += '<div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap">';
    html += '<span class="pill rose">待转发：' + pending + '</span>';
    html += '<span class="pill amber">已转发：' + forwarded + '</span>';
    html += '<span class="pill green">已确认：' + confirmed + '</span>';
    html += '</div>';

    container.innerHTML = html;
  }

  window._cycleNotice = function(idx) {
    var n = crData.notices[idx];
    n.status = ((n.status || 0) + 1) % 3;
    save();
    renderNotices();
  };

  window._delNotice = function(idx) {
    if (confirm('确定删除这条通知记录？')) {
      crData.notices.splice(idx, 1);
      save();
      renderNotices();
    }
  };

  var addNoticeBtn = document.getElementById('cr-add-notice');
  if (addNoticeBtn) {
    addNoticeBtn.addEventListener('click', function() {
      var source = prompt('通知来源（如：教务处/辅导员/某老师）：');
      if (!source) return;
      var content = prompt('通知内容摘要：');
      if (!content) return;
      var type = prompt('类型（作业/调课/考试/材料/会议/其他）：') || '其他';
      var deadline = prompt('截止时间（可选，如：2026-09-10）：') || '';
      var now = new Date();
      var timeStr = now.getMonth() + 1 + '/' + now.getDate() + ' ' + now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
      crData.notices.unshift({
        time: timeStr,
        source: source,
        content: content,
        type: type,
        deadline: deadline,
        status: 0
      });
      save();
      renderNotices();
    });
  }

  // ===== Render Course Requirements =====
  function renderCourseReqs() {
    var container = document.getElementById('course-req-grid');
    if (!container) return;

    var html = '<div class="table-wrap"><table>';
    html += '<thead><tr><th>课程</th><th>教师</th><th>考核方式</th><th>成绩构成</th><th>备注</th></tr></thead><tbody>';

    crData.courseReqs.forEach(function(r) {
      html += '<tr>';
      html += '<td><strong>' + r.course + '</strong></td>';
      html += '<td>' + r.teacher + '</td>';
      html += '<td><span class="pill purple">' + r.exam + '</span></td>';
      html += '<td style="font-size:0.82rem">' + r.ratio + '</td>';
      html += '<td style="font-size:0.76rem;color:var(--muted)">' + (r.note || '') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    html += '<div class="callout teal"><strong>提示：</strong>开学第一周向每位老师确认考核方式后更新此表。期末复习时按考核方式分配精力：考试类重刷题，项目类重打磨作品。</div>';

    container.innerHTML = html;
  }

  // ===== Initial render =====
  renderTeachers();
  renderLogStatus();
  renderAssignments();
  renderNotices();
  renderCourseReqs();
})();
