extends Node2D
## 世界背景与场景装饰系统（无限世界，恒定开销）。
##
## 三层结构：
##   Ground —— AI 生成的荒原地面大图，开启 repeat 后按镜头位置无缝平铺
##   Props  —— 岩石 / 星陨晶体 / 枯草 / 远古石柱 / 撞击坑，按网格动态回收
##   Motes  —— 漂浮星尘，0.55 视差营造空气层次
##
## 用法：实例化后把 follow_target 指向玩家节点即可。

const CELL_SIZE := 104.0        # 装饰物网格边长（世界单位）
const KEEP_CELLS := 2           # 视野外多保留几格，避免边缘穿帮
const FALLBACK_VIEW := Vector2(384.0, 216.0)

# 加权抽取：数组重复次数即权重
const PROP_TEXTURES: Array[Texture2D] = [
	preload("res://assets/sprites/prop_rock.png"),
	preload("res://assets/sprites/prop_rock.png"),
	preload("res://assets/sprites/prop_rock.png"),
	preload("res://assets/sprites/prop_grass.png"),
	preload("res://assets/sprites/prop_grass.png"),
	preload("res://assets/sprites/prop_grass.png"),
	preload("res://assets/sprites/prop_crystal.png"),
	preload("res://assets/sprites/prop_crystal.png"),
	preload("res://assets/sprites/prop_pillar.png"),
	preload("res://assets/sprites/prop_pillar.png"),
	preload("res://assets/sprites/prop_crater.png"),
	preload("res://assets/sprites/prop_crater.png"),
]
const CRATER_TEXTURE := preload("res://assets/sprites/prop_crater.png")
const MOTE_TEXTURE := preload("res://assets/backgrounds/mote.png")

@export var motes_count := 34
@export var motes_parallax := 0.55

var follow_target: Node2D

var _props := {}
var _motes: Array[Sprite2D] = []
var _view_size := FALLBACK_VIEW
var _mote_box := FALLBACK_VIEW * 1.3


func _ready() -> void:
	_refresh_view_size()
	if _motes.is_empty():
		_spawn_motes()


func _process(delta: float) -> void:
	if not is_instance_valid(follow_target):
		return
	var cam := follow_target.global_position
	_refresh_view_size()
	$Ground.position = cam
	_update_props(cam)
	_update_motes(cam, delta)


func _refresh_view_size() -> void:
	var zoom := 1.0
	if is_instance_valid(follow_target):
		var cam := follow_target.get_node_or_null("Camera2D") as Camera2D
		if cam != null:
			zoom = maxf(cam.zoom.x, 0.01)
	var size := get_viewport_rect().size / zoom
	if size.x > 1.0 and size.y > 1.0:
		_view_size = size
		_mote_box = _view_size * 1.3


func _update_props(cam: Vector2) -> void:
	var half := Vector2i(
		int(_view_size.x * 0.5 / CELL_SIZE) + KEEP_CELLS,
		int(_view_size.y * 0.5 / CELL_SIZE) + KEEP_CELLS
	)
	var origin := Vector2i(int(floor(cam.x / CELL_SIZE)), int(floor(cam.y / CELL_SIZE)))
	var needed := {}
	for gx in range(origin.x - half.x, origin.x + half.x + 1):
		for gy in range(origin.y - half.y, origin.y + half.y + 1):
			var cell := Vector2i(gx, gy)
			needed[cell] = true
			if not _props.has(cell):
				_props[cell] = _make_prop(cell)
	for cell in _props.keys():
		if not needed.has(cell):
			var node: Node2D = _props[cell]
			_props.erase(cell)
			if is_instance_valid(node):
				node.queue_free()


func _make_prop(cell: Vector2i) -> Sprite2D:
	# 用坐标哈希做种子：同一格永远生成同样的装饰，来回移动不会闪烁
	var rng := RandomNumberGenerator.new()
	rng.seed = absi((cell.x * 73856093) ^ (cell.y * 19349663))
	var sprite := Sprite2D.new()
	sprite.texture = PROP_TEXTURES[rng.randi() % PROP_TEXTURES.size()]
	sprite.position = (Vector2(cell) + Vector2(rng.randf(), rng.randf())) * CELL_SIZE
	if sprite.texture == CRATER_TEXTURE:
		sprite.z_index = -1          # 坑痕压在地面之上、其他装饰之下
		sprite.scale = Vector2.ONE * rng.randf_range(1.4, 2.4)
		sprite.modulate = Color(1.0, 1.0, 1.0, rng.randf_range(0.35, 0.6))
		sprite.rotation = rng.randf() * TAU
	else:
		sprite.scale = Vector2.ONE * rng.randf_range(0.8, 1.25)
		sprite.modulate = Color(1.0, 1.0, 1.0, rng.randf_range(0.7, 1.0))
	$Props.add_child(sprite)
	return sprite


func _spawn_motes() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for _i in motes_count:
		var mote := Sprite2D.new()
		mote.texture = MOTE_TEXTURE
		mote.position = Vector2(
			rng.randf_range(-_mote_box.x, _mote_box.x),
			rng.randf_range(-_mote_box.y, _mote_box.y)
		) * 0.5
		mote.scale = Vector2.ONE * rng.randf_range(0.25, 0.62)
		mote.modulate = Color(0.78, 0.88, 1.0, rng.randf_range(0.16, 0.46))
		mote.set_meta("v", Vector2(rng.randf_range(-7.0, 7.0), rng.randf_range(-10.0, -2.0)))
		$Motes.add_child(mote)
		_motes.append(mote)


func _update_motes(cam: Vector2, delta: float) -> void:
	# 视差：容器只跟随 (1 - p) 的镜头位移，星尘看起来比世界“远”
	$Motes.position = cam * (1.0 - motes_parallax)
	var center := cam * motes_parallax
	var half := _mote_box * 0.5
	for mote in _motes:
		var p: Vector2 = mote.position + mote.get_meta("v") * delta
		if p.x - center.x > half.x:
			p.x -= _mote_box.x
		elif p.x - center.x < -half.x:
			p.x += _mote_box.x
		if p.y - center.y > half.y:
			p.y -= _mote_box.y
		elif p.y - center.y < -half.y:
			p.y += _mote_box.y
		mote.position = p
