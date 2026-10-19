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

	# 主菜单可加载
	var menu = load("res://scenes/ui/main_menu.tscn").instantiate()
	get_tree().root.add_child.call_deferred(menu)
	await _frames(4)
	check(is_instance_valid(menu), "主菜单场景可加载")
	menu.queue_free()
	await _frames(2)

	# 生命归零游戏结束（放最后：结算面板会暂停世界）
	GameState.reset_state()
	GameState.damage(999)
	check(GameState.hp == 0 and GameState.is_game_over, "生命归零游戏结束")

	if failures.is_empty():
		print("RESULT: ALL %d CHECKS PASSED" % total)
		get_tree().quit(0)
	else:
		printerr("RESULT: %d / %d CHECKS FAILED" % [failures.size(), total])
		get_tree().quit(1)
