class_name ScreenShake
extends Camera2D
## 屏幕震动组件：挂在 Camera2D 上，调用 shake(time, strength) 触发。
## 兼容渲染下直接改 camera.offset，不影响位置跟随。

var shake_time := 0.0
var shake_strength := 0.0
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	_rng.randomize()


func shake(time: float, strength: float) -> void:
	if time > shake_time:
		shake_time = time
		shake_strength = strength


func _process(_delta: float) -> void:
	if shake_time > 0.0:
		shake_time = maxf(0.0, shake_time - _delta)
		var decay: float = shake_time / 0.45  # 线性衰减
		offset = Vector2(_rng.randf_range(-1.0, 1.0), _rng.randf_range(-1.0, 1.0)) * shake_strength * decay
	else:
		offset = Vector2.ZERO
