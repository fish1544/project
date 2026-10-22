class_name EnemyBase
extends CharacterBody2D
## 敌种基类：受击白闪/击退/死亡掉落/波次难度缩放。
## 子类自定义 _physics_process 并调用 _integrate_common(delta)。

const XPGemScene := preload("res://scenes/pickups/xp_gem.tscn")
const DeathBurstScene := preload("res://scenes/fx/death_burst.tscn")

@export var hp := 16

var target: Node2D
var knockback_vel := Vector2.ZERO

# 绕障转向：撞到障碍后沿碰撞法线的切线侧移一小段时间，避免顶着石头原地打滑
var _avoid_dir := Vector2.ZERO
var _avoid_timer := 0.0
const AVOID_DURATION := 0.6
const AVOID_STRENGTH := 1.4

# 群体软分离：同类之间不硬碰撞（硬碰撞会把尸潮挤成一堵墙），
# 而是按重叠深度施加柔和的推开速度，敌人各占其位又不互相卡死
const SWARM_CELL := 44.0
const SWARM_RADIUS := 17.0      # 小于该距离开始互推
const SWARM_STRENGTH := 62.0
const BODY_RADIUS := 6.5
static var _swarm: Dictionary = {}   # Vector2i -> Array[EnemyBase]
var _swarm_cell := Vector2i.ZERO
# 分离力按帧降频复用：尸潮上百时每帧全量重算要 2ms，摊到 3 帧后峰值降到 1/3
var _sep_push := Vector2.ZERO
var _sep_tick := 0

# 卡死兜底：想走却几乎没位移（被地形夹住）时，强制换个方向绕出去
var _stuck_timer := 0.0
var _last_pos := Vector2.ZERO
const STUCK_LIMIT := 1.0
const STUCK_MOVE_EPS := 0.35


func _ready() -> void:
	add_to_group("enemies")
	_last_pos = global_position
	_swarm_register()
	# 相位错开：不同敌人分别在第 1/2/3 帧首次计算分离力，之后各自每 3 帧一次
	_sep_tick = get_instance_id() % 3


func _exit_tree() -> void:
	_swarm_unregister()


## 自检用：统计群体网格内的格子数与登记数，用于侦测回收是否彻底。
static func debug_stats() -> Dictionary:
	var bodies := 0
	for k in _swarm:
		bodies += _swarm[k].size()
	return {"cells": _swarm.size(), "bodies": bodies}


static func key(at: Vector2) -> Vector2i:
	return Vector2i(int(floor(at.x / SWARM_CELL)), int(floor(at.y / SWARM_CELL)))


func _swarm_key(at: Vector2) -> Vector2i:
	return Vector2i(int(floor(at.x / SWARM_CELL)), int(floor(at.y / SWARM_CELL)))


func _swarm_register() -> void:
	var k := _swarm_key(global_position)
	if k == _swarm_cell and _swarm.has(k) and _swarm[k].has(self):
		return
	_swarm_unregister()
	_swarm_cell = k
	if not _swarm.has(k):
		_swarm[k] = []
	var arr: Array = _swarm[k]
	arr.append(self)


func _swarm_unregister() -> void:
	var arr = _swarm.get(_swarm_cell)
	if arr != null:
		arr.erase(self)
		if arr.is_empty():
			_swarm.erase(_swarm_cell)


## 邻近同类的合推开方向（重叠越深推得越用力）。只查周围 9 格，开销恒定。
func _separation_push() -> Vector2:
	var push := Vector2.ZERO
	var k := _swarm_cell
	for gx in range(k.x - 1, k.x + 2):
		for gy in range(k.y - 1, k.y + 2):
			var bucket = _swarm.get(Vector2i(gx, gy))
			if bucket == null:
				continue
			for other in bucket:
				if other == self or not is_instance_valid(other):
					continue
				var d: Vector2 = global_position - other.global_position
				var dist: float = d.length()
				if dist < SWARM_RADIUS:
					if dist < 0.001:
						# 完全重合时给一个由 uid 决定的稳定偏移，避免两边同向抖动
						d = Vector2.RIGHT.rotated(fmod(float(get_instance_id()), 6.283))
						dist = 0.001
					push += d / dist * (1.0 - dist / SWARM_RADIUS)
	return push * SWARM_STRENGTH


