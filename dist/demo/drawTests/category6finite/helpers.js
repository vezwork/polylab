import { func } from "./api.js";
// const pair = (a, b, ab = [] as any[]) => {
//   ab[0] = [];
//   const e1 = to(() => (ab[0][0] = a[0]))(a)(ab);
//   const e2 = to(() => (ab[0][1] = b[0]))(b)(ab);
//   const ope1 = to(() => (a[0] = ab[0][0]))(ab)(a);
//   const ope2 = to(() => (b[0] = ab[0][1]))(ab)(b);
//   op(e1, ope1);
//   op(e2, ope2);
//   and([e1, e2]);
//   return ab;
//   //return and([e1, e2]);
// };
// IMPORTANT: Update order matters!
// e.g. if `c` updates but not `b` or `a`, then this will only set `a` with `a = c - b`.
export const plus = (a, b, debug) => {
    const c = func((a, b) => a + b)(a, b);
    c.debug = debug;
    func((a, c) => c - a, b)(a, c);
    func((b, c) => c - b, a)(b, c);
    return c;
};
export const sub = (a, b, debug) => {
    const c = func((a, b) => a - b)(a, b);
    c.debug = debug;
    func((a, c) => a - c, b)(a, c);
    func((b, c) => c + b, a)(b, c);
    return c;
};
export const mul = (a, b, debug) => {
    const c = func((a, b) => a * b)(a, b);
    c.debug = debug;
    func((a, c) => c / a, b)(a, c);
    func((b, c) => c / b, a)(b, c);
    return c;
};
export const div = (a, b) => {
    const c = func((a, b) => a / b)(a, b);
    func((a, c) => a / c, b)(a, c);
    func((b, c) => c * b, a)(b, c);
    return c;
};
export const log = (...items) => func(console.log)(...items);
