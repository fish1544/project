class_name BuffPool
extends RefCounted
## 升级三选一的 Buff 池：id / 名称 / 描述 / 对玩家属性的作用在 player.apply_upgrade() 中实现。

const TIER_COLORS := {
	"common": Color(0.66, 0.7, 0.82),
	"rare": Color(0.36, 0.68, 1.0),
	"epic": Color(0.86, 0.46, 1.0),
}
const TIER_NAMES := {
	"common": "普通",
	"rare": "稀有",
	"epic": "史诗",
}

const ALL: Array[Dictionary] = [
	{"id": "rapid_fire", "name": "迅捷射击", "desc": "攻击速度 +20%", "tier": "rare"},
	{"id": "power_shot", "name": "强力弹丸", "desc": "子弹伤害 +25%", "tier": "rare"},
	{"id": "swift_step", "name": "疾风步", "desc": "移动速度 +12%", "tier": "common"},
	{"id": "multishot", "name": "多重射击", "desc": "弹丸数量 +1（伤害略摊薄）", "tier": "epic"},
	{"id": "vitality", "name": "坚韧体魄", "desc": "最大生命 +20 并立即恢复 20", "tier": "common"},
	{"id": "magnetism", "name": "磁力增幅", "desc": "宝石拾取范围 +40%", "tier": "common"},
	{"id": "keen_eye", "name": "敏锐感知", "desc": "索敌范围 +15%", "tier": "common"},
]


static func random_pick(count: int) -> Array[Dictionary]:
	var pool := ALL.duplicate()
	var out: Array[Dictionary] = []
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for i in mini(count, pool.size()):
		var idx := rng.randi_range(0, pool.size() - 1)
		out.append(pool[idx])
		pool.remove_at(idx)
	return out
