import { _, addEntries, id, inv, scalarMul, subEntries, } from "../../lib/math/CtxTransform.js";
import { makeOtherFunctions } from "../../lib/math2/num.js";
import { take } from "../../lib/structure/Iterable.js";
const cAdd = ([x1, i1]) => ([x2, i2]) => [x1 + x2, i1 + i2];
const cMul = ([x1, i1]) => ([x2, i2]) => [x1 * x2 - i1 * i2, x1 * i2 + x2 * i1];
const complexNumberField = {
    one: [1, 0],
    zero: [0, 0],
    add: cAdd,
    mul: cMul,
    inv: ([x, i]) => [x / (x ** 2 + i ** 2), -i / (x ** 2 + i ** 2)],
    neg: ([x, i]) => [-x, -i],
};
const numberField = {
    one: 1,
    zero: 0,
    add: (a) => (b) => a + b,
    mul: (a) => (b) => a * b,
    inv: (a) => 1 / a,
    neg: (a) => -a,
    // with
};
const xor = (a) => (b) => a ? !b : b;
const booleanField = {
    one: true,
    zero: false,
    add: xor,
    mul: (a) => (b) => a && b,
    inv: (a) => !a,
    neg: (a) => a,
};
const { convergingExp, ln, convergingSqrt, div } = makeOtherFunctions({
    ...numberField,
    nummul: (a) => (b) => a * b,
});
console.log([...take(30, convergingExp(10))]);
console.log("OKAY", ln(13), Math.log(13));
function b() {
    const { convergingExp, convergingSqrt, div } = makeOtherFunctions({
        ...booleanField,
        nummul: (a) => (b) => a === 0 ? false : b,
    });
    console.log([...take(10, convergingExp(true))]);
}
b();
function c() {
    const { convergingExp, convergingSqrt, div } = makeOtherFunctions({
        ...complexNumberField,
        nummul: (a) => ([x, i]) => [a * x, a * i],
    });
    console.log([...take(30, convergingExp([0, Math.PI]))]);
}
c();
function d() {
    const zero = [0, 0, 0, 0, 0, 0];
    const CtxTransformField = {
        one: id,
        zero,
        add: addEntries,
        mul: _,
        inv: inv,
        neg: subEntries(zero),
    };
    const { convergingExp, convergingSqrt, div } = makeOtherFunctions({
        ...CtxTransformField,
        nummul: scalarMul,
    });
    console.log([
        ...take(30, convergingExp(scalarMul(1.55)([-1, -1, 1, 0, 0, 0]))),
    ]);
}
d();
