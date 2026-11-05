import { GameMode, type PlayerSpawnAfterEvent, world } from "@minecraft/server";
import { MinecraftEffectTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { MAX_EFFECT_DURATION } from "../../constants";

world.afterEvents.playerSpawn.subscribe((event: PlayerSpawnAfterEvent): void => {
	event.player.addEffect(MinecraftEffectTypes.Saturation, MAX_EFFECT_DURATION, {
		amplifier: 255,
		showParticles: false,
	});
});

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
	if (event.player.getGameMode() !== GameMode.Creative) {
		event.cancel = true;
	}
});

world.afterEvents.projectileHitBlock.subscribe((event) => {
	if (event.projectile.isValid && event.projectile.typeId === MinecraftEntityTypes.Arrow) {
		event.projectile.remove();
	}
});
