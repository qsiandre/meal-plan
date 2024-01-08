export function filterNull<T>(xs: (T | null | undefined)[]): T[] {
  const nonNull = [];
  for (let x of xs) {
    if (x == null) {
      continue;
    }
    nonNull.push(x);
  }
  return nonNull;
}
