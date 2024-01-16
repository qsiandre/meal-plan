export async function throttle<T, Out>(
  xs: T[],
  gen: (x: T) => Promise<Out>,
  onBatch: (r: [T, Awaited<Out>][], f: T[]) => Promise<any>,
  max: number = 4
) {
  let ix = 0;
  while (ix < xs.length) {
    const batch = [];
    const id = [];
    for (let r = 0; r < max && ix < xs.length; r++, ix++) {
      id.push(xs[ix]);
      batch.push(gen(xs[ix]));
    }
    const results = await Promise.allSettled(batch);
    const success: [T, Awaited<Out>][] = [];
    const fail = [];
    for (let i = 0; i < id.length; i++) {
      const r = results[i];
      if (r.status == "fulfilled") {
        success.push([id[i], r.value]);
      } else {
        fail.push(id[i]);
      }
    }
    try {
      await onBatch(success, fail);
    } catch (e) {
      console.error(e);
    }
  }
}
