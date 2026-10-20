extends Node2D
## 世界背景与场景装饰系统（无限世界，恒定开销）。
##
## 四层结构：
##   Ground    —— AI 生成的荒原地面大图，开启 repeat 后按镜头位置无缝平铺
##   Props     —— 贴地装饰（枯草 / 撞击坑），不参与碰撞
##   Obstacles —— 实体装饰（岩石 / 星陨晶体 / 远古石柱），StaticBody2D 参与碰撞，
##                直接挂到宿主节点（world）以便与玩家/敌人一起按 y 排序遮挡
##   Motes     —— 漂浮星尘，0.55 视差营造空气层次
##
## 用法：实例化后把 follow_target 指向玩家节点即可。

const CELL_SIZE := 104.0        # 装饰物网格边长（世界单位）
const KEEP_CELLS := 2           # 视野外多保留几格，避免边缘穿帮
const FALLBACK_VIEW := Vector2(384.0, 216.0)
const SPAWN_CLEAR_RADIUS := 78.0  # 出生点附近不放实体障碍，避免开局被卡
const OBSTACLE_LAYER := 16        # 障碍专用碰撞层

const TEX_ROCK := preload("res://assets/sprites/prop_rock.png")
const TEX_CRYSTAL := preload("res://assets/sprites/prop_crystal.png")
const TEX_PILLAR := preload("res://assets/sprites/prop_pillar.png")
const TEX_GRASS := preload("res://assets/sprites/prop_grass.png")
const TEX_CRATER := preload("res://assets/sprites/prop_crater.png")
const MOTE_TEXTURE := preload("res://assets/backgrounds/mote.png")

# 加权抽取表：[贴图, 是否实体, 碰撞半径]，重复次数即权重
const SPAWN_TABLE := [
	[TEX_ROCK, true, 6.5],
	[TEX_ROCK, true, 6.5],
	[TEX_ROCK, true, 6.5],
	[TEX_CRYSTAL, true, 5.0],
	[TEX_CRYSTAL, true, 5.0],
	[TEX_PILLAR, true, 6.0],
	[TEX_PILLAR, true, 6.0],
	[TEX_GRASS, false, 0.0],
	[TEX_GRASS, false, 0.0],
	[TEX_GRASS, false, 0.0],
	[TEX_CRATER, false, 0.0],
	[TEX_CRATER, false, 0.0],
]

@export var motes_count := 34
@export var motes_parallax := 0.55

var follow_target: Node2D

var _props := {}
var _motes: Array[Sprite2D] = []
var _view_size := FALLBACK_VIEW
var _mote_box := FALLBACK_VIEW * 1.3
var _host: Node2D      # 实体障碍的宿主（应为 world，使其参与 y 排序）


func _ready() -> void:
	# 整个背景层永远压在最底，避免 y 排序把它抬到角色前面
	z_index = -20
	_host = get_parent() as Node2D
	if _host == null:
		_host = self
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


func _cell_center(cell: Vector2i) -> Vector2:
	return (Vector2(cell) + Vector2(0.5, 0.5)) * CELL_SIZE


func _make_prop(cell: Vector2i) -> Node2D:
	# 用坐标哈希做种子：同一格永远生成同样的装饰，来回移动不会闪烁
	var rng := RandomNumberGenerator.new()
	rng.seed = absi((cell.x * 73856093) ^ (cell.y * 19349663))
	var entry: Array = SPAWN_TABLE[rng.randi() % SPAWN_TABLE.size()]
	var tex: Texture2D = entry[0]
	var solid: bool = entry[1]
	var radius: float = entry[2]
	# 出生点附近强制降级为贴地装饰，保证开局不被石头围住
	if solid and _cell_center(cell).length() < SPAWN_CLEAR_RADIUS:
		solid = false
	var scale_f: float = rng.randf_range(0.82, 1.22)
	var pos := _cell_center(cell) + Vector2(rng.randf_range(-18.0, 18.0), rng.randf_range(-18.0, 18.0))
	if solid:
		return _make_obstacle(pos, tex, radius * scale_f, scale_f, rng)
	return _make_decor(pos, tex, scale_f, rng)


func _make_obstacle(pos: Vector2, tex: Texture2D, radius: float, scale_f: float, rng: RandomNumberGenerator) -> StaticBody2D:
	var body := StaticBody2D.new()
	body.position = pos
	body.collision_layer = OBSTACLE_LAYER
	body.collision_mask = 0
	body.add_to_group("obstacles")

	var shape := CircleShape2D.new()
	shape.radius = radius
	var cs := CollisionShape2D.new()
	cs.shape = shape
	body.add_child(cs)

	var spr := Sprite2D.new()
	spr.texture = tex
	spr.position = Vector2(0.0, -4.0)   # 视觉略抬高，碰撞体留在“脚部”
	spr.scale = Vector2.ONE * scale_f
	spr.modulate = Color(1.0, 1.0, 1.0, rng.randf_range(0.82, 1.0))
	body.add_child(spr)

	_host.add_child(body)
	return body


func _make_decor(pos: Vector2, tex: Texture2D, scale_f: float, rng: RandomNumberGenerator) -> Sprite2D:
	var spr := Sprite2D.new()
	spr.texture = tex
	spr.position = pos
	spr.scale = Vector2.ONE * scale_f
	if tex == TEX_CRATER:
		spr.scale = Vector2.ONE * rng.randf_range(1.4, 2.4)
		spr.modulate = Color(1.0, 1.0, 1.0, rng.randf_range(0.35, 0.6))
		spr.rotation = rng.randf() * TAU
	else:
		spr.modulate = Color(1.0, 1.0, 1.0, rng.randf_range(0.7, 1.0))
	$Props.add_child(spr)
	return spr


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
