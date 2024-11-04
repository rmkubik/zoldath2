import { getDimensions } from "functional-game-utils";

function forEachMatrix(callback, matrix) {
  const { width, height } = getDimensions(matrix);
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      callback(matrix[row][col], { row, col });
    }
  }
}

export default forEachMatrix;
