extends Node
## 耐久压力测试：bot 自动游玩真实主场景，持续采样并输出健康报告。
##
## 关注四件事：
##   1. 泄漏 —— 障碍/尸潮索引条目数必须与场上实体数一致（回收不彻底会越跑越多）
##   2. 性能 —— 物理帧耗时的均值与峰值，尸潮上限时是否还够 60fps
##   3. 卡死 —— 有移动意图却几乎不动的敌人占比（地形/互推导致）
##   4. 平衡 —— bot 存活到几波、等级与击杀曲线
##
## 用法：godot --headless --path . res://scenes/test/soak_test.tscn

const RUN_FRAMES := 1200
const WAVE_PUSH_FRAMES := 150     # 每 2.5 秒人为推进一波，快速覆盖高负载
const SAMPLE_FRAMES := 30         # 每 0.5 秒采样一次
const STUCK_WINDOW := 60          # 卡死判定窗口：1 秒内位移

var main: Node
var player: CharacterBody2D
var samples: Array[Dictionary] = []
var peak_enemies := 0
var peak_gems := 0
var peak_physics := 0.0
var physics_sum := 0.0
var physics_samples := 0
var stuck_hits := 0
var stuck_checks := 0
var _snapshot := {}
var _frame := 0
var _start_ms := 0
var upgrades_taken := 0


func _ready() -> void:
	# 升级面板会 get_tree().paused = true，默认继承模式下测试自己也会被冻住，
	# 必须设为 ALWAYS 才能在暂停期间继续代玩家选卡
	process_mode = Node.PROCESS_MODE_ALWAYS
	_start_ms = Time.get_ticks_msec()
	GameState.reset_state()
	main = load("res://scenes/main.tscn").instantiate()
	get_tree().root.add_child.call_deferred(main)
	await get_tree().physics_frame
	await get_tree().physics_frame
	player = main.player
	set_physics_process(true)


func _physics_process(_delta: float) -> void:
	_frame += 1
	# 升级面板会暂停世界，bot 必须代玩家选卡，否则测试会永远等下去
	if get_tree().paused:
		_auto_pick_upgrade()
	_drive_bot()
	if _frame % SAMPLE_FRAMES == 0:
		_sample()
	if _frame % WAVE_PUSH_FRAMES == 0:
		GameState.elapsed += 30.0   # 快进波次，制造后期尸潮压力
	if _frame % 120 == 0:
		print("  ...帧 %d/%d  敌人 %d  宝石 %d  障碍 %d  波次 %d  真实 %dms  物理 %.2fms" % [
			_frame, RUN_FRAMES, _count_group("enemies"), _count_group("gems"),
			_count_group("obstacles"), GameState.wave,
			Time.get_ticks_msec() - _start_ms,
			Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0
		])
		var os_ := ObstacleField.debug_stats()
		var sw_ := EnemyBase.debug_stats()
		print("      索引: 障碍格%d/体%d  尸潮格%d/体%d  弹丸%d  宝石%d" % [
			os_.cells, os_.bodies, sw_.cells, sw_.bodies,
			_count_group("projectiles"), _count_group("gems")
		])
	if _frame >= RUN_FRAMES or GameState.is_game_over:
		set_physics_process(false)
		for action in ["ui_left", "ui_right", "ui_up", "ui_down"]:
			Input.action_release(action)
		_report()
		get_tree().quit()


## bot 策略：躲开最近的敌人，顺路捡最近的宝石。
func _drive_bot() -> void:
	if not is_instance_valid(player):
		return
	var wish := Vector2.ZERO
	var nearest_enemy := _nearest_in_group("enemies")
	if nearest_enemy != null:
		var away: Vector2 = player.global_position - nearest_enemy.global_position
		var d: float = away.length()
		if d < 170.0:
			wish += away.normalized() * 1.4          # 太近：拉开
		elif d > 300.0:
			wish += -away.normalized() * 0.9         # 太远：进入射程
		else:
			# 射程内：侧向绕行，保持输出又不贴身
			wish += Vector2(-away.y, away.x).normalized() * 0.8
	var nearest_gem := _nearest_in_group("gems")
	if nearest_gem != null:
		var to_gem: Vector2 = nearest_gem.global_position - player.global_position
		if to_gem.length() < 220.0:
			wish += to_gem.normalized() * 0.7
	if wish == Vector2.ZERO:
		wish = Vector2.RIGHT.rotated(randf() * TAU)
	_set_keys(wish)


## 代玩家选一张强化卡（真实玩家不点就会一直暂停）。
func _auto_pick_upgrade() -> void:
	var panel := main.get_node_or_null("UpgradePanel")
	if panel != null and panel.has_method("_finish"):
		upgrades_taken += 1
		panel._finish(randi() % 3)


