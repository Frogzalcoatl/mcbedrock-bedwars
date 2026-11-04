import "./helpers/index";
import { ItemStack, world } from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { BedWars } from "./bedwars";
import { ItemGenerator } from "./tools/itemGenerator";

let bedwars: BedWars | undefined;

// biome-ignore lint/nursery/noMisusedPromises: Won't be using an async func here like this in final version just temporarily testing
world.afterEvents.worldLoad.subscribe(async () => {
	bedwars = new BedWars(1, 2, world.getDimension(MinecraftDimensionTypes.Overworld), {
		x: 0,
		z: 0,
	});

	const gen = new ItemGenerator(
		{ x: 0.5, y: -63, z: 5.5 },
		world.getDimension(MinecraftDimensionTypes.Overworld),
		new ItemStack(MinecraftItemTypes.IronIngot),
		1,
		20,
	);
	gen.startup();

	await bedwars.mapManager.initTickingArea();
	bedwars.mapManager.clearWithAir();
});
