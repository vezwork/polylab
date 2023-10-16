export const _ = (f) => (g) => (...args) => f(g(...args));
export const forkLift = (liftFn) => (ps) => (arg) => liftFn((fn) => fn(arg))(ps);
export const jsonLiftFn = (fn) => (arg) => {
    if (Array.isArray(arg))
        return arg.map(jsonLiftFn(fn));
    if (typeof arg === "object" && arg !== null) {
        return Object.fromEntries(Object.entries(arg).map(([key, value]) => [key, jsonLiftFn(fn)(value)]));
    }
    return fn(arg);
};
// adapted from https://medium.com/@jnkrtech/currying-and-uncurrying-in-javascript-and-flow-98877c8274ff
/**
 * curries in such a way that you pass 1 argument per call
 * e.g. `unaryCurry((a,b,c)=>a+b+c)` is equivalent to `a=>b=>c=>a+b+c`.
 */
const unaryCurryCollect = (...argsSoFar) => (fn) => (arg) => argsSoFar.length + 1 >= fn.length
    ? fn(...argsSoFar, arg)
    : curryCollect(...argsSoFar, arg)(fn);
export const unaryCurry = unaryCurryCollect();
/**
 * curries in such a way that you can pass as many arguments as you want at a time
 * e.g. `unaryCurry((a,b,c)=>a+b+c)` is equivalent to `a=>b=>c=>a+b+c`, or `(a,b)=>c=>a+b+c`, or `a=>(b,c)=>a+b+c`,...
 */
const curryCollect = (...argsSoFar) => (fn) => (...args) => argsSoFar.length + args.length >= fn.length
    ? fn(...argsSoFar, ...args)
    : curryCollect(...argsSoFar, ...args)(fn);
export const curry = curryCollect();
export const unCurry = (fn) => (...args) => {
    let i = 0;
    let f = fn;
    while (i < args.length)
        f = f(...args.slice(i, (i += f.length)));
    return f;
};
/**
 * inserts one layer of arrow after the first arg
 * e.g. `arrowAfterFirstArg((a,b,c)=>a+b+c)` is equivalent to `(a)=>(b,c)=>a+b+c`.
 */
export const arrowAfterFirstArg = (fn) => (arg1) => (...rest) => fn(arg1, ...rest);
/**
 * removes one layer of arrow, if there is more than one arrow.
 * e.g. `unArrow((a,b)=>(c)=>a+b+c)` is equivalent to `(a,b,c)=>a+b+c`.
 * e.g. `unArrow((a,b)=>a+b)` is equivalent to `(a,b)=>a+b`.
 */
export const unArrow = (fn) => (...args) => {
    const result = fn(...args.slice(0, fn.length));
    return typeof result === "function"
        ? result(...args.slice(fn.length))
        : result;
};
const rememberApsCollect = (prev) => (fn) => (...args) => {
    const result = fn(...args);
    const rootFn = prev.rootFn ?? fn;
    const memory = { rootFn, args: [...prev.args, args] };
    return typeof result === "function"
        ? rememberApsCollect(memory)(result)
        : { ...memory, result };
};
/**
 * remembers the arguments that were supplied to a curried function
 * e.g.
  ```
  const cat = a=>b=>a+b;
  const rCat = rememberAps(cat);
  rCat(1)(2)
  ```
  is equivalent to
  ```
  {
    name: 'cat',
    memory: [[1],[2]],
    result: 3
   }
 ```
 */
export const rememberAps = rememberApsCollect({ args: [] });
export const not = _((i) => !i);
export const eq = (v1) => (v2) => v1 === v2;
export const neq = (v1) => (v2) => v1 !== v2;
const fnWrap = (fn) => (...args) => ({ dog: fn(...args) });
const c = fnWrap((a, b) => a + b);
