function remove<T>(array: T[], index: number): T[] {
  // We do not allow removal of index out of bounds of this array
  if (index < 0 || index > array.length - 1) return array;
  return [...array.slice(0, index), ...array.slice(index + 1)];
}

export default remove;
