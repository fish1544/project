class_name ObstacleField
extends RefCounted
## 静态障碍空间索引。
##
## 障碍由 background.gd 动态生成/回收，玩家与敌人需要快速查询"我附近有哪些石头"，
## 用空间网格把查询从"遍历全部障碍"降到"只看邻近 9 格"，保证同屏上百实体也不掉帧。
##
## 提供两类能力：
##   has_room_at() —— 生成障碍前判断该点是否会压住角色（避免把玩家/敌人卡死在石头里）
##   push_out()    —— 万一角色已经嵌入障碍，沿最短方向推出去（兜底脱困）

const CELL := 64.0

static var _grid: Dictionary = {}   # Vector2i -> Array[Node2D]


static func key(at: Vector2) -> Vector2i:
	return Vector2i(int(floor(at.x / CELL)), int(floor(at.y / CELL)))


static func register(body: Node2D, radius: float) -> void:
	body.set_meta("obstacle_radius", radius)
	var k := key(body.global_position)
	body.set_meta("obstacle_cell", k)
	if not _grid.has(k):
		_grid[k] = []
	var arr: Array = _grid[k]
	arr.append(body)


static func unregister(body: Node2D) -> void:
	if not is_instance_valid(body) or not body.has_meta("obstacle_cell"):
		return
	var k: Vector2i = body.get_meta("obstacle_cell")
	var arr = _grid.get(k)
	if arr != null:
		arr.erase(body)
		if arr.is_empty():
			_grid.erase(k)
	body.remove_meta("obstacle_cell")


static func query(at: Vector2, radius: float) -> Array:
	var out: Array = []
	var span: int = int(ceil(radius / CELL))
	var k0 := key(at)
	for gx in range(k0.x - span, k0.x + span + 1):
		for gy in range(k0.y - span, k0.y + span + 1):
			var bucket = _grid.get(Vector2i(gx, gy))
			if bucket == null:
				continue
			for b in bucket:
				if is_instance_valid(b):
					out.append(b)
	return out


## 该点是否空得下（不与任何角色重叠）。生成障碍前调用。
static func has_room_at(at: Vector2, radius: float) -> bool:
	var need := radius + 9.0
	for group in ["player", "enemies"]:
		for n in Engine.get_main_loop().root.get_tree().get_nodes_in_group(group):
			if is_instance_valid(n) and n.global_position.distance_to(at) < need:
				return false
	for b in query(at, radius + 12.0):
		var r: float = b.get_meta("obstacle_radius", 6.0)
		if b.global_position.distance_to(at) < r + radius:
			return false
	return true


## 把嵌入障碍的角色推出来；返回是否发生了推移。
static func push_out(body: Node2D, body_radius: float) -> bool:
	var p := body.global_position
	var moved := false
	# 两遍迭代：夹在两个石头之间时，第一遍推出后可能又嵌入另一个
	for _pass in 2:
		var hit := false
		for b in query(p, body_radius + 16.0):
			var r: float = b.get_meta("obstacle_radius", 6.0)
			var center: Vector2 = b.global_position
			var d: Vector2 = p - center
			var dist: float = d.length()
			var min_d := r + body_radius
			if dist < min_d:
				if dist < 0.001:
					d = Vector2.RIGHT
				else:
					d /= dist
				p = b.global_position + d * (min_d + 0.5)
				hit = true
				moved = true
		if not hit:
			break
	if moved:
		body.global_position = p
	return moved
