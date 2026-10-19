extends CanvasLayer
## 结算画面：游戏结束时弹出，展示战绩，提供重开与返回主菜单。

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	get_tree().paused = true
	var t := GameState.elapsed
	var stats := "存活 %02d:%02d   ·   击杀 %d   ·   Lv.%d   ·   第 %d 波" % [
		int(t) / 60, int(t) % 60,
		GameState.kills, GameState.level, GameState.wave
	]
	$Panel/StatsLabel.text = stats
	$Panel/RestartButton.pressed.connect(_on_restart)
	$Panel/MenuButton.pressed.connect(_on_menu)
	$Panel/RestartButton.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_ENTER or event.keycode == KEY_R or event.keycode == KEY_SPACE:
			_on_restart()
		elif event.keycode == KEY_ESCAPE:
			_on_menu()


func _on_restart() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()


func _on_menu() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
