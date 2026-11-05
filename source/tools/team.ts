import {
	GameMode,
	type Player,
	type PlayerSpawnAfterEvent,
	system,
	type Vector3,
	world,
} from "@minecraft/server";
import { ColorCode, DyeColorId } from "../types";
import { BedManager } from "./bedManager";
import { type DeathLocation, getLastDeathLocation } from "./helpers/deathLocationTracker";
import { ticksSinceDeath } from "./helpers/ticksSinceDeath";
import type { ItemGenerator } from "./itemGenerator";
import { arrRemoveByCallback, arrRemoveSwap } from "./shared/arrayHelpers";
import { EventSignal } from "./shared/eventSignal";
import type { TeleportLocation } from "./shared/locations";

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent) => {
	if (event.initialSpawn) {
		event.player.nameTag = event.player.name;
	}
});

world.afterEvents.worldLoad.subscribe(() => {
	for (const p of world.getAllPlayers()) {
		p.nameTag = p.name;
	}
});

export interface PlayerEliminationEvent {
	player: Player;
	team: Team;
}

export class Team {
	public maxPlayers: number;
	public name: string;
	public readonly activePlayers: Player[];
	public canRespawn: boolean;
	public respawnTimeTicks: number;
	public spawnPoint: TeleportLocation;

	public dyeColor: DyeColorId;

	public colorCode: ColorCode;
	public readonly onSpawn: EventSignal<PlayerSpawnAfterEvent>;
	// Elimination events are still triggered when player.isValid is false
	public readonly onPlayerElimination: EventSignal<PlayerEliminationEvent>;
	public readonly onTeamElimination: EventSignal<Team>;
	public readonly eliminatedPlayers: Player[];
	public readonly bedManager: BedManager;
	public itemGenerators: ItemGenerator[];
	private _respawnIntervalIds: Map<string, number>; // key is playerId

	public constructor(name: string, spawnPoint: Vector3, maxPlayers: number) {
		this.maxPlayers = maxPlayers;
		this.name = name;
		this.activePlayers = [];
		this.canRespawn = true;
		this.respawnTimeTicks = 100;
		this.spawnPoint = {
			facing: {
				x: spawnPoint.x,
				y: spawnPoint.y,
				z: spawnPoint.z,
			},
			pos: spawnPoint,
		};
		this.colorCode = ColorCode.White;
		this.dyeColor = DyeColorId.White;
		this.onSpawn = new EventSignal<PlayerSpawnAfterEvent>();
		this.onPlayerElimination = new EventSignal<PlayerEliminationEvent>();
		this.onTeamElimination = new EventSignal<Team>();
		this.activePlayers = [];
		this.eliminatedPlayers = [];
		this.bedManager = new BedManager(this);
		this.bedManager.startup();
		this.itemGenerators = [];
		this._respawnIntervalIds = new Map<string, number>();
	}

	public join(player: Player): boolean {
		if (this.activePlayers.length >= this.maxPlayers) {
			return false;
		}
		if (!(this.activePlayers.includes(player) || this.eliminatedPlayers.includes(player))) {
			this.activePlayers.push(player);
		}
		player.nameTag = `${this.colorCode}${player.name}§r`;
		player.sendMessage(`§7Joined team: ${this.colorCode}${this.name}`);
		return true;
	}

	public leave(playerId: string): boolean {
		this.clearRespawnInterval(playerId);
		let removedPlayer: Player | undefined = arrRemoveByCallback(
			this.activePlayers,
			(p) => p.id === playerId,
		);
		if (removedPlayer !== undefined) {
			this.onPlayerElimination.triggerEvent({ player: removedPlayer, team: this });
			if (this.activePlayers.length === 0) {
				this.onTeamElimination.triggerEvent(this);
			}
			if (removedPlayer.isValid) {
				removedPlayer.nameTag = removedPlayer.name;
			}
			return true;
		}
		removedPlayer = arrRemoveByCallback(this.eliminatedPlayers, (p) => p.id === playerId);
		if (removedPlayer !== undefined) {
			if (removedPlayer.isValid) {
				removedPlayer.nameTag = removedPlayer.name;
			}
			return true;
		}
		return false;
	}

	public eliminate(player: Player): void {
		this.clearRespawnInterval(player.id);
		if (!arrRemoveSwap(this.activePlayers, player) || this.eliminatedPlayers.includes(player)) {
			return;
		}
		this.eliminatedPlayers.push(player);
		this.onPlayerElimination.triggerEvent({ player: player, team: this });
		if (this.activePlayers.length === 0) {
			this.onTeamElimination.triggerEvent(this);
		}
	}

	public reset(): void {
		this.activePlayers.length = 0;
		this.eliminatedPlayers.length = 0;
		for (const [, id] of this._respawnIntervalIds) {
			system.clearRun(id);
		}
		this._respawnIntervalIds.clear();
	}

	public spawnPlayers(): void {
		for (const p of this.activePlayers) {
			p.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onSpawn.triggerEvent({ initialSpawn: true, player: p });
		}
	}

	public respawn(player: Player): void {
		if (this.activePlayers.indexOf(player) === -1) {
			return;
		}
		const oldIntervalId: number | undefined = this._respawnIntervalIds.get(player.id);
		if (oldIntervalId !== undefined) {
			system.clearRun(oldIntervalId);
			this._respawnIntervalIds.delete(player.id);
		}
		if (!player.isValid) {
			this.eliminate(player);
			return;
		}
		player.onScreenDisplay.setTitle("§cYOU DIED!");
		const oldGameMode: GameMode = player.getGameMode();
		player.setGameMode(GameMode.Spectator);
		const deathLocation: DeathLocation | undefined = getLastDeathLocation(player);
		if (deathLocation !== undefined) {
			player.teleport(deathLocation.pos, { dimension: deathLocation.dimension });
		}
		if (!this.canRespawn) {
			this.eliminate(player);
			return;
		}
		if (this.respawnTimeTicks <= 0) {
			player.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
			this.onSpawn.triggerEvent({ initialSpawn: false, player: player });
			return;
		}
		let ticksRemaining = this.respawnTimeTicks;
		const ticksSincePlayerDeath: number | undefined = ticksSinceDeath(player);
		if (ticksSincePlayerDeath !== undefined) {
			ticksRemaining -= ticksSincePlayerDeath;
		}
		const intervalId: number = system.runInterval(() => {
			if (ticksRemaining <= 0) {
				if (player.isValid) {
					player.setGameMode(oldGameMode);
					player.teleport(this.spawnPoint.pos, { facingLocation: this.spawnPoint.facing });
					player.onScreenDisplay.setActionBar("§eYou will respawn in §c0§e seconds!");
					player.onScreenDisplay.setTitle("§aRESPAWNED!");
					this.onSpawn.triggerEvent({ initialSpawn: false, player: player });
				}
				system.clearRun(intervalId);
				this._respawnIntervalIds.delete(player.id);
				return;
			}
			if (player.isValid) {
				const secondsRemaining = Math.ceil(ticksRemaining / 20);
				player.onScreenDisplay.setActionBar(
					`§eYou will respawn in §c${secondsRemaining}§e second${secondsRemaining !== 1 ? "s" : ""}!`,
				);
			}
			ticksRemaining--;
		});
		this._respawnIntervalIds.set(player.id, intervalId);
	}

	private clearRespawnInterval(playerId: string): void {
		const id: number | undefined = this._respawnIntervalIds.get(playerId);
		if (id !== undefined) {
			system.clearRun(id);
			this._respawnIntervalIds.delete(playerId);
		}
	}
}
