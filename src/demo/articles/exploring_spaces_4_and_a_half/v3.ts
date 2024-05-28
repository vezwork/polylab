export type V3 = [number, number, number];
export const v3x = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const v3dot = (a: V3, b: V3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const v3mul = (n: number, v: V3): V3 => [n * v[0], n * v[1], n * v[2]];
export const v3add = (a: V3, b: V3): V3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
// ref: https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
export const v3rot =
  (axis: V3, theta: number) =>
  (v: V3): V3 =>
    v3add(
      v3add(v3mul(Math.cos(theta), v), v3mul(Math.sin(theta), v3x(axis, v))),
      v3mul(v3dot(axis, v) * (1 - Math.cos(theta)), axis)
    );
export const v3length = ([x, y, z]: V3) => Math.sqrt(x ** 2 + y ** 2 + z ** 2);
export const v3normalize = (v: V3): V3 => v3mul(1 / v3length(v), v);
