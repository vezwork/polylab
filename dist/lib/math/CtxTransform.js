import { makeOtherFunctions } from "../math2/num.js";
export const id = [1, 0, 0, 1, 0, 0];
export const inv = (t1) => {
    var d = 1 / (t1[0] * t1[3] - t1[1] * t1[2]);
    return [
        t1[3] * d,
        -t1[1] * d,
        -t1[2] * d,
        t1[0] * d,
        d * (t1[2] * t1[5] - t1[3] * t1[4]),
        d * (t1[1] * t1[4] - t1[0] * t1[5]),
    ];
};
/**
 * read `_(t2)(t1)` as "`t2` after `t1`".
 */
export const _ = (t2, sqrtHack) => (t1) => {
    const m11 = t1[0] * t2[0] + t1[2] * t2[1];
    const m12 = t1[1] * t2[0] + t1[3] * t2[1];
    const m21 = t1[0] * t2[2] + t1[2] * t2[3];
    const m22 = t1[1] * t2[2] + t1[3] * t2[3];
    const dx = t1[0] * t2[4] + t1[2] * t2[5] + t1[4];
    const dy = t1[1] * t2[4] + t1[3] * t2[5] + t1[5];
    return [m11, m12, m21, m22, sqrtHack ? dx / 2 : dx, sqrtHack ? dy / 2 : dy];
};
export const translation = (v) => [1, 0, 0, 1, v[0], v[1]];
export const scale = (s) => [s[0], 0, 0, s[1], 0, 0];
export const rotation = (rad) => [
    Math.cos(rad),
    -Math.sin(rad),
    Math.sin(rad),
    Math.cos(rad),
    0,
    0,
]; //not tested
export const zeroTranslate = (t) => [
    t[0],
    t[1],
    t[2],
    t[3],
    0,
    0,
];
export const unitScaleAndRotation = (t) => [
    1,
    0,
    0,
    1,
    t[4],
    t[5],
];
export const addEntries = (t1) => (t2) => [
    t1[0] + t2[0],
    t1[1] + t2[1],
    t1[2] + t2[2],
    t1[3] + t2[3],
    t1[4] + t2[4],
    t1[5] + t2[5],
];
export const subEntries = (t1) => (t2) => [
    t1[0] - t2[0],
    t1[1] - t2[1],
    t1[2] - t2[2],
    t1[3] - t2[3],
    t1[4] - t2[4],
    t1[5] - t2[5],
];
export const scalarMul = (s) => (t1) => [t1[0] * s, t1[1] * s, t1[2] * s, t1[3] * s, t1[4] * s, t1[5] * s];
// probably not a good way to interpolate transforms, but thats ok for now
export const lerp = (start, end, t) => addEntries(start)(scalarMul(t)(subEntries(end)(start)));
export const apply = (t) => ([x, y]) => [x * t[0] + y * t[2] + t[4], x * t[1] + y * t[3] + t[5]];
export const applyToVec = (t) => (v) => apply(zeroTranslate(t))(v);
// Field stuff
export const zero = [0, 0, 0, 0, 0, 0];
const CtxTransformField = {
    one: id,
    zero,
    add: addEntries,
    mul: _,
    inv: inv,
    neg: subEntries(zero),
};
export const { exp, pow, sqrt, div, divTo } = makeOtherFunctions({
    ...CtxTransformField,
    nummul: scalarMul,
});
export const erp = (start) => (end) => (n) => _(start)(pow(divTo(start)(end))(n));
export const approxEq = (t1) => (t2) => Math.abs(t1[0] - t2[0]) <= Number.EPSILON &&
    Math.abs(t1[1] - t2[1]) <= Number.EPSILON &&
    Math.abs(t1[2] - t2[2]) <= Number.EPSILON &&
    Math.abs(t1[3] - t2[3]) <= Number.EPSILON &&
    Math.abs(t1[4] - t2[4]) <= Number.EPSILON &&
    Math.abs(t1[5] - t2[5]) <= Number.EPSILON;
export const assign = (t1) => (t2) => {
    t1[0] = t2[0];
    t1[1] = t2[1];
    t1[2] = t2[2];
    t1[3] = t2[3];
    t1[4] = t2[4];
    t1[5] = t2[5];
};
