import {
	type ItemStack,
	type PlayerPlaceBlockAfterEvent,
	type Vector3,
	world,
} from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { giveItemToEntity } from "../helpers/entityComponents";

export class BlockPlacementBounds {
	public min: Vector3;
	public max: Vector3;

	public constructor(min: Vector3, max: Vector3) {
		this.min = min;
		this.max = max;
	}

	public startup(): void {
		world.afterEvents.playerPlaceBlock.subscribe(this.playerPlaceBlock);
	}

	public shutdown(): void {
		world.afterEvents.playerPlaceBlock.unsubscribe(this.playerPlaceBlock);
	}

	private playerPlaceBlock = (event: PlayerPlaceBlockAfterEvent): void => {
		if (
			event.block.x >= this.min.x &&
			event.block.y >= this.min.y &&
			event.block.z >= this.min.z &&
			event.block.x <= this.max.x &&
			event.block.y <= this.max.y &&
			event.block.z <= this.max.z
		) {
			return;
		}
		const itemStack: ItemStack | undefined = event.block.getItemStack();
		if (itemStack !== undefined) {
			giveItemToEntity(itemStack, event.player, true);
		}
		if (event.block.dimension.isChunkLoaded(event.block.location)) {
			event.block.setType(MinecraftBlockTypes.Air);
		}
		event.player.sendMessage("§cYou cannot place blocks here");
	};
}
