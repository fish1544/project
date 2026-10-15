// ============================================================
// 学委工作数据 - 计科技术(产)242班
// 修改此文件可更新教师签字方式、课程要求等
// ============================================================

var crData = {
  classInfo: {
    name: '计科技术(产)242班',
    studentCount: 48,
    semester: '2026-2027-1'
  },

  // 教师签字方式追踪
  // signType: 'proxy' = 学委代签 | 'self' = 老师亲自签 | 'unknown' = 待确认
  teachers: [
    { name: '卢文华', course: '微服务项目实践', signType: 'proxy', note: '授权代签' },
    { name: '张如利', course: '微服务技术(springcloud)', signType: 'proxy', note: '授权代签' },
    { name: '王鉴', course: 'springboot项目实践', signType: 'proxy', note: '授权代签' },
    { name: '赵俊涛', course: '数据结构 / 数据结构实验', signType: 'self', note: '课后亲自签' },
    { name: '杨辉龙', course: 'WEB前端主流框架(VUE)', signType: 'proxy', note: '授权代签' },
    { name: '叶家发', course: '鸿蒙应用开发 / 数据分析与挖掘项目', signType: 'self', note: '课后亲自签' },
    { name: '黄榜益', course: 'spark大数据处理', signType: 'proxy', note: '授权代签' },
    { name: '零耀受', course: '形势与政策', signType: 'proxy', note: '授权代签' },
    { name: '余芳', course: '思想政治综合实践', signType: 'proxy', note: '授权代签' }
  ],

  // 课程考核要求（开学初向老师确认后填写）
  courseReqs: [
    { course: '微服务项目实践', teacher: '卢文华', exam: '项目答辩', ratio: '项目60% + 平时40%', note: '' },
    { course: '微服务技术(springcloud)', teacher: '张如利', exam: '期末考试', ratio: '考试50% + 实验30% + 平时20%', note: '' },
    { course: 'springboot项目实践', teacher: '王鉴', exam: '项目答辩', ratio: '项目70% + 平时30%', note: '' },
    { course: '数据结构', teacher: '赵俊涛', exam: '期末考试', ratio: '考试60% + 实验20% + 平时20%', note: '1-13周' },
    { course: 'WEB前端主流框架(VUE)', teacher: '杨辉龙', exam: '项目作业', ratio: '项目80% + 平时20%', note: '1-11周' },
    { course: '鸿蒙应用开发', teacher: '叶家发', exam: '项目作业', ratio: '项目70% + 平时30%', note: '' },
    { course: 'spark大数据处理', teacher: '黄榜益', exam: '期末考试', ratio: '考试50% + 实验30% + 平时20%', note: '1-13周' },
    { course: '数据分析与挖掘项目', teacher: '叶家发', exam: '项目答辩', ratio: '项目80% + 平时20%', note: '1-13周' },
    { course: '形势与政策', teacher: '零耀受', exam: '论文', ratio: '论文100%', note: '13-15周' },
    { course: '思想政治综合实践', teacher: '余芳', exam: '实践报告', ratio: '报告100%', note: '1-14周' }
  ],

  // 教学日志状态（根据课表自动生成，按周管理）
  // status: 0=待填 | 1=已填 | 2=已签 | 3=已交
  logStatus: {},

  // 作业列表
  assignments: [],

  // 通知台账
  notices: []
};
