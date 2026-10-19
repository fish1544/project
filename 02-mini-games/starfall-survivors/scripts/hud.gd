extends CanvasLayer

var _hurt_tween: Tween


func _ready() -> void:
	GameState.hp_changed.connect(_refresh)
	GameState.xp_changed.connect(_refresh)
	GameState.level_changed.connect(_refresh)
	GameState.player_hurt.connect(_on_player_hurt)
	_refresh()


func _process(_delta: float) -> void:
	$InfoRow/TimeLabel.text = _fmt_time(GameState.elapsed)
	$InfoRow/WaveLabel.text = "第 %d 波" % GameState.wave
	$InfoRow/KillLabel.text = "击杀 %d" % GameState.kills


func _fmt_time(t: float) -> String:
	var m: int = int(t) / 60
	var s: int = int(t) % 60
	return "%02d:%02d" % [m, s]


func _refresh(_hp: int = 0, _max_hp: int = 0, _level: int = 0) -> void:
	$XPBar.max_value = GameState.xp_to_next
	$XPBar.value = GameState.xp
	$HPBar.max_value = GameState.max_hp
	$HPBar.value = GameState.hp
	$InfoRow/LvLabel.text = "Lv.%d" % GameState.level


func _on_player_hurt() -> void:
	var overlay := $HurtOverlay
	if _hurt_tween != null and _hurt_tween.is_valid():
		_hurt_tween.kill()
	overlay.modulate.a = 0.32
	_hurt_tween = create_tween()
	_hurt_tween.tween_property(overlay, "modulate:a", 0.0, 0.45).set_ease(Tween.EASE_OUT)
