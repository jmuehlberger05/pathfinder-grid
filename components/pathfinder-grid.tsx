"use client";

import { useEffect, useRef, useState } from "react";

interface PathfinderGridProps {
  width: number;
  height: number;
}

type CellCoordinates = {
  rowIndex: number;
  columnIndex: number;
};

type MouseCoordinates = {
  x: number;
  y: number;
};

function PathfinderGrid({ width, height }: PathfinderGridProps) {
  const cellSize = 50;
  const gridRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState(() => {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({
        isWall: false,
        isStartingPoint: false,
        isEndingPoint: false,
        isVisited: false,
        isPath: false,
      }))
    );
  });

  // #region Drawing

  const [drawingMode, setDrawingMode] = useState<"wall" | "start" | "end">(
    "wall"
  );
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || drawingMode != "wall") return;

    console.log("Mouse move");
    setMouseCoords({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // * Draw wall
  const drawWall = (mouseCoords: MouseCoordinates) => {
    const cellCoords = getCellCoordinates(mouseCoords);
    if (!cellCoords) {
      console.warn("Invalid cell coordinates:", mouseCoords);
      return;
    }

    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[cellCoords.rowIndex][cellCoords.columnIndex].isWall = true;
      return newGrid;
    });
  };

  // * Draw start or end point
  const drawStartOrEnd = (
    mouseCoords: MouseCoordinates,
    mode: "start" | "end"
  ) => {
    const cellCoords = getCellCoordinates(mouseCoords);
    if (!cellCoords) {
      console.warn("Invalid cell coordinates:", mouseCoords);
      return;
    }

    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      const cell = newGrid[cellCoords.rowIndex][cellCoords.columnIndex];

      // Reset previous start or end point
      if (mode === "start") {
        newGrid.forEach((row) =>
          row.forEach((c) => (c.isStartingPoint = false))
        );
        setStartingPointCoords(cellCoords);
        cell.isStartingPoint = true;
      } else if (mode === "end") {
        newGrid.forEach((row) => row.forEach((c) => (c.isEndingPoint = false)));
        setSndingPointCoords(cellCoords);
        cell.isEndingPoint = true;
      }

      return newGrid;
    });
  };

  const getCellCoordinates = (
    mouseCoords: MouseCoordinates
  ): CellCoordinates | null => {
    const rowIndex = Math.floor(mouseCoords.y / cellSize);
    const columnIndex = Math.floor(mouseCoords.x / cellSize);

    if (rowIndex > height - 1 || columnIndex > width - 1) {
      console.warn("Coordinates out of bounds:", { rowIndex, columnIndex });
      return null;
    }

    return { rowIndex, columnIndex };
  };

  useEffect(() => {
    console.log("Mouse coordinates:", mouseCoords);
    if (!isDrawing) return;

    drawingMode == "wall"
      ? drawWall(mouseCoords)
      : drawStartOrEnd(mouseCoords, drawingMode);
  }, [mouseCoords]);

  // #endregion Drawing

  // #region Actions

  const checkBounds = (rowIndex: number, columnIndex: number) => {
    return (
      rowIndex >= 0 &&
      rowIndex < height &&
      columnIndex >= 0 &&
      columnIndex < width
    );
  };

  const resetGrid = () => {
    setGrid(() =>
      Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({
          isStartingPoint: false,
          isEndingPoint: false,
          isVisited: false,
          isPath: false,
          isWall: false,
        }))
      )
    );
  };

  const resetAllVisitedCells = () => {
    setGrid((prevGrid) =>
      prevGrid.map((row) =>
        row.map((cell) => ({
          ...cell,
          isVisited: false,
          isPath: false,
        }))
      )
    );
  };

  const [isRunning, setIsRunning] = useState(false);
  const [startingPointCoords, setStartingPointCoords] =
    useState<CellCoordinates | null>(null);
  const [endingPointCoords, setSndingPointCoords] =
    useState<CellCoordinates | null>(null);
  const [visitedByIteration, setVisitedByIteration] = useState<
    Map<number, CellCoordinates[]>
  >(() => new Map());

  const [iterationCount, setIterationCount] = useState(0);

  // * Run the algorithm
  const runAlgorithm = () => {
    if (!startingPointCoords || !endingPointCoords) {
      alert("Please set both starting and ending points.");
      return;
    }

    resetAllVisitedCells();
    setIterationCount(0);
    setVisitedByIteration(new Map());
    console.log("Resetting grid and visited cells");

    // setting up the initial state
    const newMap = new Map(visitedByIteration);
    newMap.set(iterationCount, [startingPointCoords]);
    setVisitedByIteration(newMap);
    console.log("Running algorithm from:", startingPointCoords);
    console.log("Ending point:", endingPointCoords);
    console.log("Iteration count:", iterationCount);

    setIsRunning(true);

    const newlyVisitedCells = setVisitedAroundCell(startingPointCoords);
    console.log("Newly visited cells:", newlyVisitedCells);

    setIsRunning(false);
  };

  // * Effect to handle newly visited cells
  // This effect will run whenever newlyVisitedCells changes
  useEffect(() => {
    if (visitedByIteration.size === 0) return;

    const nextIteration = new Map(visitedByIteration);
    const newlyVisitedCells: CellCoordinates[] = [];

    console.log("Newly visited cells:", visitedByIteration);

    const items = nextIteration.get(iterationCount);

    if (!items || items.length === 0) {
      console.log("No newly visited cells for this iteration.");
      return;
    }

    items.forEach((cellCoords) => {
      const visitedCells = setVisitedAroundCell(cellCoords);
      newlyVisitedCells.push(...visitedCells);
    });

    // Clear newly visited cells after processing
    nextIteration.set(iterationCount + 1, newlyVisitedCells);

    setIterationCount((prev) => prev + 1);
  }, [visitedByIteration, iterationCount]);

  // * Set visited cells around the current cell
  const setVisitedAroundCell = (
    cellCoords: CellCoordinates
  ): CellCoordinates[] => {
    const newlyVisitedCells: CellCoordinates[] = [];

    const newGrid = grid;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (Math.abs(dy) === Math.abs(dx)) continue; // Skip diagonals

        if (
          !checkBounds(cellCoords.rowIndex + dy, cellCoords.columnIndex + dx)
        ) {
          continue;
        }

        const newRowIndex = cellCoords.rowIndex + dy;
        const newColumnIndex = cellCoords.columnIndex + dx;

        if (newGrid[newRowIndex][newColumnIndex].isEndingPoint) {
          alert("Reached the ending point!");
          break;
        }

        if (
          newRowIndex >= 0 &&
          newRowIndex < height &&
          newColumnIndex >= 0 &&
          newColumnIndex < width &&
          !newGrid[newRowIndex][newColumnIndex].isWall &&
          !newGrid[newRowIndex][newColumnIndex].isStartingPoint &&
          !newGrid[newRowIndex][newColumnIndex].isEndingPoint &&
          !newGrid[newRowIndex][newColumnIndex].isVisited
        ) {
          newlyVisitedCells.push({
            rowIndex: newRowIndex,
            columnIndex: newColumnIndex,
          });
          newGrid[newRowIndex][newColumnIndex].isVisited = true;
        }
      }
    }
    setGrid(newGrid);
    return newlyVisitedCells;
  };

  // #endregion Actions

  return (
    <div className="dijkstra-grid flex gap-4">
      <div
        className="grid grid-cols border"
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={(e) => handleMouseMove(e)}
        onMouseLeave={() => setIsDrawing(false)}
        onMouseUp={handleMouseUp}
        ref={gridRef}
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
                className={`grid-item border hover:bg-neutral-500 
                    ${cell.isVisited ? "bg-yellow-500" : ""}
                    ${cell.isPath ? "bg-blue-500" : ""}
                    ${cell.isWall ? "bg-neutral-500" : ""}
                    ${cell.isStartingPoint ? "bg-green-500" : ""}
                    ${cell.isEndingPoint ? "bg-red-500" : ""}
                    `}
              ></div>
            ))}
          </div>
        ))}
      </div>
      <aside className="controls pt-2">
        <h2 className="font-bold text-xl pb-4">Shitty Pathfinder Algorithm</h2>
        {/* Drawing Mode Selector */}
        <div className="grid grid-cols-3 pb-4 w-full">
          <button
            onClick={() => setDrawingMode("wall")}
            className={`clear px-4 py-1  hover:bg-neutral-200 border border-neutral-300 rounded-l 
                ${
                  drawingMode === "wall" ? "bg-neutral-300" : "bg-neutral-100"
                }`}
          >
            Wall
          </button>
          <button
            onClick={() => setDrawingMode("start")}
            className={`clear px-4 py-1  hover:bg-neutral-200 border-y border-neutral-300 ${
              drawingMode === "start" ? "bg-neutral-300" : "bg-neutral-100"
            }`}
          >
            Start
          </button>
          <button
            onClick={() => setDrawingMode("end")}
            className={`clear px-4 py-1 hover:bg-neutral-200 rounded-r border border-neutral-300 ${
              drawingMode === "end" ? "bg-neutral-300" : "bg-neutral-100"
            }`}
          >
            End
          </button>
        </div>
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={resetGrid}
            className="clear px-4 py-1 bg-neutral-200 hover:bg-neutral-300 rounded"
          >
            Reset the Grid
          </button>
          <button
            onClick={runAlgorithm}
            className="clear px-4 py-1 bg-neutral-200 hover:bg-neutral-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isRunning}
          >
            Run the Algorithm
          </button>
        </div>
      </aside>
    </div>
  );
}

export default PathfinderGrid;
