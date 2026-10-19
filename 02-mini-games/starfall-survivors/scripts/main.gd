extends Node2D

const PlayerScene := preload("res://scenes/player/player.tscn")
const EnemyScene := preload("res://scenes/enemies/enemy.tscn")
const XPGemScene := preload("res://scenes/pickups/xp_gem.tscn")
const HUDScene := preload("res://scenes/ui/hud.tscn")

var world: Node2D
var player: CharacterBody2D


func _ready() -> void:
	randomize()
	GameState.reset_state()
	world = Node2D.new()
	world.name = "World"
	add_child(world)
	player = PlayerScene.instantiate()
	world.add_child(player)
	var camera := Camera2D.new()
	camera.zoom = Vector2(2.5, 2.5)
	player.add_child(camera)
	add_child(HUDScene.instantiate())
	var enemy_timer := Timer.new()
	enemy_timer.wait_time = 1.5
	enemy_timer.timeout.connect(spawn_enemy)
	add_child(enemy_timer)
	enemy_timer.start()
	var gem_timer := Timer.new()
	gem_timer.wait_time = 3.0
	gem_timer.timeout.connect(spawn_gem)
	add_child(gem_timer)
	gem_timer.start()


func spawn_enemy() -> void:
	if GameState.is_game_over or not is_instance_valid(player):
		return
	var enemy := EnemyScene.instantiate()
	var angle := randf() * TAU
	var dist := 260.0 + randf() * 140.0
	enemy.position = player.position + Vector2(cos(angle), sin(angle)) * dist
	enemy.target = player
	world.add_child(enemy)


func spawn_gem() -> void:
	if GameState.is_game_over or not is_instance_valid(player):
		return
	drop_gem(player.position + Vector2(randf_range(-80.0, 80.0), randf_range(-80.0, 80.0)))


func drop_gem(at_position: Vector2) -> void:
	var gem := XPGemScene.instantiate()
	gem.position = at_position
	gem.target = player
	world.add_child(gem)
