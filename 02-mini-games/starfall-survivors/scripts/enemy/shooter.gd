extends EnemyBase
## 远程弹幕手：与玩家保持约 190px 周旋，间隔发射慢速能量弹。

const EnemyBulletScene := preload("res://scenes/attacks/enemy_bullet.tscn")

@export var move_speed := 42.0
@export var preferred_range := 190.0
@export var fire_interval := 2.4

var fire_cooldown := 1.2


func _physics_process(delta: float) -> void:
	fire_cooldown -= delta
	if is_instance_valid(target):
		var to_target: Vector2 = target.global_position - global_position
		var dist: float = to_target.length()
		if dist > preferred_range + 30.0:
			velocity = _apply_avoid(to_target.normalized(), delta) * move_speed
		elif dist < preferred_range - 30.0:
			velocity = _apply_avoid(-to_target.normalized(), delta) * move_speed
		else:
			velocity = velocity.move_toward(Vector2.ZERO, 300.0 * delta)
		if fire_cooldown <= 0.0 and dist < 460.0:
			fire_cooldown = fire_interval
			_fire()
	_integrate_common(delta)


func _fire() -> void:
	var dir := Vector2.RIGHT
	if is_instance_valid(target):
		dir = (target.global_position - global_position).normalized()
	var bullet := EnemyBulletScene.instantiate()
	bullet.position = global_position + dir * 10.0
	bullet.direction = dir
	get_parent().add_child(bullet)


func _apply_difficulty(wave: int, mult: float) -> void:
	move_speed = 42.0 * mult
	fire_interval = maxf(1.0, 2.4 - 0.15 * (wave - 1))
