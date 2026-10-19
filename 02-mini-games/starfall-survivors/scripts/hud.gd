extends CanvasLayer
## 战斗 HUD：生命 / 等级 / 经验 / 波次 / 计时 / 击杀，外加受击红屏、低血脉动与暗角。

const LOW_HP_RATIO := 0.3

var _hurt_tween: Tween
var _banner_tween: Tween
var _low_tween: Tween
var _last_wave := 1
var _low_hp := false


func _ready() -> void:
	GameState.hp_changed.connect(_on_hp_changed)
	GameState.xp_changed.connect(_refresh_bars)
	GameState.level_changed.connect(_on_level_changed)
	GameState.player_hurt.connect(_on_player_hurt)
	GameState.game_over.connect(_on_game_over)
	_last_wave = GameState.wave
	$WaveBanner.modulate.a = 0.0
	_refresh_bars()
	_on_hp_changed(GameState.hp, GameState.max_hp)


func _process(_delta: float) -> void:
	if not is_inside_tree():
		return
	$TimePanel/VBox/TimeLabel.text = _fmt_time(GameState.elapsed)
	$TimePanel/VBox/WaveLabel.text = "第 %d 波" % GameState.wave
	$KillPanel/KillLabel.text = "击杀 %d" % GameState.kills
	if GameState.wave != _last_wave:
		_last_wave = GameState.wave
		_show_banner("第 %d 波" % GameState.wave)


func _fmt_time(t: float) -> String:
	return "%02d:%02d" % [int(t) / 60, int(t) % 60]


func _refresh_bars(_a: int = 0, _b: int = 0) -> void:
	$XPBar.max_value = maxf(GameState.xp_to_next, 1.0)
	$XPBar.value = GameState.xp
	$StatsPanel/HBox/LvLabel.text = "Lv.%d" % GameState.level


func _on_hp_changed(hp: int, max_hp: int) -> void:
	var bar: ProgressBar = $StatsPanel/HBox/HPBar
	bar.max_value = maxf(max_hp, 1.0)
	bar.value = hp
	$StatsPanel/HBox/HPText.text = "%d/%d" % [hp, max_hp]
	_update_low_hp()


func _on_level_changed(level: int) -> void:
	_refresh_bars()
	_show_banner("等级提升  Lv.%d" % level)


func _show_banner(text: String) -> void:
	var banner: Label = $WaveBanner
	banner.text = text
	if _banner_tween != null and _banner_tween.is_valid():
		_banner_tween.kill()
	banner.modulate.a = 0.0
	banner.scale = Vector2(1.35, 1.35)
	banner.pivot_offset = banner.size * 0.5
	_banner_tween = create_tween().set_parallel(true)
	_banner_tween.tween_property(banner, "modulate:a", 1.0, 0.22)
	_banner_tween.tween_property(banner, "scale", Vector2.ONE, 0.35).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	_banner_tween.chain().tween_property(banner, "modulate:a", 0.0, 0.5).set_delay(0.75)


func _update_low_hp() -> void:
	var ratio: float = float(GameState.hp) / maxf(float(GameState.max_hp), 1.0)
	var low := ratio <= LOW_HP_RATIO and GameState.hp > 0
	if low == _low_hp:
		return
	_low_hp = low
	if _low_tween != null and _low_tween.is_valid():
		_low_tween.kill()
		_low_tween = null
	if low:
		_low_tween = create_tween().set_loops()
		_low_tween.tween_property($LowHPOverlay, "modulate:a", 0.28, 0.7).set_ease(Tween.EASE_IN_OUT)
		_low_tween.tween_property($LowHPOverlay, "modulate:a", 0.08, 0.7).set_ease(Tween.EASE_IN_OUT)
	else:
		$LowHPOverlay.modulate.a = 0.0


func _on_player_hurt() -> void:
	var overlay := $HurtOverlay
	if _hurt_tween != null and _hurt_tween.is_valid():
		_hurt_tween.kill()
	overlay.modulate.a = 0.3
	_hurt_tween = create_tween()
	_hurt_tween.tween_property(overlay, "modulate:a", 0.0, 0.45).set_ease(Tween.EASE_OUT)


func _on_game_over() -> void:
	if _low_tween != null and _low_tween.is_valid():
		_low_tween.kill()
		_low_tween = null
	$LowHPOverlay.modulate.a = 0.0
