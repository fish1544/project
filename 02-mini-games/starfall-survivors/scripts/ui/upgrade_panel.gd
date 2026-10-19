extends CanvasLayer
## 升级三选一面板：升级时弹出并暂停世界，玩家选一项强化或按 Esc 跳过。

signal upgrade_done

var _player: CharacterBody2D
var _buffs: Array[Dictionary] = []
var _chosen := false
var _cards: Array[Button] = []


func setup(player: CharacterBody2D) -> void:
	_player = player
	_buffs = BuffPool.random_pick(3)
	$Root/Panel/VBox/Subtitle.text = "当前 Lv.%d" % GameState.level
	_build_cards()
	_play_in()


func _play_in() -> void:
	var panel: Control = $Root/Panel
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.9, 0.9)
	panel.pivot_offset = panel.size * 0.5
	var tween := create_tween().set_parallel(true)
	tween.tween_property(panel, "modulate:a", 1.0, 0.2)
	tween.tween_property(panel, "scale", Vector2.ONE, 0.28).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)


func _make_card_style(tier_color: Color, base: Color, border: int) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = base
	sb.set_corner_radius_all(12)
	sb.set_border_width_all(2)
	sb.border_color = tier_color
	sb.set_corner_detail(4)
	return sb


func _build_cards() -> void:
	var row := $Root/Panel/VBox/CardRow
	for i in _buffs.size():
		var b: Dictionary = _buffs[i]
		var tier := str(b.get("tier", "common"))
		var tier_color: Color = BuffPool.TIER_COLORS.get(tier, Color(0.66, 0.7, 0.82))
		var btn := Button.new()
		btn.custom_minimum_size = Vector2(200, 152)
		btn.focus_mode = Control.FOCUS_NONE
		btn.add_theme_stylebox_override("normal", _make_card_style(tier_color, Color(0.11, 0.14, 0.24, 1.0), 2))
		btn.add_theme_stylebox_override("hover", _make_card_style(tier_color, Color(0.2, 0.25, 0.42, 1.0), 2))
		btn.add_theme_stylebox_override("pressed", _make_card_style(tier_color, Color(0.28, 0.3, 0.2, 1.0), 2))
		btn.pressed.connect(_on_card_pressed.bind(i))
		btn.mouse_entered.connect(_on_card_hover.bind(btn, true))
		btn.mouse_exited.connect(_on_card_hover.bind(btn, false))

		var vb := VBoxContainer.new()
		vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
		vb.add_theme_constant_override("separation", 8)

		var tier_l := Label.new()
		tier_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
		tier_l.text = str(BuffPool.TIER_NAMES.get(tier, "普通"))
		tier_l.add_theme_font_size_override("font_size", 12)
		tier_l.add_theme_color_override("font_color", tier_color)
		tier_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

		var name_l := Label.new()
		name_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
		name_l.text = "[%d]  %s" % [i + 1, b["name"]]
		name_l.add_theme_font_size_override("font_size", 18)
		name_l.add_theme_color_override("font_color", tier_color)
		name_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

		var desc_l := Label.new()
		desc_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
		desc_l.text = str(b["desc"])
		desc_l.add_theme_font_size_override("font_size", 13)
		desc_l.add_theme_color_override("font_color", Color(0.88, 0.9, 0.96))
		desc_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		desc_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

		vb.add_child(tier_l)
		vb.add_child(name_l)
		vb.add_child(desc_l)
		btn.add_child(vb)
		row.add_child(btn)
		_cards.append(btn)


func _on_card_hover(btn: Button, entered: bool) -> void:
	if not is_instance_valid(btn):
		return
	btn.scale = Vector2(1.04, 1.04) if entered else Vector2.ONE
	btn.pivot_offset = btn.size * 0.5


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
