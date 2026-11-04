import { type StartupEvent, system } from "@minecraft/server";
import { StructureSchemaManager } from "./structureSchemaManager";

// TODO: Copy structure related commands from minigames

system.beforeEvents.startup.subscribe((event: StartupEvent): void => {});
