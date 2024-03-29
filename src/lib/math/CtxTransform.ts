import { Field, makeOtherFunctions } from "../math2/num.js";
import { Vec2 } from "./Vec2.js";

export type CtxTransform = [number, number, number, number, number, number];
export const id: CtxTransform = [1, 0, 0, 1, 0, 0];
export const inv = (t1: CtxTransform): CtxTransform => {
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
export const _ =
  (t2: CtxTransform, sqrtHack?: boolean) =>
  (t1: CtxTransform): CtxTransform => {
    const m11 = t1[0] * t2[0] + t1[2] * t2[1];
    const m12 = t1[1] * t2[0] + t1[3] * t2[1];

    const m21 = t1[0] * t2[2] + t1[2] * t2[3];
    const m22 = t1[1] * t2[2] + t1[3] * t2[3];

    const dx = t1[0] * t2[4] + t1[2] * t2[5] + t1[4];
    const dy = t1[1] * t2[4] + t1[3] * t2[5] + t1[5];

    return [m11, m12, m21, m22, sqrtHack ? dx / 2 : dx, sqrtHack ? dy / 2 : dy];
  };
export const translation = (v: Vec2): CtxTransform => [1, 0, 0, 1, v[0], v[1]];
export const scale = (s: Vec2): CtxTransform => [s[0], 0, 0, s[1], 0, 0];
export const rotation = (rad: number): CtxTransform => [
  Math.cos(rad),
  -Math.sin(rad),
  Math.sin(rad),
  Math.cos(rad),
  0,
  0,
]; //not tested

export const zeroTranslate = (t: CtxTransform): CtxTransform => [
  t[0],
  t[1],
  t[2],
  t[3],
  0,
  0,
];
export const unitScaleAndRotation = (t: CtxTransform): CtxTransform => [
  1,
  0,
  0,
  1,
  t[4],
  t[5],
];

export const addEntries =
  (t1: CtxTransform) =>
  (t2: CtxTransform): CtxTransform =>
    [
      t1[0] + t2[0],
      t1[1] + t2[1],
      t1[2] + t2[2],
      t1[3] + t2[3],
      t1[4] + t2[4],
      t1[5] + t2[5],
    ];
export const subEntries =
  (t1: CtxTransform) =>
  (t2: CtxTransform): CtxTransform =>
    [
      t1[0] - t2[0],
      t1[1] - t2[1],
      t1[2] - t2[2],
      t1[3] - t2[3],
      t1[4] - t2[4],
      t1[5] - t2[5],
    ];
export const scalarMul =
  (s: number) =>
  (t1: CtxTransform): CtxTransform =>
    [t1[0] * s, t1[1] * s, t1[2] * s, t1[3] * s, t1[4] * s, t1[5] * s];
// probably not a good way to interpolate transforms, but thats ok for now
export const lerp = (
  start: CtxTransform,
  end: CtxTransform,
  t: number
): CtxTransform => addEntries(start)(scalarMul(t)(subEntries(end)(start)));

export const apply =
  (t: CtxTransform) =>
  ([x, y]: Vec2): Vec2 =>
    [x * t[0] + y * t[2] + t[4], x * t[1] + y * t[3] + t[5]];

export const applyToVec =
  (t: CtxTransform) =>
  (v: Vec2): Vec2 =>
    apply(zeroTranslate(t))(v);

// Field stuff

export const zero: CtxTransform = [0, 0, 0, 0, 0, 0];
const CtxTransformField: Field<CtxTransform> = {
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
export const erp =
  (start: CtxTransform) => (end: CtxTransform) => (n: number) =>
    _(start)(pow(divTo(start)(end))(n));

export const approxEq = (t1: CtxTransform) => (t2: CtxTransform) =>
  Math.abs(t1[0] - t2[0]) <= Number.EPSILON &&
  Math.abs(t1[1] - t2[1]) <= Number.EPSILON &&
  Math.abs(t1[2] - t2[2]) <= Number.EPSILON &&
  Math.abs(t1[3] - t2[3]) <= Number.EPSILON &&
  Math.abs(t1[4] - t2[4]) <= Number.EPSILON &&
  Math.abs(t1[5] - t2[5]) <= Number.EPSILON;

export const assign = (t1: CtxTransform) => (t2: CtxTransform) => {
  t1[0] = t2[0];
  t1[1] = t2[1];
  t1[2] = t2[2];
  t1[3] = t2[3];
  t1[4] = t2[4];
  t1[5] = t2[5];
};
