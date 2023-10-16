export const recursiveJSONLift = (fn) => (arg) => {
    if (Array.isArray(arg))
        return arg.map(recursiveJSONLift(fn));
    if (typeof arg === "object" && arg !== null) {
        return Object.fromEntries(Object.entries(arg).map(([key, value]) => [
            key,
            recursiveJSONLift(fn)(value),
        ]));
    }
    return fn(arg);
};
export const objectLift = (fn) => (arg) => Object.fromEntries(Object.entries(arg).map(([key, value]) => [key, fn(value, key)]));
export const objectFilter = (fn) => (arg) => Object.fromEntries(Object.entries(arg).filter(([key, value]) => fn(value, key)));
export const objectZipUntil = (fn) => (arg1) => (arg2) => {
    const keys = [
        ...new Set([...Object.keys(arg1), ...Object.keys(arg2)]),
    ].sort((key1, key2) => key2.localeCompare(key1));
    for (const key of keys) {
        const result = fn(arg1[key], key)(arg2[key], key);
        if (result !== undefined)
            return result;
    }
    return undefined;
};
