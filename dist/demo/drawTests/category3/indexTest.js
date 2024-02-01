import { take } from "../../../lib/structure/Iterable.js";
import { constructor, e, propagateForward, se } from "./api.js";
import { inv } from "./lib.js";
const A = constructor(() => [100], "A");
const B = constructor(() => [10], "B");
const AB = constructor(() => [1], "AB");
e(A, A)({
    forward(ain, aout) {
        aout[0] = ain[0] + 1;
    },
    backward() { },
});
const sed = se(A, B, AB)({
    forward: (a, b, ab) => {
        ab[0] = a[0] + b[0];
    },
    backward: () => { },
});
const [l, r] = sed;
e(A, B, [l, inv(r)])({
    forward: (a, b) => {
        b[0] = a[0] + 9;
    },
    backward: () => { },
});
console.log("YO", [...take(10, propagateForward(A))]);
