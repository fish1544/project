extends Label
## 伤害飘字：在 setup() 指定位置弹出，向上飘并淡出，0.6s 自毁。

func setup(at_position: Vector2, amount: int, crit_color: bool = false) -> void:
	position = at_position
	text = str(amount)
	if crit_color:
		add_theme_color_override("font_color", Color(1.0, 0.45, 0.35))
	else:
		add_theme_color_override("font_color", Color(1.0, 0.88, 0.45))


func _ready() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	position += Vector2(rng.randf_range(-6.0, 6.0), -8.0)
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(self, "position:y", position.y - 26.0, 0.55).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
	tw.tween_property(self, "modulate:a", 0.0, 0.55).set_delay(0.15)
	var free_tw := create_tween()
	free_tw.tween_interval(0.6)
	free_tw.tween_callback(queue_free)
