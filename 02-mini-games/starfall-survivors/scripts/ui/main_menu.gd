extends Control
## 主菜单：夜空背景（AI 生成）+ 星点闪烁 + 标题浮动 + 开始/退出。

const PLAYER_TEX := preload("res://assets/sprites/player.png")
const STAR_TEX := preload("res://assets/backgrounds/mote.png")


func _ready() -> void:
	if OS.has_feature("web"):
		var quit := $Root/Panel/VBox/QuitButton
		quit.visible = false
	_spawn_stars()
	$Root/Panel/VBox/StartButton.grab_focus()
	# 标题浮动
	var title := $Root/Panel/VBox/TitleRow/Title
	var tw := create_tween().set_loops()
	tw.tween_property(title, "position:y", title.position.y - 5.0, 1.7).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	tw.tween_property(title, "position:y", title.position.y, 1.7).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	# 面板入场
	var panel: Control = $Root/Panel
	panel.modulate.a = 0.0
	panel.position.y += 26.0
	var intro := create_tween().set_parallel(true)
	intro.tween_property(panel, "modulate:a", 1.0, 0.4)
	intro.tween_property(panel, "position:y", panel.position.y - 26.0, 0.45).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)


func _spawn_stars() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var stars := $Stars
	for _i in 54:
		var s := Sprite2D.new()
		s.texture = STAR_TEX
		s.scale = Vector2.ONE * rng.randf_range(0.35, 1.1)
		var base_a := rng.randf_range(0.2, 0.75)
		s.modulate = Color(0.85, 0.92, 1.0, base_a)
		s.position = Vector2(rng.randf_range(8.0, 952.0), rng.randf_range(8.0, 532.0))
		stars.add_child(s)
		var tw := create_tween().set_loops()
		tw.tween_property(s, "modulate:a", 0.08, rng.randf_range(0.7, 2.0))
		tw.tween_property(s, "modulate:a", base_a, rng.randf_range(0.7, 2.0))


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ENTER or event.keycode == KEY_SPACE:
			_on_start_pressed()


func _on_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main.tscn")


func _on_quit_pressed() -> void:
	get_tree().quit()
