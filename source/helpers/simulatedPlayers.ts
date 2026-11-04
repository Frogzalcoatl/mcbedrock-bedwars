import {
	CommandPermissionLevel,
	type CustomCommandOrigin,
	CustomCommandParamType,
	type CustomCommandResult,
	CustomCommandStatus,
	type Dimension,
	type EntityDieAfterEvent,
	GameMode,
	type StartupEvent,
	system,
	world,
} from "@minecraft/server";
import { SimulatedPlayer, spawnSimulatedPlayer } from "@minecraft/server-gametest";
import { MinecraftDimensionTypes } from "@minecraft/vanilla-data";
import { PACK_NAMESPACE } from "../constants";
import { getDimensionFromOrigin } from "./commandOrigin";

world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent): void => {
	if (event.deadEntity instanceof SimulatedPlayer) {
		event.deadEntity.respawn();
	}
});

system.beforeEvents.startup.subscribe((event: StartupEvent): void => {
	event.customCommandRegistry.registerCommand(
		{
			description: "Spawn simulated players.",
			name: `${PACK_NAMESPACE}:sim`,
			optionalParameters: [
				{ name: "amount", type: CustomCommandParamType.Integer },
				{ name: "name", type: CustomCommandParamType.String },
			],
			permissionLevel: CommandPermissionLevel.Admin,
		},
		(
			origin: CustomCommandOrigin,
			amount = 1,
			name = "SimulatedPlayer",
		): CustomCommandResult | undefined => {
			if (amount <= 0) {
				return {
					message: "Amount must be an integer greater than 0",
					status: CustomCommandStatus.Failure,
				};
			}
			let dimension: Dimension | null = getDimensionFromOrigin(origin);
			if (dimension === null) {
				dimension = world.getDimension(MinecraftDimensionTypes.Overworld);
			}
			system.run(() => {
				for (let i = 0; i < amount; i++) {
					spawnSimulatedPlayer(
						{ dimension: dimension, x: 0.5, y: 0, z: 0.5 },
						name,
						GameMode.Adventure,
					);
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
	event.customCommandRegistry.registerCommand(
		{
			description: "Clear simulated players.",
			name: `${PACK_NAMESPACE}:clearsim`,
			permissionLevel: CommandPermissionLevel.Admin,
		},
		(_origin: CustomCommandOrigin): CustomCommandResult | undefined => {
			system.run(() => {
				for (const p of world.getAllPlayers()) {
					if (p instanceof SimulatedPlayer) {
						p.disconnect();
					}
				}
			});
			return {
				status: CustomCommandStatus.Success,
			};
		},
	);
});
