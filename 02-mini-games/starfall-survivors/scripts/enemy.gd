extends EnemyBase
## 追击者：直线追向玩家的基础敌种。

@export var chase_speed := 60.0


func _physics_process(delta: float) -> void:
	if is_instance_valid(target):
		var to_target: Vector2 = target.global_position - global_position
		if to_target.length() > 2.0:
			velocity = to_target.normalized() * chase_speed
		else:
			velocity = Vector2.ZERO
	else:
		velocity = Vector2.ZERO
	_integrate_common(delta)


func _apply_difficulty(wave: int, mult: float) -> void:
	chase_speed = 60.0 * mult
