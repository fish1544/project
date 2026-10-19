extends Area2D

@export var magnet_range := 140.0
@export var magnet_speed := 260.0

var target: Node2D


func _ready() -> void:
	add_to_group("gems")


func _physics_process(delta: float) -> void:
	if is_instance_valid(target):
		var dir: Vector2 = target.global_position - global_position
		if dir.length() <= magnet_range:
			position += dir.normalized() * magnet_speed * delta


func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		GameState.add_xp(1)
		call_deferred("queue_free")
