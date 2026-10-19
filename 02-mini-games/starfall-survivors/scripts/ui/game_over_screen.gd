extends CanvasLayer
## 结算画面：游戏结束时弹出，展示战绩与评价，提供重开与返回主菜单。
##
## 布局要点：PanelContainer 只能正确排布「一个」子节点，历史版本把多个控件
## 直接挂在 Panel 下会被容器强制铺满同一矩形 → 全部叠成一团。
## 现在统一由 PanelRoot/Panel/VBox 单链承载，并用 CenterContainer 居中自适应。

const RANKS: Array[Dictionary] = [
	{"wave": 1, "text": "评价：新兵", "hint": "提示：走位时绕大圈，别被围在中间"},
	{"wave": 2, "text": "评价：拾荒者", "hint": "提示：升级优先补攻击速度，清理效率翻倍"},
	{"wave": 4, "text": "评价：老兵", "hint": "提示：远程敌人优先点掉，别让它站桩输出"},
	{"wave": 6, "text": "评价：精英猎手", "hint": "提示：多吃磁吸范围，宝石会自动来找你"},
	{"wave": 9, "text": "评价：星陨传说", "hint": "提示：你已经摸到天花板了，试试更激进的 Build"},
]


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	get_tree().paused = true
	_fill_stats()
	$PanelRoot/Panel/VBox/RestartButton.pressed.connect(_on_restart)
	$PanelRoot/Panel/VBox/MenuButton.pressed.connect(_on_menu)
	$PanelRoot/Panel/VBox/RestartButton.grab_focus()
	_play_in()


func _fill_stats() -> void:
	var vbox := $PanelRoot/Panel/VBox
	var t := GameState.elapsed
	vbox.get_node("StatsGrid/TimeValue").text = "%02d:%02d" % [int(t) / 60, int(t) % 60]
	vbox.get_node("StatsGrid/KillValue").text = str(GameState.kills)
	vbox.get_node("StatsGrid/LevelValue").text = "Lv.%d" % GameState.level
	vbox.get_node("StatsGrid/WaveValue").text = "第 %d 波" % GameState.wave
	var rank := RANKS[0]
	for entry in RANKS:
		if GameState.wave >= int(entry["wave"]):
			rank = entry
	vbox.get_node("RankLabel").text = str(rank["text"])
	vbox.get_node("HintLabel").text = str(rank["hint"])


func _play_in() -> void:
	var panel: Control = $PanelRoot/Panel
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.88, 0.88)
	panel.pivot_offset = panel.size * 0.5
	var tween := create_tween().set_parallel(true)
	tween.tween_property(panel, "modulate:a", 1.0, 0.28)
	tween.tween_property(panel, "scale", Vector2.ONE, 0.34).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)


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
