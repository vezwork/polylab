// I want to library-ify category5finite so that it is ready to
// play around with in an article. It doesn't have to be perfect,
// but currently category5finite is pretty incomprehensible to
// others and probably to future me as well.
import { push, to, op, and } from "./core.js";
const pair = (a, b, ab = []) => {
    ab[0] = [];
    const e1 = to(() => (ab[0][0] = a[0]))(a)(ab);
    const e2 = to(() => (ab[0][1] = b[0]))(b)(ab);
    const ope1 = to(() => (a[0] = ab[0][0]))(ab)(a);
    const ope2 = to(() => (b[0] = ab[0][1]))(ab)(b);
    op(e1, ope1);
    op(e2, ope2);
    and([e1, e2]);
    return ab;
    //return and([e1, e2]);
};
const plus = (a, b, c = []) => {
    to(([[a, b]], c) => (c[0] = a + b))(pair(a, b))(c);
    to(([[a, c]], b) => (b[0] = c - a))(pair(a, c))(b);
    to(([[b, c]], a) => (a[0] = c - b))(pair(b, c))(a);
    return c;
};
const a = [2];
const b = [];
const ab = pair(a, b);
const c = [];
const abc = pair(ab, c);
const o = [];
plus(a, o, c);
to((a, b) => (b[0] = a[0] * 10))(b)(c);
to((a, b) => (b[0] = a[0] / 10))(c)(b);
to((a, b) => (b[0] = a[0] * 10))(a)(b);
to((a, b) => (b[0] = a[0] / 10))(b)(a);
push(a);
// const andTrack = andTracker(node2);
// console.log(
//   "does and->4 come after and->3?",
//   andTrack.get(andNode4)?.has(pairEdgeAnds)
// );
// console.log(
//   "does and->3 come after and->4?",
//   andTrack.get(pairEdgeAnds)?.has(andNode4)
// );
console.log({ a, b, ab, c, abc, o });
c[0] = -1;
push(c);
console.log({ a, b, ab, c, abc, o });
// const aa = datum(5);
// const a = datum();
// assign(aa, a);
// // const a0 = datum();
// // accessorLens(a)(a0, 0);
// const b = plus(a, 2);
// const bb = plus(b, 2);
// const c = plus(a, bb);
// log("hello!", a, b, bb, c);
// push(aa);
// console.log([a, b, c].map((d) => d.value));
