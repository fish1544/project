class_name BuffPool
extends RefCounted
## 升级三选一的 Buff 池：id / 名称 / 描述 / 对玩家属性的作用在 player.apply_upgrade() 中实现。

const ALL: Array[Dictionary] = [
	{"id": "rapid_fire", "name": "迅捷射击", "desc": "攻击速度 +20%"},
	{"id": "power_shot", "name": "强力弹丸", "desc": "子弹伤害 +25%"},
	{"id": "swift_step", "name": "疾风步", "desc": "移动速度 +12%"},
	{"id": "multishot", "name": "多重射击", "desc": "弹丸数量 +1（伤害略摊薄）"},
	{"id": "vitality", "name": "坚韧体魄", "desc": "最大生命 +20 并立即恢复 20"},
	{"id": "magnetism", "name": "磁力增幅", "desc": "宝石拾取范围 +40%"},
	{"id": "keen_eye", "name": "敏锐感知", "desc": "索敌范围 +15%"},
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
