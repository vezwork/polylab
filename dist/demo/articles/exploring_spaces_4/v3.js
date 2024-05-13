export const v3x = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
];
export const v3dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const v3mul = (n, v) => [n * v[0], n * v[1], n * v[2]];
export const v3add = (a, b) => [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2],
];
// ref: https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
export const v3rot = (axis, theta) => (v) => v3add(v3add(v3mul(Math.cos(theta), v), v3mul(Math.sin(theta), v3x(axis, v))), v3mul(v3dot(axis, v) * (1 - Math.cos(theta)), axis));
export const v3length = ([x, y, z]) => Math.sqrt(x ** 2 + y ** 2 + z ** 2);
export const v3normalize = (v) => v3mul(1 / v3length(v), v);
