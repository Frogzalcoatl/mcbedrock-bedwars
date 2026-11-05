import { type PlayerBreakBlockBeforeEvent, system, type Vector3, world } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { arrRemoveIndex } from "../types";
import type { Team } from "./team";

function insideBedPosition(bedPos: BedPosition, vec: Vector3): boolean {
	return (
		(vec.x === bedPos.head.x && vec.y === bedPos.head.y && vec.z === bedPos.head.z) ||
		(vec.x === bedPos.foot.x && vec.y === bedPos.foot.y && vec.z === bedPos.foot.z)
	);
}

export interface BedPosition {
	foot: Vector3;
	head: Vector3;
}

export class BedManager {
	public beds: BedPosition[];
	private _forTeam: Team;

	public constructor(team: Team) {
		this.beds = [];
		this._forTeam = team;
	}

	public startup(): void {
		world.beforeEvents.playerBreakBlock.subscribe(this.playerBreakBlock);
	}

	public shutdown(): void {
		world.beforeEvents.playerBreakBlock.unsubscribe(this.playerBreakBlock);
	}

	private playerBreakBlock = (event: PlayerBreakBlockBeforeEvent): void => {
		const bedIndex: number = this.beds.findIndex((bedPos) =>
			insideBedPosition(bedPos, event.block.location),
		);
		if (bedIndex === -1) {
			return;
		}
		event.cancel = true;
		const activePlayersIndex: number = this._forTeam.activePlayers.indexOf(event.player);
		const eliminatedPlayersIndex: number = this._forTeam.eliminatedPlayers.indexOf(event.player);
		if (activePlayersIndex !== -1 || eliminatedPlayersIndex !== -1) {
			event.cancel = true;
			event.player.sendMessage(`§cYou cannot break your own bed!`);
			return;
		}
		const removedValue: BedPosition | undefined = arrRemoveIndex(this.beds, bedIndex);
		if (removedValue !== undefined) {
			system.run(() => {
				event.block.dimension.setBlockType(removedValue.foot, MinecraftBlockTypes.Air);
				event.block.dimension.setBlockType(removedValue.head, MinecraftBlockTypes.Air);
			});
		}
		if (this.beds.length === 0) {
			this._forTeam.canRespawn = false;
		}
		world.sendMessage(
			`§lBED DESTRUCTION > §r${this._forTeam.colorCode}${this._forTeam.name} Bed §7was destroyed by ${event.player.nameTag}`,
		);
		if (this.beds.length > 0) {
			world.sendMessage(
				`§7${this.beds.length} Bed${this.beds.length !== 1 ? "s" : ""} remaining...`,
			);
		}
		system.run(() => {
			for (const p of world.getAllPlayers()) {
				p.playSound("mob.enderdragon.growl");
			}
		});
	};
}
