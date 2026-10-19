extends Area2D

const HitSparkScene := preload("res://scenes/fx/hit_spark.tscn")
const DamageNumberScene := preload("res://scenes/fx/damage_number.tscn")

@export var speed := 320.0
@export var damage := 10

var direction := Vector2.RIGHT


func _physics_process(delta: float) -> void:
	position += direction * speed * delta


func _on_body_entered(body: Node) -> void:
	if body.is_in_group("enemies"):
		body.take_damage(damage, direction)
		call_deferred("_spawn_fx_and_free")


func _spawn_fx_and_free() -> void:
	var parent := get_parent()
	if parent == null:
		return
	var spark := HitSparkScene.instantiate()
	spark.position = global_position
	parent.add_child(spark)
	var num := DamageNumberScene.instantiate()
	num.setup(global_position, damage)
	parent.add_child(num)
	queue_free()
