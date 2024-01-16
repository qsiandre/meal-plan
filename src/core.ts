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

export function leftpad(n: any): string {
  const asStr = `${n}`;
  if (asStr.length == 1) {
    return `0${asStr}`;
  }
  return asStr;
}
