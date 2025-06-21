import { DrawingMode } from "./types";

interface PathfinderControlsProps {
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  resetGrid: () => void;
  resetCalculatedCells: () => void;
  runAlgorithm: () => void;
  isRunning: boolean;
  result: React.ReactNode | null;
}

function PathfinderControls({
  drawingMode,
  setDrawingMode,
  resetGrid,
  resetCalculatedCells,
  runAlgorithm,
  isRunning,
  result,
}: PathfinderControlsProps) {
  return (
    <aside className="controls pt-2">
      <h2 className="font-bold text-xl pb-4">Shitty Pathfinder Algorithm</h2>
      {/* Drawing Mode Selector */}
      <div className="grid grid-cols-3 pb-4 w-full">
        <button
          onClick={() => setDrawingMode(DrawingMode.Wall)}
          className={`clear px-4 py-1  hover:bg-neutral-200 border border-neutral-300 rounded-l 
                ${
                  drawingMode === "wall" ? "bg-neutral-300" : "bg-neutral-100"
                }`}
        >
          Wall
        </button>
        <button
          onClick={() => setDrawingMode(DrawingMode.Start)}
          className={`clear px-4 py-1  hover:bg-neutral-200 border-y border-neutral-300 ${
            drawingMode === "start" ? "bg-neutral-300" : "bg-neutral-100"
          }`}
        >
          Start
        </button>
        <button
          onClick={() => setDrawingMode(DrawingMode.End)}
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
          Clear the Grid
        </button>
        <button
          onClick={resetCalculatedCells}
          className="clear px-4 py-1 bg-neutral-200 hover:bg-neutral-300 rounded"
        >
          Reset Calculated Cells
        </button>
        <button
          onClick={runAlgorithm}
          className="clear px-4 py-1 bg-neutral-800 hover:bg-neutral-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
          disabled={isRunning}
        >
          Start Algorithm
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className="result mt-4 p-2 bg-neutral-100 border border-neutral-300 rounded">
          <h3 className="font-bold text-lg">Result</h3>
          <div className="text-sm">{result}</div>
        </div>
      )}
    </aside>
  );
}

export default PathfinderControls;
