/** biome-ignore-all lint/style/useNamingConvention: Using objects as an enums */
/** biome-ignore-all assist/source/useSortedKeys: Using objects as an enums */

import { type Vector3, world } from "@minecraft/server";

export function vector3ToString(v: Vector3): string {
	return `${v.x} ${v.y} ${v.z}`;
}

export interface TeleportLocation {
	facing: Vector3;
	pos: Vector3;
}

export function teleportLocationToString(spawn: TeleportLocation): string {
	return `${vector3ToString(spawn.pos)} (Facing ${vector3ToString(spawn.facing)})`;
}

export function teleportLocationDefault(): TeleportLocation {
	return {
		facing: { x: 0.5, y: 0, z: 0.5 },
		pos: { x: 0.5, y: 0, z: 0.5 },
	};
}

export const GameState = {
	Resetting: 0,
	Open: 1,
	Full: 2,
	Active: 3,
	Ending: 4,
} as const;
export type GameState = (typeof GameState)[keyof typeof GameState];

export function gameStateToString(state: GameState): string {
	switch (state) {
		case GameState.Resetting:
			return "Resetting";
		case GameState.Open:
			return "Open";
		case GameState.Full:
			return "Full";
		case GameState.Active:
			return "Active";
		case GameState.Ending:
			return "Ending";
		default:
			return "Unknown";
	}
}

export class EventSignal<T> {
	private _callbacks: ((event: T) => void)[];

	public constructor() {
		this._callbacks = [];
	}

	public subscribe(callback: (event: T) => void): void {
		if (!this._callbacks.includes(callback)) {
			this._callbacks.push(callback);
		}
	}

	public unsubscribe(callback: (event: T) => void): void {
		arrRemoveSwap(this._callbacks, callback);
	}

	public triggerEvent(event: T): void {
		for (const callback of this._callbacks) {
			try {
				callback(event);
			} catch (error) {
				if (error instanceof Error) {
					world.sendMessage(
						`§4EventSignal Error:\n§c${error.name} - ${error.message}\n§6${error.stack}`,
					);
				}
			}
		}
	}
}

export function arrRemoveSwap<T>(arr: T[], val: T): boolean {
	const i = arr.indexOf(val);
	if (i === -1) {
		return false;
	}
	const lastValue: T | undefined = arr[arr.length - 1];
	if (lastValue !== undefined) {
		arr[i] = lastValue;
		arr.pop();
	}
	return true;
}

// Removes first index at which callback returns true
// Returns removed value or undefined if no value was removed
export function arrRemoveByCallback<T>(arr: T[], callback: (current: T) => boolean): T | undefined {
	for (let i = 0; i < arr.length; i++) {
		const current: T | undefined = arr[i];
		if (current === undefined) {
			continue;
		}
		if (callback(current)) {
			const lastValue: T | undefined = arr[arr.length - 1];
			if (lastValue !== undefined) {
				arr[i] = lastValue;
				arr.pop();
			}
			return current;
		}
	}
	return undefined;
}

export function arrRemoveIndex<T>(arr: T[], i: number): T | undefined {
	const lastValue: T | undefined = arr[arr.length - 1];
	if (lastValue !== undefined) {
		arr[i] = lastValue;
		return arr.pop();
	}
	return undefined;
}

export const DyeColorId = {
	White: "white",
	Orange: "orange",
	Magenta: "magenta",
	LightBlue: "light_blue",
	Yellow: "yellow",
	Lime: "lime",
	Pink: "pink",
	Gray: "gray",
	LightGray: "light_gray",
	Cyan: "cyan",
	Purple: "purple",
	Blue: "blue",
	Brown: "brown",
	Green: "green",
	Red: "red",
	Black: "black",
} as const;
export type DyeColorId = (typeof DyeColorId)[keyof typeof DyeColorId];

export const ColorCode = {
	Black: "§0",
	DarkBlue: "§1",
	DarkGreen: "§2",
	DarkAqua: "§3",
	DarkRed: "§4",
	DarkPurple: "§5",
	Gold: "§6",
	Gray: "§7",
	DarkGray: "§8",
	Blue: "§9",
	Green: "§a",
	Aqua: "§b",
	Red: "§c",
	LightPurple: "§d",
	Yellow: "§e",
	White: "§f",
	MinecoinGold: "§g",
	MaterialQuartz: "§h",
	MaterialIron: "§i",
	MaterialNetherite: "§j",
	MaterialRedstone: "§m",
	MaterialCopper: "§n",
	MaterialGold: "§p",
	MaterialEmerald: "§q",
	MaterialDiamond: "§s",
	MaterialLapis: "§t",
	MaterialAmethyst: "§u",
	MaterialResin: "§v",
	PartyBlue: "§w",
} as const;
export type ColorCode = (typeof ColorCode)[keyof typeof ColorCode];
