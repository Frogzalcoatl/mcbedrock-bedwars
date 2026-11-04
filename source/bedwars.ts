import type { Dimension, VectorXZ } from "@minecraft/server";
import { BlockPlacementBounds } from "./tools/blockPlacementBounds";
import { KillTracker } from "./tools/killTracker";
import { BedWarsMapManager } from "./tools/mapManager";
import { SpectatorManager } from "./tools/spectatorManager";
import { TeamManager } from "./tools/teamManager";

export class BedWars {
	public readonly dimension: Dimension;
	public readonly mapManager: BedWarsMapManager;
	public readonly teamManager: TeamManager;
	public readonly spectators: SpectatorManager;
	public readonly killTracker: KillTracker;
	public readonly blockPlacementBounds: BlockPlacementBounds;

	public constructor(
		playersPerTeam: number,
		teamCount: number,
		dimension: Dimension,
		center: VectorXZ,
	) {
		this.dimension = dimension;
		this.mapManager = new BedWarsMapManager(dimension, center, "bedwars");
		this.teamManager = new TeamManager(playersPerTeam, teamCount);
		this.spectators = new SpectatorManager(this.dimension);
		this.killTracker = new KillTracker(140);
		this.blockPlacementBounds = new BlockPlacementBounds(
			{ x: 0, y: 0, z: 0 },
			{ x: 0, y: 0, z: 0 },
		);
	}
}
