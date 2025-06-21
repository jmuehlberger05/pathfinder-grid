export type CellCoordinates = {
  row: number;
  column: number;
};

export type MouseCoordinates = {
  x: number;
  y: number;
};

export enum CellType {
  Wall,
  Start,
  End,
  Visited,
  Path,
  Empty,
}

export enum DrawingMode {
  Wall = "wall",
  Start = "start",
  End = "end",
}

export type GridCell = {
  type: CellType;
};

export type Path = CellCoordinates[];

export type GridData = GridCell[][];
