extends Node2D
## 死亡爆裂：敌人碎片四散（12 枚 + 1 枚中心闪光），0.55s 自毁。

const FRAG_TEX := preload("res://assets/sprites/enemy.png")
const COUNT := 12


func _ready() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for i in COUNT:
		var p := Sprite2D.new()
		p.texture = FRAG_TEX
		p.scale = Vector2(0.4, 0.4) * rng.randf_range(0.6, 1.4)
		add_child(p)
		var ang: float = (TAU / COUNT) * i + rng.randf_range(-0.2, 0.2)
		var dist: float = rng.randf_range(14.0, 30.0)
		var spin: float = rng.randf_range(-6.0, 6.0)
		var tw := create_tween()
		tw.set_parallel(true)
		tw.tween_property(p, "position", Vector2(cos(ang), sin(ang)) * dist, 0.5).set_ease(Tween.EASE_OUT)
		tw.tween_property(p, "modulate:a", 0.0, 0.5)
		tw.tween_property(p, "rotation", spin, 0.5)
	# 中心闪光
	var flash := Sprite2D.new()
	flash.texture = FRAG_TEX
	flash.scale = Vector2(1.6, 1.6)
	flash.modulate = Color(2.0, 2.0, 2.0, 1.0)
	add_child(flash)
	var ftw := create_tween()
	ftw.set_parallel(true)
	ftw.tween_property(flash, "scale", Vector2(0.1, 0.1), 0.18)
	ftw.tween_property(flash, "modulate:a", 0.0, 0.18)
	var free_tw := create_tween()
	free_tw.tween_interval(0.56)
	free_tw.tween_callback(queue_free)
