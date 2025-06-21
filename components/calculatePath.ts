import { checkBounds } from "./pathfinder-grid-v2";
import { CellCoordinates, CellType, GridData, Path } from "./types";

const directions = [
  { row: -1, column: 0 }, // Up
  { row: 1, column: 0 }, // Down
  { row: 0, column: -1 }, // Left
  { row: 0, column: 1 }, // Right
  // { row: -1, column: -1 }, // Up Left
  // { row: -1, column: 1 }, // DOwn Left
  // { row: 1, column: -1 }, // Up Right
  // { row: 1, column: 1 }, // Down Right
];

export const calculatePath = async (
  grid: GridData,
  start: CellCoordinates,
  end: CellCoordinates,
  updateView: (grid: GridData) => void
): Promise<{ gridData: GridData; path: Path }> => {
  let newGrid = grid;
  let calculatedPath: Path | null = null;

  const activePaths: Set<Path> = new Set();
  activePaths.add([start]);

  // Loop until a path is found or no more paths can be explored
  for (
    let iteration = 0;
    iteration < grid.length * grid[1].length;
    iteration++
  ) {
    if (activePaths.size === 0) {
      console.log("No paths found");
      break;
    }

    if (calculatedPath) {
      break;
    }

    const paths = Array.from(activePaths);
    activePaths.clear();

    paths.forEach(async (path) => {
      const validNeighbors = checkNeighbors(path, activePaths, newGrid, end);

      // If the Endpoint is reached, apply the Path to the Grid and
      if (validNeighbors.finished) {
        let completedPath = validNeighbors.path!;

        if (!calculatedPath) {
          console.log("Path found: ", completedPath);
          newGrid = applyPathToGrid(newGrid, path, updateView);
          calculatedPath = completedPath;

          updateView(newGrid);
        }
      }

      // Else Create a new path by adding the neighbor to the current path
      else if (validNeighbors.neighbors.length > 0) {
        validNeighbors.neighbors.forEach((neighbor) => {
          let newPath = [...path, neighbor];
          activePaths.add(newPath);

          // Update the grid with the new path as Visited
          const type = newGrid[neighbor.row][neighbor.column].type;

          if (type === CellType.End || type === CellType.Start) {
          } else {
            newGrid[neighbor.row][neighbor.column].type = CellType.Visited;
          }
        });
      }
    });

    updateView(newGrid);
    await delay(100); // oder 50ms je nach Bedarf

    console.log(
      `Iteration ${iteration + 1}: Active paths count: ${activePaths.size}`
    );
  }

  if (!calculatedPath) {
    alert("No path found after all iterations.");
  }
  // Implement pathfinding algorithm here
  // For now, just return the original grid
  updateView(newGrid);
  return {
    gridData: newGrid,
    path: calculatedPath ? calculatedPath : [],
  };
};

// Function to check neighbors of the last position in the path
const checkNeighbors = (
  currentPath: Path,
  activePaths: Set<Path>,
  grid: GridData,
  endPoint: CellCoordinates
): {
  finished: boolean;
  neighbors: CellCoordinates[];
  path: Path | null;
} => {
  let neighbors: CellCoordinates[] = [];
  let path: Path | null = null;

  let lastPosition = currentPath[currentPath.length - 1];

  directions.forEach((dir) => {
    let newRow = lastPosition.row + dir.row;
    let newColumn = lastPosition.column + dir.column;

    // Check if the new position is the end position
    if (newRow === endPoint.row && newColumn === endPoint.column) {
      neighbors.push({ row: newRow, column: newColumn });
      currentPath.push({ row: newRow, column: newColumn });
      path = currentPath;
    }

    // Check if the new position is within bounds and not a wall and not already in a path
    if (
      checkBounds(newRow, newColumn, grid) &&
      grid[newRow][newColumn].type !== CellType.Wall &&
      !Array.from(activePaths).some((cp) =>
        cp.some((p) => p.row === newRow && p.column === newColumn)
      )
    ) {
      neighbors.push({ row: newRow, column: newColumn });
    }
  });

  return {
    finished: path ? true : false,
    path,
    neighbors,
  };
};

// Apply the found Path to the Grid but leave the Start and Endpoint unchanged
const applyPathToGrid = (
  grid: GridData,
  path: Path,
  updateView: (grid: GridData) => void
): GridData => {
  const newGrid = grid;

  path.forEach((position) => {
    const type = newGrid[position.row][position.column].type;
    if (type != CellType.End && type != CellType.Start) {
      newGrid[position.row][position.column].type = CellType.Path;
    }
    updateView(newGrid);

    delay(50);
  });

  return newGrid;
};

const delay = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
