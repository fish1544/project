extends CharacterBody2D

const XPGemScene := preload("res://scenes/pickups/xp_gem.tscn")

@export var chase_speed := 60.0
@export var hp := 20

var target: Node2D


func _ready() -> void:
	add_to_group("enemies")


func _physics_process(delta: float) -> void:
	if is_instance_valid(target):
		var to_target: Vector2 = target.global_position - global_position
		if to_target.length() > 2.0:
			velocity = to_target.normalized() * chase_speed
		else:
			velocity = Vector2.ZERO
	move_and_slide()


func take_damage(amount: int) -> void:
	hp -= amount
	if hp <= 0:
		GameState.add_kill()
		call_deferred("_drop_loot")


func _drop_loot() -> void:
	var gem := XPGemScene.instantiate()
	gem.position = global_position
	gem.target = target
	get_parent().add_child(gem)
	queue_free()
