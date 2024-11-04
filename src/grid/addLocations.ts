import { Location } from "./Grid";

function addLocations(a: Location, b: Location): Location {
  return { row: a.row + b.row, col: a.col + b.col };
}

export default addLocations;
