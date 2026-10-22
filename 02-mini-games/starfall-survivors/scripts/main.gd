extends Node2D

const PlayerScene := preload("res://scenes/player/player.tscn")
const EnemyScene := preload("res://scenes/enemies/enemy.tscn")
const DasherScene := preload("res://scenes/enemies/dasher.tscn")
const ShooterScene := preload("res://scenes/enemies/shooter.tscn")
const XPGemScene := preload("res://scenes/pickups/xp_gem.tscn")
const HUDScene := preload("res://scenes/ui/hud.tscn")
const UpgradePanelScene := preload("res://scenes/ui/upgrade_panel.tscn")
const GameOverScreenScene := preload("res://scenes/ui/game_over_screen.tscn")
const BackgroundScene := preload("res://scenes/world/background.tscn")

const WAVE_DURATION := 30.0  # 每 30 秒推进一波

var world: Node2D
var player: CharacterBody2D
var enemy_timer: Timer
var _upgrade_panel: CanvasLayer


func _ready() -> void:
	randomize()
	GameState.reset_state()
	world = Node2D.new()
	world.name = "World"
	# 开启 y 排序：角色走到岩石上方/下方时产生正确的前后遮挡
	world.y_sort_enabled = true
	add_child(world)
	# 背景先入树，保证绘制在玩家/敌人之下
	var bg := BackgroundScene.instantiate()
	world.add_child(bg)
	player = PlayerScene.instantiate()
	world.add_child(player)
	bg.follow_target = player
	var camera := ScreenShake.new()
	camera.zoom = Vector2(2.5, 2.5)
	player.add_child(camera)
	add_child(HUDScene.instantiate())
	enemy_timer = Timer.new()
	enemy_timer.wait_time = 1.5
	enemy_timer.timeout.connect(_on_enemy_spawn_tick)
	add_child(enemy_timer)
	enemy_timer.start()
	var gem_timer := Timer.new()
	gem_timer.wait_time = 3.0
	gem_timer.timeout.connect(spawn_gem)
	add_child(gem_timer)
	gem_timer.start()
	GameState.upgrades_pending.connect(_on_upgrades_pending)
	GameState.game_over.connect(_on_game_over)


func _process(delta: float) -> void:
	if GameState.is_game_over or not is_instance_valid(player):
		return
	GameState.elapsed += delta
	var wave: int = int(GameState.elapsed / WAVE_DURATION) + 1
	if wave != GameState.wave:
		GameState.wave = wave
		var cam := player.get_node_or_null("Camera2D") as ScreenShake
		if cam != null:
			cam.shake(0.5, 7.0)  # 波次推进的仪式感震动


func _on_enemy_spawn_tick() -> void:
	if GameState.is_game_over or not is_instance_valid(player):
		return
	spawn_enemy(_pick_enemy_scene())
	# 波次越高，生成越快
	var accel: float = clampf(1.0 + 0.09 * (GameState.wave - 1), 1.0, 3.2)
	enemy_timer.wait_time = 1.5 / accel


func _pick_enemy_scene() -> PackedScene:
	# 敌种混合随波次解锁：1 波只有追击者；2 波起混入冲刺者；3 波起混入远程
	var roll := randf()
	if GameState.wave >= 3 and roll < 0.22:
		return ShooterScene
	if GameState.wave >= 2 and roll < 0.45:
		return DasherScene
	return EnemyScene


func spawn_enemy(scene: PackedScene) -> void:
	if GameState.is_game_over or not is_instance_valid(player):
		return
	var enemy := scene.instantiate()
	enemy.position = _find_free_spawn(player.position)
	enemy.target = player
	enemy.scale_difficulty(GameState.wave)
	world.add_child(enemy)


## 在玩家周围找一个不与装饰物重叠的落点，避免敌人卡在石头里出生。
func _find_free_spawn(center: Vector2) -> Vector2:
	for _attempt in 8:
		var angle := randf() * TAU
		var dist := 260.0 + randf() * 140.0
		var p := center + Vector2(cos(angle), sin(angle)) * dist
		if not _is_blocked(p):
			return p
	return center + Vector2(cos(randf() * TAU), sin(randf() * TAU)) * 300.0


func _is_blocked(at: Vector2) -> bool:
	for b in ObstacleField.query(at, 32.0):
		var r: float = b.get_meta("obstacle_radius", 6.0)
		if b.global_position.distance_to(at) < r + 10.0:
			return true
	return false


func spawn_gem() -> void:
	if GameState.is_game_over or not is_instance_valid(player):
		return
	drop_gem(player.position + Vector2(randf_range(-80.0, 80.0), randf_range(-80.0, 80.0)))


func drop_gem(at_position: Vector2) -> void:
	if GameState.is_game_over or not is_instance_valid(player):
		return
	var gem := XPGemScene.instantiate()
	gem.position = at_position
	gem.target = player
	gem.magnet_range = player.magnet_range
	world.add_child(gem)


func _on_upgrades_pending(count: int) -> void:
	if count > 0 and not GameState.is_game_over:
		_show_upgrade_panel()


func _show_upgrade_panel() -> void:
	if _upgrade_panel != null:
		return
	get_tree().paused = true
	var panel := UpgradePanelScene.instantiate()
	panel.setup(player)
	panel.upgrade_done.connect(_on_upgrade_done)
	add_child(panel)
	_upgrade_panel = panel


func _on_upgrade_done() -> void:
	_upgrade_panel = null
	get_tree().paused = false
	if GameState.pending_upgrades > 0 and not GameState.is_game_over:
		await get_tree().create_timer(0.15).timeout
		_show_upgrade_panel()


func _on_game_over() -> void:
	# 收起可能开着的升级面板，稍候弹出结算
	if _upgrade_panel != null:
		_upgrade_panel.queue_free()
		_upgrade_panel = null
	get_tree().paused = false
	await get_tree().create_timer(0.7).timeout
	if not is_inside_tree():
		return
	add_child(GameOverScreenScene.instantiate())
