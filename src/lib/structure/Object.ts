export const recursiveJSONLift = (fn) => (arg) => {
  if (Array.isArray(arg)) return arg.map(recursiveJSONLift(fn));
  if (typeof arg === "object" && arg !== null) {
    return Object.fromEntries(
      Object.entries(arg).map(([key, value]) => [
        key,
        recursiveJSONLift(fn)(value),
      ])
    );
  }
  return fn(arg);
};

export const isObject = (v) =>
  typeof v === "object" && !Array.isArray(v) && v !== null;

export const objectLift =
  <V>(fn: (v: V, key: string) => any) =>
  (arg: { [key: string]: V }) =>
    Object.fromEntries(
      Object.entries(arg).map(([key, value]) => [key, fn(value, key)])
    );

export const objectFilter =
  <V>(fn: (v: V, key: string) => any) =>
  (arg: { [key: string]: V }) =>
    Object.fromEntries(
      Object.entries(arg).filter(([key, value]) => fn(value, key))
    );

export const objectZipUntil =
  <T>(fn: (v: any, key: string) => (v: any, key: string) => undefined | T) =>
  (arg1: Object) =>
  (arg2: Object): T | undefined => {
    const keys = [
      ...new Set([...Object.keys(arg1), ...Object.keys(arg2)]),
    ].sort((key1, key2) => key2.localeCompare(key1));
    for (const key of keys) {
      const result = fn(arg1[key], key)(arg2[key], key);
      if (result !== undefined) return result;
    }
    return undefined;
  };
