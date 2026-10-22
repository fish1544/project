extends Node

var failures: Array[String] = []
var total := 0


func check(condition: bool, label: String) -> void:
	total += 1
	if condition:
		print("PASS  " + label)
	else:
		failures.append(label)
		print("FAIL  " + label)


func _collect_leaf_controls(node: Node, out: Array) -> void:
	## 收集某控件下所有「叶子」控件（自身不再含子节点），用于布局重叠检测。
	for c in node.get_children():
		if c is Control and c.get_child_count() == 0:
			out.append(c)
		else:
			_collect_leaf_controls(c, out)


func _frames(n: int) -> void:
	var tree := get_tree()
	for i in n:
		await tree.physics_frame


func _ready() -> void:
	GameState.reset_state()
	var main: Node = load("res://scenes/main.tscn").instantiate()
	get_tree().root.add_child.call_deferred(main)
	await _frames(2)
	var player: CharacterBody2D = main.player
	check(player != null, "主场景实例化并生成玩家")
	await _frames(2)

	Input.action_press("ui_right")
	await _frames(6)
	check(player.position.x > 10.0, "玩家响应方向输入移动")
	Input.action_release("ui_right")

	var enemy = load("res://scenes/enemies/enemy.tscn").instantiate()
	enemy.target = player
	enemy.position = player.position
	main.world.add_child(enemy)
	await _frames(8)
	check(GameState.hp < GameState.max_hp, "敌人接触造成伤害")
	enemy.queue_free()
	await _frames(2)

	for e in get_tree().get_nodes_in_group("enemies"):
		e.queue_free()
	for g in get_tree().get_nodes_in_group("gems"):
		g.queue_free()
	await _frames(2)

	GameState.reset_state()
	var kills_reached := false
	for i in 240:
		await _frames(1)
		if GameState.kills >= 1:
			kills_reached = true
			break
	check(kills_reached, "自动攻击击杀敌人")

	var loot_enemy = load("res://scenes/enemies/enemy.tscn").instantiate()
	loot_enemy.target = player
	loot_enemy.position = player.position + Vector2(0.0, 60.0)
	main.world.add_child(loot_enemy)
	await _frames(2)
	loot_enemy.take_damage(999)
	await _frames(2)
	check(get_tree().get_nodes_in_group("gems").size() >= 1, "敌人死亡掉落经验宝石")

	var gems := get_tree().get_nodes_in_group("gems")
	if gems.size() > 0:
		gems[0].global_position = player.global_position
		await _frames(8)
	check(GameState.xp >= 1, "拾取宝石获得经验")

	GameState.reset_state()
	GameState.add_xp(5)
	check(GameState.level == 2, "经验满额升级")
	check(GameState.xp == 0, "升级后经验清零并进入下一级曲线")

	GameState.reset_state()
	player.handle_hit(10)
	var hp_after_first := GameState.hp
	player.handle_hit(10)
	check(GameState.hp == hp_after_first, "受击无敌帧生效")

	# ===== v0.2 新系统回归（须在触发 game_over 结算前运行，避免世界被暂停）=====
	# 防止测试期间意外升级触发三选一面板把世界暂停，导致后续 await 卡死
	GameState.reset_state()
	GameState.xp_to_next = 999999

	var picked := BuffPool.random_pick(3)
	check(picked.size() == 3, "Buff 池随机抽出 3 项")
	var picked_ids := {}
	for b in picked:
		picked_ids[b["id"]] = true
	check(picked_ids.size() == 3, "3 项 Buff 互不重复")

	var base_speed: float = player.speed
	player.apply_upgrade("swift_step")
	check(player.speed > base_speed, "疾风步 Buff 提升移速")
	player.apply_upgrade("multishot")
	check(player.projectiles_per_shot > 1, "多重射击 Buff 增加弹丸数")

	var base_max_hp: int = GameState.max_hp
	player.apply_upgrade("vitality")
	check(GameState.max_hp > base_max_hp, "坚韧体魄 Buff 提升最大生命")

	# 三选一面板：弹窗、暂停、选择恢复
	GameState.reset_state()
	GameState.xp_to_next = 5
	GameState.add_xp(5)
	check(GameState.pending_upgrades == 1, "升级产生 1 次待选强化")
	check(get_tree().paused, "待选强化时世界暂停")
	var panel: CanvasLayer = main.get_node_or_null("UpgradePanel")
	check(panel != null, "三选一面板已弹出")
	if panel != null:
		panel._finish(0)
		check(GameState.pending_upgrades == 0, "选择后消耗待选次数")
		check(not get_tree().paused, "选择后恢复游戏")

	# 冲刺者状态机
	GameState.reset_state()
	GameState.xp_to_next = 999999
	var dasher = load("res://scenes/enemies/dasher.tscn").instantiate()
	dasher.target = player
	dasher.position = player.position + Vector2(170.0, 0.0)
	main.world.add_child(dasher)
	var saw_dash_state := false
	for i in 90:
		await _frames(1)
		if not is_instance_valid(dasher):
			break
		if dasher.state != 0:  # 非 APPROACH：进入蓄力/冲刺/硬直
			saw_dash_state = true
			break
	check(saw_dash_state, "冲刺者按状态机进入蓄力/冲刺")

	# 远程者弹幕
	GameState.reset_state()
	GameState.xp_to_next = 999999
	var shooter = load("res://scenes/enemies/shooter.tscn").instantiate()
	shooter.target = player
	shooter.position = player.position + Vector2(210.0, 0.0)
	main.world.add_child(shooter)
	var saw_bullet := false
	for i in 300:
		await _frames(1)
		if get_tree().get_nodes_in_group("enemy_bullets").size() >= 1:
			saw_bullet = true
			break
	check(saw_bullet, "远程者间隔发射弹幕")

	# 难度缩放
	GameState.reset_state()
	GameState.xp_to_next = 999999
	var scaled_enemy = load("res://scenes/enemies/enemy.tscn").instantiate()
	scaled_enemy.scale_difficulty(4)
	check(scaled_enemy.hp > 20, "波次缩放提升敌人血量")

	# 特效自毁
	GameState.reset_state()
	var spark = load("res://scenes/fx/hit_spark.tscn").instantiate()
	spark.position = player.position
	main.world.add_child(spark)
	var num = load("res://scenes/fx/damage_number.tscn").instantiate()
	num.setup(player.position, 12)
	main.world.add_child(num)
	await _frames(40)
	check(not is_instance_valid(spark) and not is_instance_valid(num), "命中特效与飘字播完自毁")

	# 屏幕震动后复位
	var shake_node := ScreenShake.new()
	shake_node.shake(0.3, 10.0)
	await _frames(30)
	check(shake_node.offset == Vector2.ZERO, "屏幕震动结束后复位")
	shake_node.free()

	# ===== v0.3 场景与 UI 回归 =====
	GameState.reset_state()
	GameState.xp_to_next = 999999

	var theme_res: Theme = load("res://assets/ui/theme.tres")
	check(theme_res != null and theme_res.has_stylebox("normal", "Button"), "统一主题资源可加载")

	var bg = load("res://scenes/world/background.tscn").instantiate()
	bg.follow_target = player
	main.world.add_child(bg)
	await _frames(6)
	check(bg.get_node("Props").get_child_count() > 0, "背景装饰物按视野生成")
	check(bg.get_node("Motes").get_child_count() > 0, "漂浮星尘已生成")
	check(bg.get_node("Ground").position == player.global_position, "地面平铺跟随镜头")
	bg.queue_free()
	await _frames(2)

	# 装饰物参与碰撞：实体装饰应是 layer 16 的 StaticBody2D
	var obstacles := get_tree().get_nodes_in_group("obstacles")
	var solid_ok := false
	for o in obstacles:
		if o is StaticBody2D and o.collision_layer == 16:
			solid_ok = true
			break
	check(obstacles.size() > 0 and solid_ok, "装饰物实体参与碰撞（%d 个障碍）" % obstacles.size())

	# 玩家被装饰物挡住
	for e in get_tree().get_nodes_in_group("enemies"):
		e.queue_free()
	for b in get_tree().get_nodes_in_group("enemy_bullets"):
		b.queue_free()
	await _frames(2)
	var wall := StaticBody2D.new()
	wall.collision_layer = 16
	wall.collision_mask = 0
	wall.add_to_group("obstacles")
	var wall_shape := RectangleShape2D.new()
	wall_shape.size = Vector2(20, 160)
	var wall_cs := CollisionShape2D.new()
	wall_cs.shape = wall_shape
	wall.add_child(wall_cs)
	wall.position = player.position + Vector2(46.0, 0.0)
	main.world.add_child(wall)
	await _frames(2)
	Input.action_press("ui_right")
	await _frames(36)
	Input.action_release("ui_right")
	check(player.position.x < wall.position.x, "玩家被装饰物阻挡在墙外")
	wall.queue_free()
	await _frames(2)

	# 敌人遇障绕行，而不是顶着石头原地打滑
	var block := StaticBody2D.new()
	block.collision_layer = 16
	block.collision_mask = 0
	block.add_to_group("obstacles")
	var block_shape := CircleShape2D.new()
	block_shape.radius = 8.0
	var block_cs := CollisionShape2D.new()
	block_cs.shape = block_shape
	block.add_child(block_cs)
	block.position = player.position + Vector2(60.0, 0.0)
	main.world.add_child(block)
	var detour = load("res://scenes/enemies/enemy.tscn").instantiate()
	detour.target = player
	detour.hp = 99999
	detour.position = player.position + Vector2(120.0, 0.0)
	main.world.add_child(detour)
	var start_dist: float = detour.position.distance_to(player.position)
	var got_closer := false
	for _i in 120:
		await _frames(1)
		if not is_instance_valid(detour):
			break
		if detour.position.distance_to(player.position) < start_dist - 25.0:
			got_closer = true
			break
	check(got_closer, "敌人绕开装饰物继续逼近")
	detour.queue_free()
	block.queue_free()
	await _frames(2)

	# 尸潮软分离：一群敌人不该叠成一个点（曾因敌人之间无碰撞而完全重合）
	var pack: Array = []
	for i in 8:
		var member = load("res://scenes/enemies/enemy.tscn").instantiate()
		member.hp = 99999
		member.position = player.position + Vector2(320.0, -260.0) + Vector2(randf_range(-4.0, 4.0), randf_range(-4.0, 4.0))
		main.world.add_child(member)
		pack.append(member)
	await _frames(150)
	var min_gap := 9999.0
	for i in pack.size():
		for j in range(i + 1, pack.size()):
			if not is_instance_valid(pack[i]) or not is_instance_valid(pack[j]):
				continue
			min_gap = minf(min_gap, pack[i].global_position.distance_to(pack[j].global_position))
	check(min_gap > 10.0, "尸潮软分离：8 个敌人最小间距 %.1f" % min_gap)
	for member in pack:
		if is_instance_valid(member):
			member.queue_free()
	await _frames(3)

	# 障碍空间索引：角色所在位置不允许再生成障碍（否则石头会长在人身上）
	check(not ObstacleField.has_room_at(player.global_position, 40.0), "障碍生成避开角色所在位置")

	# 嵌入障碍后能自动脱困
	var live_obstacles := get_tree().get_nodes_in_group("obstacles")
	if live_obstacles.size() > 0:
		var host_obs: Node2D = live_obstacles[0]
		player.global_position = host_obs.global_position
		await _frames(3)
		check(player.global_position.distance_to(host_obs.global_position) > 4.0, "嵌入障碍后自动脱困")
		player.position = Vector2.ZERO
		await _frames(3)

	# 主菜单可加载
	var menu = load("res://scenes/ui/main_menu.tscn").instantiate()
	get_tree().root.add_child.call_deferred(menu)
	await _frames(4)
	check(is_instance_valid(menu), "主菜单场景可加载")
	menu.queue_free()
	await _frames(2)

	# 生命归零游戏结束
	GameState.reset_state()
	GameState.damage(999)
	check(GameState.hp == 0 and GameState.is_game_over, "生命归零游戏结束")

	# 结算界面布局：所有叶子控件不得相互重叠（曾因 PanelContainer 多子节点全被铺满而叠成一团）
	var over = load("res://scenes/ui/game_over_screen.tscn").instantiate()
	get_tree().root.add_child(over)
	await _frames(4)
	get_tree().paused = false
	var leaves: Array = []
	_collect_leaf_controls(over.get_node("PanelRoot/Panel"), leaves)
	var overlapping := false
	for i in leaves.size():
		for j in range(i + 1, leaves.size()):
			var a: Control = leaves[i]
			var b: Control = leaves[j]
			if a.size.x <= 1.0 or a.size.y <= 1.0 or b.size.x <= 1.0 or b.size.y <= 1.0:
				continue
			if a.get_global_rect().intersects(b.get_global_rect()):
				overlapping = true
				print("  overlap: %s <-> %s" % [a.get_path(), b.get_path()])
	check(leaves.size() >= 10, "结算界面控件全部就位（%d 个）" % leaves.size())
	check(not overlapping, "结算界面控件互不重叠")
	over.queue_free()
	await _frames(2)

	if failures.is_empty():
		print("RESULT: ALL %d CHECKS PASSED" % total)
		get_tree().quit(0)
	else:
		printerr("RESULT: %d / %d CHECKS FAILED" % [failures.size(), total])
		get_tree().quit(1)
