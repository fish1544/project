class_name EnemyBase
extends CharacterBody2D
## 敌种基类：受击白闪/击退/死亡掉落/波次难度缩放。
## 子类自定义 _physics_process 并调用 _integrate_common(delta)。

const XPGemScene := preload("res://scenes/pickups/xp_gem.tscn")
const DeathBurstScene := preload("res://scenes/fx/death_burst.tscn")

@export var hp := 20

var target: Node2D
var knockback_vel := Vector2.ZERO

# 绕障转向：撞到障碍后沿碰撞法线的切线侧移一小段时间，避免顶着石头原地打滑
var _avoid_dir := Vector2.ZERO
var _avoid_timer := 0.0
const AVOID_DURATION := 0.6
const AVOID_STRENGTH := 1.4


func _ready() -> void:
	add_to_group("enemies")


## 子类在计算期望方向后调用：返回一个已掺入侧移的朝向（单位向量）。
func _apply_avoid(desired: Vector2, delta: float) -> Vector2:
	if _avoid_timer <= 0.0:
		return desired
	_avoid_timer -= delta
	return (desired + _avoid_dir * AVOID_STRENGTH).normalized()


func _integrate_common(delta: float) -> void:
	velocity += knockback_vel
	move_and_slide()
	_update_avoid()
	knockback_vel = knockback_vel.move_toward(Vector2.ZERO, 420.0 * delta)


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


func scale_difficulty(wave: int) -> void:
	var mult: float = 1.0 + 0.28 * (wave - 1)
	hp = int(round(hp * mult))
	_apply_difficulty(wave, mult)


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
