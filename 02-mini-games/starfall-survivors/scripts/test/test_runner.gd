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
	GameState.damage(999)
	check(GameState.hp == 0 and GameState.is_game_over, "生命归零游戏结束")

	if failures.is_empty():
		print("RESULT: ALL %d CHECKS PASSED" % total)
		get_tree().quit(0)
	else:
		printerr("RESULT: %d / %d CHECKS FAILED" % [failures.size(), total])
		get_tree().quit(1)
