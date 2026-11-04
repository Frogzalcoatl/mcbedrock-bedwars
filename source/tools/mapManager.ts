import {
	type BlockBoundingBox,
	BlockVolume,
	type Dimension,
	type TickingArea,
	type TickingAreaOptions,
	type Vector3,
	type VectorXZ,
	world,
} from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { type StructureSchema, structureSchemaManager } from "../structures/structureSchemaManager";
import { vector3ToString } from "../types";
import type { BedPosition } from "./bedManager";
import type { ItemGenerator } from "./itemGenerator";

export interface MapTeamData {
	beds: BedPosition[];
	generators: ItemGenerator[];
	teamName: string;
}

export interface BedWarsMap {
	builders: string[];
	generators: ItemGenerator[];
	name: string;
	structureId: string;
	structureSchema: StructureSchema;
	teams: MapTeamData[];
}

export class BedWarsMapManager {
	public readonly dimension: Dimension;
	public readonly center: VectorXZ;
	public readonly tickingAreaId: string;
	public maxY: number;
	private readonly _maps: BedWarsMap[];
	private _current: BedWarsMap | null;
	private _bounds: BlockBoundingBox | null;

	public constructor(dimension: Dimension, center: VectorXZ, tickingAreaId: string) {
		this.dimension = dimension;
		this.center = center;
		this.tickingAreaId = tickingAreaId;
		this.maxY = 32;
		this._maps = [];
		this._current = null;
		this._bounds = null;
	}

	public get current(): BedWarsMap | null {
		return this._current;
	}

	public get bounds(): BlockBoundingBox | null {
		return this._bounds;
	}

	public async initTickingArea(): Promise<boolean> {
		if (world.tickingAreaManager.hasTickingArea(this.tickingAreaId)) {
			world.tickingAreaManager.removeTickingArea(this.tickingAreaId);
		}
		this._bounds = null;
		const from: Vector3 = {
			x: this.center.x - 16 * 8,
			y: 0,
			z: this.center.z - 16 * 8,
		};
		const to: Vector3 = {
			x: this.center.x + 16 * 8,
			y: 0,
			z: this.center.z + 16 * 8,
		};
		const options: TickingAreaOptions = {
			dimension: this.dimension,
			from: from,
			to: to,
		};
		if (!world.tickingAreaManager.hasCapacity(options)) {
			world.sendMessage(
				`§cUnable to create ticking area "${this.tickingAreaId}" for BedWarsMapManager from (${vector3ToString(from)}) to (${vector3ToString(to)})`,
			);
			return false;
		}
		await world.tickingAreaManager.createTickingArea(this.tickingAreaId, options);
		const tickingArea: TickingArea | undefined = world.tickingAreaManager.getTickingArea(
			this.tickingAreaId,
		);
		if (tickingArea === undefined) {
			world.sendMessage(`§cTicking area "${this.tickingAreaId}" for BedWarsMapManager is null`);
			return false;
		}
		this._bounds = tickingArea.boundingBox;
		return true;
	}

	public load(mapName: string): boolean {
		if (this._bounds === null) {
			world.sendMessage(`§cUnable to load map "${mapName}": ticking area bounds are null`);
			return false;
		}
		const map: BedWarsMap | undefined = this._maps.find((m) => m.name === mapName);
		if (map === undefined) {
			world.sendMessage(`§cUnable to load map "${mapName}": map is null`);
			return false;
		}
		structureSchemaManager.load(map.structureId, this._bounds.min, this.dimension);
		return true;
	}

	public add(map: BedWarsMap): void {
		this._maps.push(map);
		structureSchemaManager.addSchemas([[map.structureId, map.structureSchema]]);
	}

	public clearWithAir(): boolean {
		const tickingArea: TickingArea | undefined = world.tickingAreaManager.getTickingArea(
			this.tickingAreaId,
		);
		if (tickingArea === undefined) {
			world.sendMessage(
				`§cUnable to clear map with air: Ticking area "${this.tickingAreaId}" is undefined`,
			);
			return false;
		}
		this._bounds = tickingArea.boundingBox;
		if (!tickingArea.isFullyLoaded) {
			world.sendMessage(
				`§cUnable to clear map with air: Ticking area "${this.tickingAreaId}" is not fully loaded`,
			);
			return false;
		}
		// TODO: Split block volume into 32x32x32 chunks for fill
		this.dimension.fillBlocks(
			new BlockVolume(this._bounds.min, this._bounds.max),
			MinecraftBlockTypes.Air,
			{ ignoreChunkBoundErrors: true },
		);
		return true;
	}
}
