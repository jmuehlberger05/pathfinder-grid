"use client";

import { useEffect, useRef, useState } from "react";
import {
  CellCoordinates,
  CellType,
  DrawingMode,
  GridCell,
  GridData,
  MouseCoordinates,
  Path,
} from "./types";
import { calculatePath } from "./calculatePath";
import PathfinderControls from "./pathfinder-controls";

interface PathfinderGridV2Props {
  rows: number;
  columns: number;
}

const returnEmptyGrid = (rows: number, columns: number) => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => ({
      type: CellType.Empty,
    }))
  );
};

// * Find cells by types ✅
export const findCellsByTypes = (
  types: CellType[],
  grid: GridData
): CellCoordinates[] => {
  const cells: CellCoordinates[] = [];

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (types.includes(cell.type)) {
        cells.push({ row: rowIndex, column: columnIndex });
      }
    });
  });

  return cells;
};

// * Check if the coordinates are within the grid bounds ✅
export const checkBounds = (
  rowIndex: number,
  columnIndex: number,
  grid: GridData
) => {
  return (
    rowIndex >= 0 &&
    rowIndex < grid.length &&
    columnIndex >= 0 &&
    columnIndex < grid[0].length
  );
};

const cloneGrid = (grid: GridData): GridData =>
  grid.map((row) => row.map((cell) => ({ ...cell })));

const directions: Map<string, CellCoordinates> = new Map([
  ["up", { row: -1, column: 0 }],
  ["down", { row: 1, column: 0 }],
  ["left", { row: 0, column: -1 }],
  ["right", { row: 0, column: 1 }],
]);

const checkNeighborTypeForCurrentCell = (
  grid: GridData,
  currentCell: CellCoordinates,
  direction: CellCoordinates
) => {
  const neighborRow = currentCell.row + direction.row;
  const neighborColumn = currentCell.column + direction.column;

  if (!checkBounds(neighborRow, neighborColumn, grid)) {
    return false;
  }

  const neighborCell = grid[neighborRow][neighborColumn];
  return (
    neighborCell.type === CellType.Path ||
    neighborCell.type === CellType.Start ||
    neighborCell.type === CellType.End
  );
};

const drawInnerGrid = (rowIndex: number, cellIndex: number, grid: GridData) => {
  return (
    <>
      <div
        key={`p-center-${rowIndex - cellIndex}`}
        className="w-full h-full bg-neutral-900 row-2 col-2"
      ></div>
      {[...directions.entries()].map((direction, index) => {
        const isNeighborPathOrStartOrEnd = checkNeighborTypeForCurrentCell(
          grid,
          { row: rowIndex, column: cellIndex },
          direction[1]
        );
        if (isNeighborPathOrStartOrEnd)
          return (
            <div
              key={`p-${index}-${rowIndex - cellIndex}`}
              className={`w-full h-full bg-neutral-900 ${getInnerGridStylesByDirectionString(
                direction[0]
              )}`}
            ></div>
          );
      })}
    </>
  );
};

const getInnerGridStylesByDirectionString = (string: string): string => {
  switch (string) {
    case "up":
      return "row-1 col-2";
    case "down":
      return "row-3 col-2";
    case "left":
      return "row-2 col-1";
    case "right":
      return "row-2 col-3";
    default:
      return "row-2 col-2";
  }
};

