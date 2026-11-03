import "./helpers/simulatedPlayers";
import { ItemStack, world } from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { ItemGenerator } from "./tools/itemGenerator";
import { TeamManager } from "./tools/teamManager";

world.afterEvents.worldLoad.subscribe(() => {
	const gen = new ItemGenerator(
		{ x: 0.5, y: -63, z: 5.5 },
		world.getDimension(MinecraftDimensionTypes.Overworld),
		new ItemStack(MinecraftItemTypes.IronIngot),
		1,
		20,
	);
	gen.startup();

	const teamManager = new TeamManager(1, 2);
	teamManager.distribute(world.getAllPlayers());
	teamManager.teams[0]?.bedManager.beds.push({
		foot: { x: 0, y: -63, z: 0 },
		head: { x: 0, y: -63, z: -1 },
	});
});
