import type { Dimension } from "./units.js";

export class UnknownUnitError extends Error {
  readonly unit: string;

  constructor(unit: string) {
    super(`Unknown unit "${unit}"`);
    this.name = "UnknownUnitError";
    this.unit = unit;
  }
}

export class IncompatibleDimensionError extends Error {
  readonly from: string;
  readonly to: string;
  readonly fromDimension: Dimension;
  readonly toDimension: Dimension;

  constructor(
    from: string,
    to: string,
    fromDimension: Dimension,
    toDimension: Dimension,
  ) {
    super(
      `Cannot convert ${fromDimension} (${from}) to ${toDimension} (${to})`,
    );
    this.name = "IncompatibleDimensionError";
    this.from = from;
    this.to = to;
    this.fromDimension = fromDimension;
    this.toDimension = toDimension;
  }
}
