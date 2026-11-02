import { type Dimension, type ItemStack, system, type Vector3 } from "@minecraft/server";

export class ItemGenerator {
	public pos: Vector3;
	public dimension: Dimension;
	public item: ItemStack;
	public amount: number;
	private _intervalTicks: number;
	private _intervalId: number | null;

	public constructor(
		pos: Vector3,
		dimension: Dimension,
		item: ItemStack,
		amount: number,
		intervalTicks: number,
	) {
		this.pos = pos;
		this.dimension = dimension;
		this.item = item;
		this.amount = amount;
		this._intervalTicks = intervalTicks;
		this._intervalId = null;
	}

	public get intervalTicks(): number {
		return this._intervalTicks;
	}

	public set intervalTicks(val: number) {
		this._intervalTicks = val;
		this.startup();
	}

	public shutdown(): void {
		if (this._intervalId !== null) {
			system.clearRun(this._intervalId);
			this._intervalId = null;
		}
	}

	public startup(): void {
		this.shutdown();
		this._intervalId = system.runInterval(() => {
			if (!this.dimension.isChunkLoaded(this.pos)) {
				return;
			}
			let remaining: number = this.amount;
			while (remaining > 0) {
				this.item.amount = Math.min(this.item.maxAmount, remaining);
				this.dimension.spawnItem(this.item, this.pos);
				remaining -= this.item.amount;
			}
		}, this._intervalTicks);
	}
}
