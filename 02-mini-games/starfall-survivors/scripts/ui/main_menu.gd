extends Control
## 主菜单：标题 + 开始按钮 + 操作说明，星点背景。

const STAR_TEX := preload("res://assets/sprites/icon.png")


func _ready() -> void:
	_spawn_stars()
	# 标题浮动循环
	var title := $CenterBox/Title
	var tw := create_tween().set_loops()
	tw.tween_property(title, "position:y", title.position.y - 6.0, 1.6).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	tw.tween_property(title, "position:y", title.position.y, 1.6).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)


func _spawn_stars() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var stars := $Stars
	for i in 46:
		var s := Sprite2D.new()
		s.texture = STAR_TEX
		s.scale = Vector2(0.045, 0.045) * rng.randf_range(0.6, 1.6)
		s.modulate.a = rng.randf_range(0.25, 0.9)
		s.position = Vector2(rng.randf_range(10.0, 950.0), rng.randf_range(10.0, 530.0))
		stars.add_child(s)
		var tw := create_tween().set_loops()
		tw.tween_property(s, "modulate:a", 0.1, rng.randf_range(0.6, 1.6))
		tw.tween_property(s, "modulate:a", s.modulate.a, rng.randf_range(0.6, 1.6))


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ENTER or event.keycode == KEY_SPACE:
			_on_start_pressed()


func _on_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main.tscn")
