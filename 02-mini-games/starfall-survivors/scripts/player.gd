extends CharacterBody2D

const ProjectileScene := preload("res://scenes/attacks/projectile.tscn")

@export var speed := 140.0
@export var shoot_interval := 1.2
@export var shoot_range := 380.0

var invulnerable := 0.0
var shoot_cooldown := 0.0


func _ready() -> void:
	add_to_group("player")
	$Hurtbox.body_entered.connect(_on_hurtbox_body_entered)


func _physics_process(delta: float) -> void:
	var dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	velocity = dir * speed
	move_and_slide()
	invulnerable = maxf(0.0, invulnerable - delta)
	shoot_cooldown -= delta
	if shoot_cooldown <= 0.0:
		var target := find_nearest_enemy()
		if target != null:
			shoot_cooldown = shoot_interval
			var projectile := ProjectileScene.instantiate()
			projectile.position = global_position
			projectile.direction = (target.global_position - global_position).normalized()
			get_parent().add_child(projectile)


func find_nearest_enemy() -> Node2D:
	var nearest: Node2D = null
	var best := shoot_range
	for enemy in get_tree().get_nodes_in_group("enemies"):
		if not is_instance_valid(enemy):
			continue
		var d := global_position.distance_to(enemy.global_position)
		if d < best:
			best = d
			nearest = enemy
	return nearest


func _on_hurtbox_body_entered(body: Node) -> void:
	if body.is_in_group("enemies"):
		handle_hit(10)


func handle_hit(amount: int) -> void:
	if invulnerable > 0.0 or GameState.is_game_over:
		return
	invulnerable = 0.6
	GameState.damage(amount)
