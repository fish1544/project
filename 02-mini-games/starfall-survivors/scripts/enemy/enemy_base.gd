class_name EnemyBase
extends CharacterBody2D
## 敌种基类：受击白闪/击退/死亡掉落/波次难度缩放。
## 子类自定义 _physics_process 并调用 _integrate_common(delta)。

const XPGemScene := preload("res://scenes/pickups/xp_gem.tscn")
const DeathBurstScene := preload("res://scenes/fx/death_burst.tscn")

@export var hp := 20

var target: Node2D
var knockback_vel := Vector2.ZERO


func _ready() -> void:
	add_to_group("enemies")


func _integrate_common(delta: float) -> void:
	velocity += knockback_vel
	move_and_slide()
	knockback_vel = knockback_vel.move_toward(Vector2.ZERO, 420.0 * delta)


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
