## Start

- Startingpoint
- Endingpoint

** Loop through active Paths **

## Process (Path, Endingpoint, GridData)

- Find all Valid Neigbors of a Cell

- If Contains EndingPoint: return Path
- If is already in Path: invalid
- If Contains Wall: invalid
- If Out of Bounds: invalid

- If Blank or Path: return Cells

### then

- Create new Paths from valid Neigbors (with the history of the parent path)
- Add to currentActivePaths ()

### when loop finish

- clear all Active Paths
- Move Items from CAP to AP
- Clear all CAPs
