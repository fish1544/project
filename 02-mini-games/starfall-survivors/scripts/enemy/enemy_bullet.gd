extends CharacterBody2D
## 敌方能量弹：慢速飞行，命中玩家受击区块后消失，6 秒超时自毁。

@export var speed := 130.0
@export var damage := 8

var direction := Vector2.RIGHT
var _life := 0.0


func _ready() -> void:
	add_to_group("enemy_bullets")


func _physics_process(delta: float) -> void:
	velocity = direction * speed
	move_and_slide()
	# 撞上岩石/石柱就地湮灭：障碍能替玩家挡冷枪
	if get_slide_collision_count() > 0:
		queue_free()
		return
	_life += delta
	if _life > 6.0:
		queue_free()
