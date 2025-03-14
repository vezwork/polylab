// Mini custom Vec2 library

export type Vec2 = [number, number];

export const X: Vec2 = [1, 0];
export const Y: Vec2 = [0, 1];
export const UP: Vec2 = [0, -1];
export const LEFT: Vec2 = [-1, 0];
export const DOWN: Vec2 = [0, 1];
export const RIGHT: Vec2 = [1, 0];

export const x = (v: Vec2): number => v[0];
export const y = (v: Vec2): number => v[1];

export const v = (xOrBoth: number, y?: number): Vec2 =>
  y === undefined ? [xOrBoth, xOrBoth] : [xOrBoth, y];

export const add = (v1: Vec2, v2: Vec2): Vec2 => [v1[0] + v2[0], v1[1] + v2[1]];

export const sub = (v1: Vec2, v2: Vec2): Vec2 => [v1[0] - v2[0], v1[1] - v2[1]];

export const mul = (n: number, v: Vec2): Vec2 => [n * v[0], n * v[1]];
export const scale = (v1: Vec2, v2: Vec2): Vec2 => [
  v1[0] * v2[0],
  v1[1] * v2[1],
];

export const dot = (v1: Vec2, v2: Vec2): number =>
  v1[0] * v2[0] + v1[1] * v2[1];

export const length = (v: Vec2): number => Math.sqrt(dot(v, v));

export const normalize = (v: Vec2): Vec2 => mul(1 / length(v), v);

export const setLength = (l: number, v: Vec2): Vec2 => mul(l, normalize(v));

export const angleOf = (v: Vec2): number => Math.atan2(v[1], v[0]);

export const angleBetween = (v1: Vec2, v2: Vec2): number =>
  angleOf(sub(v2, v1));

export const distance = (v1: Vec2, v2: Vec2): number => length(sub(v1, v2));

export const round = (v: Vec2) => v.map(Math.round);

// name ref: https://twitter.com/FreyaHolmer/status/1587900959891472384
// same as coLerp, but at the origin
export const basisProj = (base: Vec2) => (v: Vec2) =>
  dot(v, base) / dot(base, base);
// ==: `dot(v, base) / length(base)`

export const proj = (base: Vec2) => (v: Vec2) =>
  mul(dot(v, base) / dot(base, base), base);
// ==: `mul(dot(v, normalize(base)), normalize(base))` and `mul(basisProj(base)(v), base)
export const reject =
  (base: Vec2) =>
  (p: Vec2): Vec2 =>
    sub(p, proj(base)(p));

// reference: https://en.wikipedia.org/wiki/Rotation_matrix
export const rotate = (v: Vec2, theta: number): Vec2 => [
  Math.cos(theta) * v[0] - Math.sin(theta) * v[1],
  Math.sin(theta) * v[0] + Math.cos(theta) * v[1],
];
export const rotateAround =
  (around: Vec2) =>
  (v: Vec2, theta: number): Vec2 =>
    add(around, rotate(sub(v, around), theta));
export const rotateQuarterXY = (v: Vec2): Vec2 => [-v[1], v[0]];
export const rotateQuarterYX = (v: Vec2): Vec2 => [v[1], -v[0]];
export const normalVec2FromAngle = (theta: number): Vec2 => [
  Math.cos(theta),
  Math.sin(theta),
];
export const fromPolar = (length: number, theta: number): Vec2 => [
  length * Math.cos(theta),
  length * Math.sin(theta),
];
export const setAngle = (theta: number) => (v: Vec2) =>
  mul(length(v), normalVec2FromAngle(theta));
export const setAngleFromVec = (angleVec: Vec2) => (v: Vec2) =>
  mul(length(v), normalize(angleVec));

export const assign = (v1: Vec2) => (v2: Vec2) => {
  v1[0] = v2[0];
  v1[1] = v2[1];
};

export const lerp = (start: Vec2, end: Vec2, t: number): Vec2 =>
  add(start, mul(t, sub(end, start)));
export const coLerp = (start: Vec2, end: Vec2, p: Vec2): number =>
  basisProj(sub(end, start))(sub(p, start));
export const rejecta = (start: Vec2, end: Vec2, p: Vec2): Vec2 =>
  reject(sub(end, start))(sub(p, start));
export const projecta = (start: Vec2, end: Vec2, v: Vec2) =>
  proj(sub(end, start))(sub(v, start));
