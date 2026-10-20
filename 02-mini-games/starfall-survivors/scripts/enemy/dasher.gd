extends EnemyBase
## 冲刺者：远距离游走接近 -> 近距离蓄力（变白抖动）-> 高速冲刺 -> 硬直恢复。

enum State { APPROACH, WINDUP, DASH, RECOVER }

@export var approach_speed := 48.0
@export var dash_speed := 330.0
@export var windup_range := 240.0

var state: int = State.APPROACH
var state_timer := 0.0
var dash_dir := Vector2.ZERO
var _windup_time := 0.55
var _flash_tween: Tween


func _physics_process(delta: float) -> void:
	state_timer -= delta
	var dist := 0.0
	var to_target := Vector2.ZERO
	if is_instance_valid(target):
		to_target = target.global_position - global_position
		dist = to_target.length()
	match state:
		State.APPROACH:
			if is_instance_valid(target):
				velocity = _apply_avoid(to_target.normalized(), delta) * approach_speed
			if dist < windup_range and dist > 24.0 and state_timer <= 0.0:
				_enter_state(State.WINDUP)
		State.WINDUP:
			velocity = velocity.move_toward(Vector2.ZERO, 700.0 * delta)
			if state_timer <= 0.0:
				_enter_state(State.DASH)
		State.DASH:
			velocity = dash_dir * dash_speed
			if state_timer <= 0.0:
				_enter_state(State.RECOVER)
		State.RECOVER:
			velocity = velocity.move_toward(Vector2.ZERO, 520.0 * delta)
			if state_timer <= 0.0:
				_enter_state(State.APPROACH)
	_integrate_common(delta)


func _enter_state(s: int) -> void:
	state = s
	var spr := $Sprite2D
	match state:
		State.WINDUP:
			state_timer = _windup_time
			if is_instance_valid(target):
				dash_dir = (target.global_position - global_position).normalized()
			if spr != null:
				if _flash_tween != null and _flash_tween.is_valid():
					_flash_tween.kill()
				_flash_tween = create_tween().set_loops()
				_flash_tween.tween_property(spr, "self_modulate", Color(3.0, 3.0, 3.0), 0.13)
				_flash_tween.tween_property(spr, "self_modulate", Color(1.0, 1.0, 1.0), 0.13)
		State.DASH:
			state_timer = 0.34
			velocity = dash_dir * dash_speed
		State.RECOVER:
			state_timer = 0.6
			if spr != null and _flash_tween != null and _flash_tween.is_valid():
				_flash_tween.kill()
				spr.self_modulate = Color(1, 1, 1)
		State.APPROACH:
			state_timer = 0.0


func _apply_difficulty(wave: int, mult: float) -> void:
	approach_speed = 48.0 * mult
	dash_speed = 330.0 * mult
	_windup_time = maxf(0.3, 0.55 - 0.05 * (wave - 1))
