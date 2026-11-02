import { ItemStack, world } from "@minecraft/server";
import { MinecraftDimensionTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { ItemGenerator } from "./itemGenerator";

world.afterEvents.worldLoad.subscribe(() => {
	const gen = new ItemGenerator(
		{ x: 0, y: -60, z: 0 },
		world.getDimension(MinecraftDimensionTypes.Overworld),
		new ItemStack(MinecraftItemTypes.IronIngot),
		1,
		20,
	);
	gen.startup();
});
