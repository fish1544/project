extends Node

signal hp_changed(hp: int, max_hp: int)
signal xp_changed(xp: int, xp_to_next: int)
signal level_changed(level: int)
signal player_hurt
signal upgrades_pending(count: int)
signal game_over

var max_hp := 100
var hp := 100
var xp := 0
var xp_to_next := 5
var level := 1
var kills := 0
var elapsed := 0.0
var wave := 1
var pending_upgrades := 0
var is_game_over := false


func reset_state() -> void:
	max_hp = 100
	hp = 100
	xp = 0
	xp_to_next = 5
	level = 1
	kills = 0
	elapsed = 0.0
	wave = 1
	pending_upgrades = 0
	is_game_over = false
	hp_changed.emit(hp, max_hp)
	xp_changed.emit(xp, xp_to_next)
	level_changed.emit(level)


func add_xp(amount: int) -> void:
	if is_game_over:
		return
	xp += amount
	while xp >= xp_to_next:
		xp -= xp_to_next
		level += 1
		xp_to_next = 5 + (level - 1) * 5
		pending_upgrades += 1
		level_changed.emit(level)
	xp_changed.emit(xp, xp_to_next)
	upgrades_pending.emit(pending_upgrades)


func consume_upgrade() -> void:
	pending_upgrades = maxi(0, pending_upgrades - 1)
	upgrades_pending.emit(pending_upgrades)


func damage(amount: int) -> void:
	if is_game_over:
		return
	hp = maxi(0, hp - amount)
	hp_changed.emit(hp, max_hp)
	if hp <= 0:
		is_game_over = true
		game_over.emit()


func heal(amount: int) -> void:
	hp = mini(max_hp, hp + amount)
	hp_changed.emit(hp, max_hp)


func add_kill() -> void:
	kills += 1
