extends Area2D

@export var speed := 320.0
@export var damage := 10

var direction := Vector2.RIGHT


func _physics_process(delta: float) -> void:
	position += direction * speed * delta


func _on_body_entered(body: Node) -> void:
	if body.is_in_group("enemies"):
		body.take_damage(damage)
		call_deferred("queue_free")
