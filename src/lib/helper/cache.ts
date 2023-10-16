// Caches a function in one argument i.e. `const cachedFunc = cache(new Map())(func)`
export const cache =
  (cacheMap: Map<any, any>) => (f: (...args: any[]) => any) => (arg: any) =>
    cacheMap.get(arg) ?? cacheMap.set(arg, f(arg)).get(arg);
