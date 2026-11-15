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

export class BelowAbsoluteZeroError extends Error {
  readonly value: number;
  readonly unit: string;
  readonly absoluteZero: number;

  constructor(value: number, unit: string, absoluteZero: number) {
    super(`${value} ${unit} is below absolute zero (${absoluteZero} ${unit})`);
    this.name = "BelowAbsoluteZeroError";
    this.value = value;
    this.unit = unit;
    this.absoluteZero = absoluteZero;
  }
}
