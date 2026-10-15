// ============================================================
// 课表数据 - 计科技术(产)242班 2026-2027-1
// 调课/补课时修改此文件即可，页面会自动重新渲染
// ============================================================

var schedData = {
  meta: {
    className: '计科技术(产)242班',
    semester: '2026-2027-1',
    studentCount: 48,
    semesterStart: '2026-09-01',  // 学期第一周周一的日期
    totalWeeks: 16                // 学期总周数
  },

  // 时间节次定义 - 如教务调整时间，改这里
  timeSlots: [
    { id: 1, label: '第一大节', time: '08:00-09:30' },
    { id: 2, label: '第二大节', time: '09:40-12:00' },
    { id: 3, label: '第三大节', time: '14:30-16:00' },
    { id: 4, label: '第四大节', time: '16:10-17:40' },
    { id: 5, label: '第五大节', time: '19:20-21:40' }
  ],

  // 星期定义
  days: [
    { id: 'mon', label: '周一' },
    { id: 'tue', label: '周二' },
    { id: 'wed', label: '周三' },
    { id: 'thu', label: '周四' },
    { id: 'fri', label: '周五' },
    { id: 'sat', label: '周六' },
    { id: 'sun', label: '周日' }
  ],

  // 课程定义 - color 用于课表着色
  subjects: {
    '微服务项目实践':       { color: 'purple', teacher: '卢文华' },
    '微服务技术(springcloud)': { color: 'purple', teacher: '张如利' },
    'springboot项目实践':   { color: 'teal',   teacher: '王鉴' },
    'spark大数据处理':      { color: 'amber',  teacher: '黄榜益' },
    '数据结构':             { color: 'rose',   teacher: '赵俊涛' },
    '数据结构实验':          { color: 'rose',   teacher: '赵俊涛' },
    'WEB前端主流框架(VUE)':  { color: 'blue',   teacher: '杨辉龙' },
    '鸿蒙应用开发':          { color: 'green',  teacher: '叶家发' },
    '数据分析与挖掘项目':     { color: 'blue',  teacher: '叶家发' },
    '形势与政策':            { color: 'gray',   teacher: '零耀受' },
    '思想政治综合实践':       { color: 'gray',   teacher: '余芳' }
  },

  // 课表主体 - [day][slotId] = { subject, location, weeks }
  // weeks: '1-16' 表示第1到16周; '15' 表示仅第15周; '13-15' 表示13到15周
  // 空闲时段不填，系统会自动识别并标注建议
  grid: {
    mon: {
      1: { subject: '微服务项目实践', location: '崇智楼203', weeks: '1-16' },
      5: { subject: 'WEB前端主流框架(VUE)', location: '崇智楼207', weeks: '1-11' }
    },
    tue: {
      2: { subject: '数据结构', location: '崇智楼502', weeks: '1-13' },
      3: { subject: '微服务技术(springcloud)', location: '崇智楼203', weeks: '1-16' },
      4: { subject: 'springboot项目实践', location: '崇智楼207', weeks: '1-16' },
      5: { subject: 'spark大数据处理', location: '崇智楼205', weeks: '1-13' }
    },
    wed: {
      1: { subject: '微服务技术(springcloud)', location: '崇智楼203', weeks: '1-16' },
      3: { subject: 'springboot项目实践', location: '崇智楼207', weeks: '1-16' },
      4: { subject: 'spark大数据处理', location: '崇智楼205', weeks: '1-13' },
      5: { subject: 'WEB前端主流框架(VUE)', location: '崇智楼207', weeks: '1-11' }
    },
    thu: {
      1: { subject: '鸿蒙应用开发', location: '崇智楼203', weeks: '1-16' },
      3: { subject: '微服务项目实践', location: '崇智楼508', weeks: '1-16' },
      4: { subject: '数据结构', location: '崇智楼502', weeks: '1-13' },
      5: { subject: '数据分析与挖掘项目', location: '崇智楼501', weeks: '1-13' }
    },
    fri: {
      3: { subject: '形势与政策', location: '亲民楼D404', weeks: '13-15' },
      4: { subject: '形势与政策', location: '亲民楼D404', weeks: '13-15' },
      5: { subject: '鸿蒙应用开发', location: '崇智楼203', weeks: '1-16' }
    },
    sat: {
      1: { subject: '数据结构实验', location: '崇智楼502', weeks: '15' },
      3: { subject: '思想政治综合实践', location: '暂无教室', weeks: '1-14' },
      4: { subject: '思想政治综合实践', location: '暂无教室', weeks: '1-14' }
    },
    sun: {
      5: { subject: '数据分析与挖掘项目', location: '崇智楼203', weeks: '1-13' }
    }
  }
};
