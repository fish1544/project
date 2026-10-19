extends CanvasLayer


func _ready() -> void:
	GameState.hp_changed.connect(_refresh)
	GameState.xp_changed.connect(_refresh)
	GameState.level_changed.connect(_refresh)
	GameState.game_over.connect(_on_game_over)
	_refresh()


func _refresh(_hp: int = 0, _max_hp: int = 0, _level: int = 0) -> void:
	$HP.text = "HP  %d / %d" % [GameState.hp, GameState.max_hp]
	$XP.text = "Lv.%d   XP %d / %d   击杀 %d" % [GameState.level, GameState.xp, GameState.xp_to_next, GameState.kills]
	$Status.text = "游戏结束" if GameState.is_game_over else ""


func _on_game_over() -> void:
	$Status.text = "游戏结束"
