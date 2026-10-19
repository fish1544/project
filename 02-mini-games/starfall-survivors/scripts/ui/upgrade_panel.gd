extends CanvasLayer
## 升级三选一面板：升级时弹出，暂停世界，玩家选择一项强化或跳过。

signal upgrade_done

const UpgradePanelScene := preload("res://scenes/ui/upgrade_panel.tscn")

var _player: CharacterBody2D
var _buffs: Array[Dictionary] = []
var _chosen := false


func setup(player: CharacterBody2D) -> void:
	_player = player
	_buffs = BuffPool.random_pick(3)
	_build_cards()


func _build_cards() -> void:
	var card_normal := StyleBoxFlat.new()
	card_normal.bg_color = Color(0.13, 0.16, 0.26, 1.0)
	card_normal.set_corner_radius_all(10)
	var card_hover := StyleBoxFlat.new()
	card_hover.bg_color = Color(0.2, 0.25, 0.4, 1.0)
	card_hover.set_corner_radius_all(10)
	var row := $CenterPanel/VBox/CardRow
	for i in _buffs.size():
		var b: Dictionary = _buffs[i]
		var btn := Button.new()
		btn.custom_minimum_size = Vector2(196, 132)
		btn.focus_mode = Control.FOCUS_NONE
		btn.add_theme_stylebox_override("normal", card_normal)
		btn.add_theme_stylebox_override("hover", card_hover)
		btn.add_theme_stylebox_override("pressed", card_hover)
		btn.pressed.connect(_on_card_pressed.bind(i))
		var vb := VBoxContainer.new()
		vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
		vb.add_theme_constant_override("separation", 10)
		var key_l := Label.new()
		key_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
		key_l.text = "[%d]  %s" % [i + 1, b["name"]]
		key_l.add_theme_font_size_override("font_size", 17)
		key_l.add_theme_color_override("font_color", Color(1.0, 0.85, 0.35))
		var desc_l := Label.new()
		desc_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
		desc_l.text = str(b["desc"])
		desc_l.add_theme_font_size_override("font_size", 13)
		desc_l.add_theme_color_override("font_color", Color(0.88, 0.9, 0.95))
		desc_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vb.add_child(key_l)
		vb.add_child(desc_l)
		btn.add_child(vb)
		row.add_child(btn)


func _on_card_pressed(index: int) -> void:
	_finish(index)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1:
				if _buffs.size() > 0:
					_finish(0)
			KEY_2:
				if _buffs.size() > 1:
					_finish(1)
			KEY_3:
				if _buffs.size() > 2:
					_finish(2)
			KEY_ESCAPE:
				_finish(-1)


func _finish(index: int) -> void:
	if _chosen:
		return
	_chosen = true
	if index >= 0 and _player != null and is_instance_valid(_player):
		_player.apply_upgrade(str(_buffs[index]["id"]))
	GameState.consume_upgrade()
	upgrade_done.emit()
	queue_free()
