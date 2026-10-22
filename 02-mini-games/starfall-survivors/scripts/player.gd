extends CharacterBody2D

const ProjectileScene := preload("res://scenes/attacks/projectile.tscn")

@export var speed := 140.0
@export var shoot_interval := 1.2
@export var shoot_range := 380.0
@export var damage := 10
@export var projectiles_per_shot := 1
@export var magnet_range := 140.0

var invulnerable := 0.0
var shoot_cooldown := 0.0
var damage_multiplier := 1.0
var atk_speed_multiplier := 1.0


func apply_upgrade(id: String) -> void:
	match id:
		"rapid_fire":
			atk_speed_multiplier *= 1.2
		"power_shot":
			damage_multiplier *= 1.25
		"swift_step":
			speed *= 1.12
		"multishot":
			projectiles_per_shot += 1
		"vitality":
			GameState.max_hp += 20
			GameState.heal(20)
		"magnetism":
			magnet_range *= 1.4
		"keen_eye":
			shoot_range *= 1.15


func _ready() -> void:
	add_to_group("player")
	$Hurtbox.body_entered.connect(_on_hurtbox_body_entered)


func _physics_process(delta: float) -> void:
	var dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	velocity = dir * speed
	move_and_slide()
	# 兜底：万一被新生成的石头或尸潮挤进碰撞体内部，自动脱困
	ObstacleField.push_out(self, 6.5)
	invulnerable = maxf(0.0, invulnerable - delta)
	shoot_cooldown -= delta
	if shoot_cooldown <= 0.0:
		var target := find_nearest_enemy()
		if target != null:
			shoot_cooldown = shoot_interval / atk_speed_multiplier
			shoot_at(target)


func shoot_at(target: Node2D) -> void:
	var base_dir: Vector2 = (target.global_position - global_position).normalized()
	var per_damage: int = maxi(1, int(round(damage * damage_multiplier / float(projectiles_per_shot))))
	var spread := 0.16  # 多弹丸扇形展开弧度
	var n := projectiles_per_shot
	for i in n:
		var dir := base_dir.rotated(spread * (i - (n - 1) / 2.0))
		var projectile := ProjectileScene.instantiate()
		projectile.position = global_position
		projectile.direction = dir
		projectile.damage = per_damage
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
	elif body.is_in_group("enemy_bullets"):
		handle_hit(int(body.get("damage")))
		body.call_deferred("queue_free")


func handle_hit(amount: int) -> void:
	if invulnerable > 0.0 or GameState.is_game_over:
		return
	invulnerable = 0.6
	GameState.damage(amount)
	GameState.player_hurt.emit()
	var spr := $Sprite2D
	if spr != null:
		var tw := create_tween()
		spr.self_modulate = Color(4.0, 4.0, 4.0, 1.0)
		tw.tween_property(spr, "self_modulate", Color(1, 1, 1), 0.14)
	var cam := get_node_or_null("Camera2D") as ScreenShake
	if cam != null:
		cam.shake(0.4, 10.0)
