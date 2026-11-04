import { type Player, type PlayerSpawnAfterEvent, system, world } from "@minecraft/server";
import { EventSignal } from "../types";
import { type PlayerEliminationEvent, Team } from "./team";

interface TeamOrdersValue {
	colorCode: string;
	dyeColor: string;
	name: string;
}

const teamOrders: TeamOrdersValue[] = [
	{ colorCode: "§c", dyeColor: "red", name: "Red" },
	{ colorCode: "§1", dyeColor: "blue", name: "Blue" },
	{ colorCode: "§a", dyeColor: "lime", name: "Green" },
	{ colorCode: "§e", dyeColor: "yellow", name: "Yellow" },
	{ colorCode: "§3", dyeColor: "cyan", name: "Aqua" },
	{ colorCode: "§f", dyeColor: "white", name: "White" },
	{ colorCode: "§d", dyeColor: "pink", name: "Pink" },
	{ colorCode: "§8", dyeColor: "gray", name: "Gray" },
];

export class TeamManager {
	public playersPerTeam: number;
	public readonly teams: Team[];
	public readonly onPlayerElimination: EventSignal<PlayerEliminationEvent>;
	public readonly onTeamElmination: EventSignal<Team>;
	public readonly onTeamWin: EventSignal<Team[]>; // (length > 1) on tie
	private readonly _teamsEliminatedThisTick: Team[];
	private _teamCount: number;

	public constructor(playersPerTeam: number, teamCount: number) {
		this.playersPerTeam = playersPerTeam;
		this.teams = [];
		this.onPlayerElimination = new EventSignal<PlayerEliminationEvent>();
		this.onTeamElmination = new EventSignal<Team>();
		this.onTeamWin = new EventSignal<Team[]>();
		this._teamsEliminatedThisTick = [];
		this._teamCount = teamCount;
		this.initTeams();
		for (const t of this.teams) {
			t.onPlayerElimination.subscribe(this.playerEliminationCallback);
			t.onTeamElimination.subscribe(this.teamEliminationCallback);
		}
		world.afterEvents.playerSpawn.subscribe(this.playerSpawn);
	}

	public get teamsRemaining(): number {
		let remaining = 0;
		for (const t of this.teams) {
			if (t.activePlayers.length > 0) {
				remaining++;
			}
		}
		return remaining;
	}

	public get teamCount(): number {
		return this._teamCount;
	}

	public set teamCount(val: number) {
		this._teamCount = val;
		this.initTeams();
	}

	public find(player: Player): Team | undefined {
		for (const t of this.teams) {
			if (t.activePlayers.indexOf(player) !== -1 || t.eliminatedPlayers.indexOf(player) !== -1) {
				return t;
			}
		}
		return undefined;
	}

	public reset(): void {
		for (const t of this.teams) {
			t.reset();
		}
	}

	public distribute(players: Player[]): void {
		let i = 0;
		let currentTeam: Team | undefined = this.teams[i];
		if (currentTeam === undefined) {
			return;
		}
		for (const p of players) {
			if (this.find(p) !== undefined) {
				continue;
			}
			while (currentTeam.activePlayers.length >= currentTeam.maxPlayers) {
				currentTeam = this.teams[++i];
				if (currentTeam === undefined) {
					return;
				}
			}
			currentTeam.join(p);
		}
	}

	private initTeams(): void {
		this.teams.length = 0;
		let teamsAdded = 0;
		const maxI: number = Math.min(this._teamCount, teamOrders.length);
		for (let i = 0; i < maxI; i++) {
			const current: TeamOrdersValue | undefined = teamOrders[i];
			if (current !== undefined) {
				const team = new Team(current.name, { x: 0.5, y: 0, z: 0.5 }, this.playersPerTeam);
				team.colorCode = current.colorCode;
				team.dyeColor = current.dyeColor;
				this.teams.push(team);
				teamsAdded++;
			}
		}
		if (teamsAdded < this._teamCount) {
			const remaining: number = this._teamCount - teamsAdded;
			for (let i = 1; i <= remaining; i++) {
				this.teams.push(new Team(`Extra-${i}`, { x: 0.5, y: 0, z: 0.5 }, this.playersPerTeam));
			}
		}
	}

	private winCheck = (): void => {
		const teamsRemaining: number = this.teamsRemaining;
		if (teamsRemaining === 1) {
			const eventArr: Team[] = [];
			const winningTeam: Team | undefined = this.teams[0];
			if (winningTeam !== undefined) {
				eventArr.push(winningTeam);
			}
			this.onTeamWin.triggerEvent(eventArr);
		} else if (teamsRemaining <= 0) {
			// A tie occurred
			this.onTeamWin.triggerEvent(this._teamsEliminatedThisTick);
		}
		this._teamsEliminatedThisTick.length = 0;
	};

	private teamEliminationCallback = (eliminatedTeam: Team): void => {
		this.onTeamElmination.triggerEvent(eliminatedTeam);
		this._teamsEliminatedThisTick.push(eliminatedTeam);
		if (this._teamsEliminatedThisTick.length === 0) {
			system.run(this.winCheck);
		}
	};

	private playerEliminationCallback = (event: PlayerEliminationEvent): void => {
		this.onPlayerElimination.triggerEvent(event);
	};

	private playerSpawn = (event: PlayerSpawnAfterEvent): void => {
		const team: Team | undefined = this.find(event.player);
		if (team !== undefined) {
			team.respawn(event.player);
		}
	};
}
