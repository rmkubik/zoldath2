import { getDimensions } from "functional-game-utils";
import { Location } from "./Grid";

function getAllMatchingLocations<T>(
  tiles: T[][],
  matcher: (tile, location) => boolean
): Location[] {
  const { width, height } = getDimensions(tiles);
  const matches: Location[] = [];

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (matcher(tiles[row][col], { row, col })) {
        matches.push({ row, col });
      }
    }
  }

  return matches;
}

export default getAllMatchingLocations;
