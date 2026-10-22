extends Node
## 碰撞审计：实测运行时各类碰撞的真实表现，输出量化诊断报告。
## 用法：godot --headless --path . res://scenes/test/collision_audit.tscn

const PlayerScene := preload("res://scenes/player/player.tscn")
const EnemyScene := preload("res://scenes/enemies/enemy.tscn")
const BackgroundScene := preload("res://scenes/world/background.tscn")
const ProjectileScene := preload("res://scenes/attacks/projectile.tscn")
const EnemyBulletScene := preload("res://scenes/attacks/enemy_bullet.tscn")

var world: Node2D
var player: CharacterBody2D
var bg: Node2D


func _ready() -> void:
	GameState.reset_state()
	world = Node2D.new()
	world.y_sort_enabled = true
	add_child(world)
	bg = BackgroundScene.instantiate()
	world.add_child(bg)
	player = PlayerScene.instantiate()
	world.add_child(player)
	bg.follow_target = player
	await _run_audit()
	get_tree().quit()


func _frames(n: int) -> void:
	for _i in n:
		await get_tree().process_frame
		await get_tree().physics_frame


func _run_audit() -> void:
	await _frames(6)
	var obstacles := get_tree().get_nodes_in_group("obstacles")
	print("视口: ", get_viewport().get_visible_rect().size, " / 障碍总数: ", obstacles.size())

	# --- 1. 玩家远行后，新格子的障碍是否会生成在玩家身上 ---
	player.position = Vector2(1600.0, 900.0)
	await _frames(4)
	var stuck := false
	for o in get_tree().get_nodes_in_group("obstacles"):
		if o.global_position.distance_to(player.global_position) < 14.0:
			stuck = true
			break
	print("[1] 障碍生成压在玩家身上: ", "是(卡死风险)" if stuck else "否")

	# --- 2. 敌人是否互相重叠（无软分离时一堆敌人会叠成一个点） ---
	var pack: Array[Node2D] = []
	for i in 8:
		var e := EnemyScene.instantiate()
		e.position = Vector2(400.0 + randf() * 20.0, 300.0 + randf() * 20.0)
		e.target = player
		world.add_child(e)
		pack.append(e)
	var anchor := Vector2(400.0, 300.0)
	for e in pack:
		e.target = null
		e.position = anchor + Vector2(randf_range(-6.0, 6.0), randf_range(-6.0, 6.0))
	# 让它们原地挤 1.5 秒（无外力）
	for _i in 90:
		for e in pack:
			e.velocity = Vector2.ZERO
		await get_tree().physics_frame
	var min_dist := 9999.0
	for i in pack.size():
		for j in range(i + 1, pack.size()):
			min_dist = minf(min_dist, pack[i].global_position.distance_to(pack[j].global_position))
	print("[2] 敌人最小间距(理想>16): ", snappedf(min_dist, 0.01), " -> ", "重叠堆叠" if min_dist < 10.0 else "有分离")
	for e in pack:
		e.queue_free()
	await _frames(3)

	# --- 3. 玩家能否被障碍挡住（用真实按键驱动，避免被 _physics_process 覆盖速度） ---
	var obs := _nearest_obstacle(player.global_position)
	if obs != null:
		# 站到障碍正右方，按住"左"持续顶过去
		player.position = obs.global_position + Vector2(40.0, 0.0)
		await _frames(2)
		var before := player.global_position.distance_to(obs.global_position)
		Input.action_press("ui_left")
		await _frames(70)
		Input.action_release("ui_left")
		var after := player.global_position.distance_to(obs.global_position)
		print("[3] 玩家撞障碍: 距离 ", snappedf(before, 0.1), " -> ", snappedf(after, 0.1),
			" -> ", "被挡住" if after > 6.0 else "穿过去了")
	else:
		print("[3] 附近无障碍，跳过")

	# --- 3b. 玩家从各方向顶障碍（检测是否能从缝隙挤过去） ---
	obs = _nearest_obstacle(player.global_position)
	if obs != null:
		var passed := 0
		for dir_name in ["ui_left", "ui_right", "ui_up", "ui_down"]:
			player.position = obs.global_position - _key_dir(dir_name) * 40.0
			await _frames(2)
			Input.action_press(dir_name)
			await _frames(50)
			Input.action_release(dir_name)
			if player.global_position.distance_to(obs.global_position) < 3.0:
				passed += 1
		print("[3b] 四方向顶障碍后到达中心(<3)的次数: ", passed, "/4 -> ", "有穿透" if passed > 0 else "全向阻挡正常")
	else:
		print("[3b] 附近无障碍，跳过")

	# --- 4. 玩家弹丸打在障碍上是否湮灭 ---
	obs = _nearest_obstacle(player.global_position)
	if obs != null:
		var p := ProjectileScene.instantiate()
		p.position = obs.global_position + Vector2(60.0, 0.0)
		p.direction = Vector2.LEFT
		p.damage = 10
		world.add_child(p)
		await _frames(30)
		print("[4] 玩家弹丸撞障碍: ", "湮灭(正确)" if not is_instance_valid(p) else "穿过去了(错误)")
	else:
		print("[4] 附近无障碍，跳过")

	# --- 5. 敌弹撞障碍 ---
	obs = _nearest_obstacle(player.global_position)
	if obs != null:
		var b := EnemyBulletScene.instantiate()
		b.position = obs.global_position + Vector2(60.0, 0.0)
		b.direction = Vector2.LEFT
		world.add_child(b)
		await _frames(40)
		print("[5] 敌弹撞障碍: ", "湮灭(正确)" if not is_instance_valid(b) else "穿过去了(错误)")
	else:
		print("[5] 附近无障碍，跳过")

	# --- 6. 装饰物里非实体的是否真的不挡路（应当不挡） ---
	var decor_blocking := 0
	for c in bg.get_node("Props").get_children():
		if c.global_position.distance_to(player.global_position) < 40.0:
			decor_blocking += 1
	print("[6] 玩家 40 单位内贴地装饰数: ", decor_blocking, "（装饰不应阻挡）")

	# --- 7. 压力：大量敌人时软分离的计算开销 ---
	var crowd: Array = []
	for i in 140:
		var e := EnemyScene.instantiate()
		e.hp = 99999
		e.position = player.global_position + Vector2(randf_range(-170.0, 170.0), randf_range(-170.0, 170.0))
		e.target = player
		world.add_child(e)
		crowd.append(e)
	await _frames(2)
	var t0 := Time.get_ticks_usec()
	for _r in 60:
		for e in crowd:
			e._separation_push()
	var cost := (Time.get_ticks_usec() - t0) / 1000.0
	print("[7] 140 敌人分离计算 x60: ", snappedf(cost, 0.1), " ms -> 单帧全场 ",
		snappedf(cost / 60.0, 0.01), " ms")

	print("=== 审计结束 ===")


func _key_dir(action: String) -> Vector2:
	match action:
		"ui_left":
			return Vector2.LEFT
		"ui_right":
			return Vector2.RIGHT
		"ui_up":
			return Vector2.UP
	return Vector2.DOWN


func _nearest_obstacle(at: Vector2) -> Node2D:
	var best: Node2D = null
	var best_d := 999999.0
	for o in get_tree().get_nodes_in_group("obstacles"):
		var d: float = o.global_position.distance_to(at)
		if d < best_d:
			best_d = d
			best = o
	return best
