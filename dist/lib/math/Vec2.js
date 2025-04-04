// Mini custom Vec2 library
export const X = [1, 0];
export const Y = [0, 1];
export const UP = [0, -1];
export const LEFT = [-1, 0];
export const DOWN = [0, 1];
export const RIGHT = [1, 0];
export const x = (v) => v[0];
export const y = (v) => v[1];
export const v = (xOrBoth, y) => y === undefined ? [xOrBoth, xOrBoth] : [xOrBoth, y];
export const add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];
export const sub = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];
export const mul = (n, v) => [n * v[0], n * v[1]];
export const scale = (v1, v2) => [
    v1[0] * v2[0],
    v1[1] * v2[1],
];
export const dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1];
export const length = (v) => Math.sqrt(dot(v, v));
export const normalize = (v) => mul(1 / length(v), v);
export const setLength = (l, v) => mul(l, normalize(v));
export const angleOf = (v) => Math.atan2(v[1], v[0]);
export const angleBetween = (v1, v2) => angleOf(sub(v2, v1));
export const distance = (v1, v2) => length(sub(v1, v2));
export const round = (v) => v.map(Math.round);
// name ref: https://twitter.com/FreyaHolmer/status/1587900959891472384
// same as coLerp, but at the origin
export const basisProj = (base) => (v) => dot(v, base) / dot(base, base);
// ==: `dot(v, base) / length(base)`
export const proj = (base) => (v) => mul(dot(v, base) / dot(base, base), base);
// ==: `mul(dot(v, normalize(base)), normalize(base))` and `mul(basisProj(base)(v), base)
export const reject = (base) => (p) => sub(p, proj(base)(p));
// reference: https://en.wikipedia.org/wiki/Rotation_matrix
export const rotate = (v, theta) => [
    Math.cos(theta) * v[0] - Math.sin(theta) * v[1],
    Math.sin(theta) * v[0] + Math.cos(theta) * v[1],
];
export const rotateAround = (around) => (v, theta) => add(around, rotate(sub(v, around), theta));
export const rotateQuarterXY = (v) => [-v[1], v[0]];
export const rotateQuarterYX = (v) => [v[1], -v[0]];
export const normalVec2FromAngle = (theta) => [
    Math.cos(theta),
    Math.sin(theta),
];
export const fromPolar = (length, theta) => [
    length * Math.cos(theta),
    length * Math.sin(theta),
];
export const setAngle = (theta) => (v) => mul(length(v), normalVec2FromAngle(theta));
export const setAngleFromVec = (angleVec) => (v) => mul(length(v), normalize(angleVec));
export const assign = (v1) => (v2) => {
    v1[0] = v2[0];
    v1[1] = v2[1];
};
export const lerp = (start, end, t) => add(start, mul(t, sub(end, start)));
export const coLerp = (start, end, p) => basisProj(sub(end, start))(sub(p, start));
export const rejecta = (start, end, p) => reject(sub(end, start))(sub(p, start));
export const projecta = (start, end, v) => proj(sub(end, start))(sub(v, start));
