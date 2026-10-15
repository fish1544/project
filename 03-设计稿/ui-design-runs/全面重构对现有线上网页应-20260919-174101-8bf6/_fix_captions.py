# -*- coding: utf-8 -*-
"""canvas-b 关键屏 6 条 figcaption 换成产品文案（按生成顺序 p01..p06）。"""
import io, re

BASE = r"D:\Project\ui-design-runs\全面重构对现有线上网页应-20260919-174101-8bf6"
path = BASE + r"\doc\canvas-b.html"
with io.open(path, encoding="utf-8") as f:
    h = f.read()

caps = [
    ("一天从这里开始", "问候、今日记录概览与「我的说明书」入口，首屏就答今天该做什么。"),
    ("你的说明书，随时翻开", "精力节律、压力阈值、习惯建议以档案清单呈现，每一条都可执行。"),
    ("说出来，就记下了", "按住说话即可记录，自动识别时间、事件与情绪，不需要打字。"),
    ("像发微信一样自然", "录音波形实时反馈，结束后自动结构化入库，记录零门槛。"),
    ("任务时长自动沉淀", "一键开始与结束，支持标签分类与事后补录，九十分钟单元一目了然。"),
    ("每一天都有一份复盘", "成就、压力来源与行为触发点，AI 提炼成五维摘要，不空谈自律。"),
]

pat = re.compile(r"<figcaption[^>]*>(.*?)</figcaption>", re.S)
idx = [0]

def repl(m):
    i = idx[0]
    idx[0] += 1
    if i >= len(caps):
        return m.group(0)
    b, t = caps[i]
    return '<figcaption class="device-cap"><b>%s</b>%s</figcaption>' % (b, t)

h2, n = pat.subn(repl, h)
assert n == 6, "figcaption 数量异常: %d" % n
assert "这一屏叫什么" not in h2 and "他在这里想干什么" not in h2
with io.open(path, "w", encoding="utf-8") as f:
    f.write(h2)
print("captions replaced:", n, "size", len(h2))