function PathfinderGridV2({ rows, columns }: PathfinderGridV2Props) {
  const cellSize = 50;
  const [grid, setGrid] = useState<GridData>(() =>
    returnEmptyGrid(rows, columns)
  );
  const [result, setResult] = useState<{
    successful: boolean;
    path?: Path;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // #region Drawing

  const [drawingMode, setDrawingMode] = useState<DrawingMode>(DrawingMode.Wall);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<MouseCoordinates>({
    x: 0,
    y: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    setMouseCoords({
      x: e.clientX,
      y: e.clientY,
    });
    console.log("Mouse down");
  };

  const handleMouseUp = () => {
    console.log("Mouse up");
    setIsDrawing(false);
  };

  // * Handle mouse move event ✅
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || drawingMode != DrawingMode.Wall) return;
    setMouseCoords({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // * Draw wall ✅
  const drawWall = (cellCoords: CellCoordinates) => {
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[cellCoords.row][cellCoords.column].type = CellType.Wall;
      return newGrid;
    });
  };

  // * Draw start or end point ✅
  const drawStartOrEnd = (
    cellCoords: CellCoordinates,
    mode: DrawingMode.Start | DrawingMode.End
  ) => {
    const cellType =
      drawingMode === DrawingMode.Start ? CellType.Start : CellType.End;
    const cellsToReset = findCellsByTypes([cellType], grid);

    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      const cell = newGrid[cellCoords.row][cellCoords.column];

      // Reset the cell to Empty if it was previously a Start or End cell
      if (cellsToReset.length > 0) {
        cellsToReset.forEach((resetCell) => {
          newGrid[resetCell.row][resetCell.column].type = CellType.Empty;
        });
      }

      // Set the new cell type
      newGrid[cellCoords.row][cellCoords.column].type = cellType;
      return newGrid;
    });
  };

  // * Get cell coordinates from mouse position ✅
  // TODO: Make this more robust by considering the grid's position on the page
  const getCellCoordinates = (
    mouseCoords: MouseCoordinates
  ): CellCoordinates | null => {
    const row = Math.floor(mouseCoords.y / cellSize);
    const column = Math.floor(mouseCoords.x / cellSize);

    if (row > rows - 1 || column > columns - 1) {
      console.warn("Coordinates out of bounds:", { row, column });
      return null;
    }

    return { row, column };
  };

  // * Effect to handle drawing on the grid
  useEffect(() => {
    console.log("Mouse coordinates:", mouseCoords);
    if (!isDrawing) return;

    const cellCoords = getCellCoordinates(mouseCoords);

    if (!cellCoords) {
      console.warn("Invalid cell coordinates:", mouseCoords);
      return;
    }

    drawingMode == DrawingMode.Wall
      ? drawWall(cellCoords)
      : drawStartOrEnd(cellCoords, drawingMode);
  }, [mouseCoords]);

  // #endregion Drawing

  // #region Actions

  // * Reset the grid to empty state ✅
  const resetGrid = () => {
    setResult(null);
    setGrid(() => returnEmptyGrid(rows, columns));
  };

  // * Update the grid state ✅
  const updateGrid = (newGrid: GridData) => {
    console.log("Updating Grid with: ", newGrid);
    setGrid(cloneGrid(newGrid));
  };

  const resetCalculatedCells = () => {
    setResult(null);
    setGrid((prevGrid) =>
      cloneGrid(
        prevGrid.map((row) =>
          row.map((cell) => {
            if (cell.type === CellType.Path || cell.type === CellType.Visited) {
              return { ...cell, type: CellType.Empty };
            }
            return cell;
          })
        )
      )
    );
  };

  // * Run the algorithm
  const runAlgorithm = async () => {
    resetCalculatedCells();

    const startCells = findCellsByTypes([CellType.Start], grid);
    const endCells = findCellsByTypes([CellType.End], grid);

    if (!startCells || !endCells) {
      console.error("Start or End cell not found in the grid.");
      return;
    }

    if (startCells.length !== 1 || endCells.length !== 1) {
      console.error(
        "There should be exactly one Start and one End cell in the grid."
      );
      return;
    }
    if (isRunning) {
      console.warn("Algorithm is already running.");
      return;
    }
    setIsRunning(true);
    const { gridData, path, successful } = await calculatePath(
      grid,
      startCells[0],
      endCells[0],
      updateGrid
    ).then((result) => {
      setIsRunning(false);
      return result;
    });

    setGrid(gridData);

    if (successful) {
      setResult({ successful: true, path });
      console.log("Path found:", path);
    }

    // console.log("Running algorithm on grid:", gridData);
  };
  // #endregion Actions

  // * Get cell styles based on type ✅
  // This function returns the appropriate CSS classes based on the cell type
  const getCellStylesByType = (cell: GridCell) => {
    switch (cell.type) {
      case CellType.Wall:
        return "bg-neutral-500";
      case CellType.Start:
        return "bg-green-500";
      case CellType.End:
        return "bg-red-500";
      case CellType.Path:
        return "bg-blue-500 grid grid-cols-3 grid-rows-3";
      case CellType.Visited:
        return "bg-yellow-500";
      case CellType.Empty:
        return "bg-white cursor-pointer";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="dijkstra-grid flex gap-4">
      <div
        className="grid grid-cols border"
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={(e) => handleMouseMove(e)}
        onMouseLeave={() => setIsDrawing(false)}
        onMouseUp={handleMouseUp}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                }}
                data-row={rowIndex}
                data-column={cellIndex}
                className={`grid-item border hover:bg-neutral-500 ${getCellStylesByType(
                  cell
                )}`}
              >
                {cell.type === CellType.Path &&
                  drawInnerGrid(rowIndex, cellIndex, grid)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <PathfinderControls
        drawingMode={drawingMode}
        setDrawingMode={setDrawingMode}
        resetGrid={resetGrid}
        resetCalculatedCells={resetCalculatedCells}
        runAlgorithm={runAlgorithm}
        isRunning={isRunning}
        result={
          result
            ? result.path
              ? "Path found with " + (result.path.length - 2) + " steps."
              : "No path found."
            : null
        }
      />
    </div>
  );
}

export default PathfinderGridV2;