## 子类在计算期望方向后调用：返回一个已掺入侧移的朝向（单位向量）。
func _apply_avoid(desired: Vector2, delta: float) -> Vector2:
	if _avoid_timer <= 0.0:
		return desired
	_avoid_timer -= delta
	return (desired + _avoid_dir * AVOID_STRENGTH).normalized()


func _integrate_common(delta: float) -> void:
	_swarm_register()
	# 错开刷新相位，避免所有敌人挤在同一帧重算
	_sep_tick -= 1
	if _sep_tick <= 0:
		_sep_push = _separation_push()
		_sep_tick = 3
	velocity += _sep_push + knockback_vel
	move_and_slide()
	_update_avoid()
	_update_stuck(delta)
	# 万一被地形或尸潮挤进石头内部，兜底推出，避免永久卡死
	ObstacleField.push_out(self, BODY_RADIUS)
	knockback_vel = knockback_vel.move_toward(Vector2.ZERO, 420.0 * delta)


func _update_stuck(delta: float) -> void:
	var moved: float = global_position.distance_to(_last_pos)
	_last_pos = global_position
	# 只在"有移动意图却几乎没动"时判定为卡死，站着开枪的远程者不会被误伤
	if velocity.length() > 12.0 and moved < STUCK_MOVE_EPS:
		_stuck_timer += delta
		if _stuck_timer >= STUCK_LIMIT:
			_stuck_timer = 0.0
			_avoid_dir = Vector2.RIGHT.rotated(randf() * TAU)
			_avoid_timer = 0.9
	else:
		_stuck_timer = 0.0


func _update_avoid() -> void:
	if _avoid_timer > 0.0 or get_slide_collision_count() == 0:
		return
	var n: Vector2 = get_slide_collision(0).get_normal()
	var t1 := Vector2(-n.y, n.x)
	var t2 := Vector2(n.y, -n.x)
	# 取与当前行进方向更接近的那条切线，保持“继续往前”的意图
	_avoid_dir = t1 if t1.dot(velocity) > t2.dot(velocity) else t2
	_avoid_timer = AVOID_DURATION


func take_damage(amount: int, from_direction: Vector2 = Vector2.ZERO) -> void:
	hp -= amount
	_flash_white()
	if from_direction != Vector2.ZERO:
		knockback_vel = from_direction.normalized() * 110.0
	if hp <= 0:
		GameState.add_kill()
		call_deferred("_drop_loot")


func _flash_white() -> void:
	var spr := $Sprite2D
	if spr == null:
		return
	spr.self_modulate = Color(3.0, 3.0, 3.0, 1.0)
	var tw := create_tween()
	tw.tween_property(spr, "self_modulate", Color(1, 1, 1), 0.09)


## 波次缩放：血量成长比速度成长更陡，但都比原来放缓——
## 旧曲线下第 8 波杀一只要 7 秒（刷怪只要 0.9 秒），玩家永远清不完场。
const HP_GROWTH := 0.16
const SPEED_GROWTH := 0.18


func scale_difficulty(wave: int) -> void:
	hp = int(round(hp * (1.0 + HP_GROWTH * (wave - 1))))
	_apply_difficulty(wave, 1.0 + SPEED_GROWTH * (wave - 1))


func _apply_difficulty(_wave: int, _mult: float) -> void:
	pass  # 子类 override，按自身速度参数缩放


func _drop_loot() -> void:
	var burst := DeathBurstScene.instantiate()
	burst.position = global_position
	get_parent().add_child(burst)
	var gem := XPGemScene.instantiate()
	gem.position = global_position
	gem.target = target
	if is_instance_valid(target) and target.get("magnet_range") != null:
		gem.magnet_range = target.magnet_range
	get_parent().add_child(gem)
	queue_free()
