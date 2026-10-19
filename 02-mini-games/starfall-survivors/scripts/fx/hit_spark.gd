extends Node2D
## 命中火花：命中点为中心的 6 枚金色小粒子，向外散射并淡出，0.3s 自毁。
## 在场景中以 global_position 定位后加入世界树即可。

const PARTICLE_TEX := preload("res://assets/sprites/projectile.png")
const COUNT := 6


func _ready() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for i in COUNT:
		var p := Sprite2D.new()
		p.texture = PARTICLE_TEX
		p.scale = Vector2(0.6, 0.6) * rng.randf_range(0.7, 1.3)
		p.modulate = Color(1.0, rng.randf_range(0.75, 1.0), 0.3)
		add_child(p)
		var ang: float = rng.randf() * TAU
		var dist: float = rng.randf_range(8.0, 22.0)
		var tw := create_tween()
		tw.set_parallel(true)
		tw.tween_property(p, "position", Vector2(cos(ang), sin(ang)) * dist, 0.28).set_ease(Tween.EASE_OUT)
		tw.tween_property(p, "modulate:a", 0.0, 0.28)
	var free_tw := create_tween()
	free_tw.tween_interval(0.32)
	free_tw.tween_callback(queue_free)
