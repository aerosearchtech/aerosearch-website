// [min, max] of a numeric array. A loop, not Math.min(...v): spreading
// ~100k+ values exceeds the engine's argument limit and throws.
export function extent(values: ArrayLike<number>): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] < lo) lo = values[i];
    if (values[i] > hi) hi = values[i];
  }
  return [lo, hi];
}