func _set_keys(dir: Vector2) -> void:
	for action in ["ui_left", "ui_right", "ui_up", "ui_down"]:
		Input.action_release(action)
	if dir.x < -0.25:
		Input.action_press("ui_left")
	elif dir.x > 0.25:
		Input.action_press("ui_right")
	if dir.y < -0.25:
		Input.action_press("ui_up")
	elif dir.y > 0.25:
		Input.action_press("ui_down")


func _nearest_in_group(group: String) -> Node2D:
	var best: Node2D = null
	var best_d := 999999.0
	for n in get_tree().get_nodes_in_group(group):
		if not is_instance_valid(n):
			continue
		var d: float = player.global_position.distance_squared_to(n.global_position)
		if d < best_d:
			best_d = d
			best = n
	return best


func _sample() -> void:
	var enemies := _count_group("enemies")
	var gems := _count_group("gems")
	var obstacles := _count_group("obstacles")
	var obs_stats := ObstacleField.debug_stats()
	var swarm_stats := EnemyBase.debug_stats()
	var phys: float = Performance.get_monitor(Performance.TIME_PHYSICS_PROCESS) * 1000.0
	peak_enemies = maxi(peak_enemies, enemies)
	peak_gems = maxi(peak_gems, gems)
	peak_physics = maxf(peak_physics, phys)
	physics_sum += phys
	physics_samples += 1
	samples.append({
		"frame": _frame, "enemies": enemies, "gems": gems,
		"obstacles": obstacles, "obs_index": obs_stats.bodies,
		"swarm_index": swarm_stats.bodies, "phys": phys,
	})

	# 卡死检测：与 1 秒前快照比对，有速度意图却几乎没位移
	if _frame % STUCK_WINDOW == 0:
		var now := {}
		for e in get_tree().get_nodes_in_group("enemies"):
			if not is_instance_valid(e):
				continue
			now[e.get_instance_id()] = e.global_position
			if _snapshot.has(e.get_instance_id()):
				var moved: float = e.global_position.distance_to(_snapshot[e.get_instance_id()])
				if e.velocity.length() > 12.0:
					stuck_checks += 1
					if moved < 2.0:
						stuck_hits += 1
		_snapshot = now


func _count_group(group: String) -> int:
	var n := 0
	for node in get_tree().get_nodes_in_group(group):
		if is_instance_valid(node):
			n += 1
	return n


func _report() -> void:
	print("")
	print("======== 耐久压力测试报告 ========")
	print("总帧数: %d (约 %.0f 秒)  结束原因: %s" % [
		_frame, _frame / 60.0, "玩家阵亡" if GameState.is_game_over else "跑满时长"
	])
	print("存活: %.1fs  抵达波次: %d  等级: %d  击杀: %d" % [
		GameState.elapsed, GameState.wave, GameState.level, GameState.kills
	])
	print("峰值敌人: %d   峰值宝石: %d   选卡次数: %d" % [peak_enemies, peak_gems, upgrades_taken])
	var real_ms: float = Time.get_ticks_msec() - _start_ms
	print("实际帧率: %.1f fps (%.1f 秒跑完 %d 帧)" % [
		_frame * 1000.0 / maxf(real_ms, 1.0), real_ms / 1000.0, _frame
	])
	print("物理帧耗时: 均值 %.2f ms  峰值 %.2f ms (预算 16.7，headless 读数仅供参考)" % [
		physics_sum / maxf(physics_samples, 1.0), peak_physics
	])
	if stuck_checks > 0:
		print("敌人卡死率: %.1f%% (%d/%d 次采样)" % [
			100.0 * stuck_hits / stuck_checks, stuck_hits, stuck_checks
		])
	else:
		print("敌人卡死率: 无采样")

	# 泄漏判定：索引条目数应与场上实体数一致，允许一帧的延迟误差
	var last: Dictionary = samples[samples.size() - 1] if samples.size() > 0 else {}
	var max_obs_gap := 0
	var max_swarm_gap := 0
	for s in samples:
		max_obs_gap = maxi(max_obs_gap, absi(int(s["obstacles"]) - int(s["obs_index"])))
		max_swarm_gap = maxi(max_swarm_gap, absi(int(s["enemies"]) - int(s["swarm_index"])))
	print("障碍索引偏差: %d (场上 vs 索引)" % max_obs_gap)
	print("尸潮索引偏差: %d (场上 vs 索引)" % max_swarm_gap)
	print("障碍数首/末: %d -> %d" % [
		samples[0]["obstacles"] if samples.size() > 0 else 0,
		last.get("obstacles", 0)
	])
	print("泄漏判定: %s" % [
		"正常" if max_obs_gap <= 2 and max_swarm_gap <= 2 else "疑似泄漏，需排查"
	])
	print("================================")
