import { v3length, v3mul, v3normalize, v3rot } from "./v3.js";
// 0 means 1, 1 means i, 2 means j, 3 means k
const qmulTable = [
    [0, 1, 2, 3],
    [1, -0, 3, -2],
    [2, -3, -0, 1],
    [3, 2, -1, -0],
];
// ref: https://dev.to/emnudge/identifying-negative-zero-2j1o
export const qmulTableSign = (num) => {
    if (Number(num) !== Number(num))
        return NaN;
    if (num === -Infinity)
        return -1;
    return 1 / num < 0 ? -1 : 1;
};
export const qscalarMul = (n, a) => [
    n * a[0],
    n * a[1],
    n * a[2],
    n * a[3],
];
export const qmul = (a, b) => {
    let result = [0, 0, 0, 0];
    for (let abase = 0; abase < 4; abase++) {
        for (let bbase = 0; bbase < 4; bbase++) {
            const t = qmulTable[abase][bbase];
            result[Math.abs(t)] += qmulTableSign(t) * a[abase] * b[bbase];
        }
    }
    return result;
};
export const qadd = (a, b) => {
    let result = [0, 0, 0, 0];
    for (let base = 0; base < 4; base++) {
        result[base] = a[base] + b[base];
    }
    return result;
};
export const qfromAxisAngle = (axis, angle) => [
    Math.cos(angle),
    ...v3mul(Math.sin(angle), axis),
];
export const qToAxisAngle = (a) => ({
    angle: Math.acos(a[0]),
    axis: v3mul(1 / Math.sin(Math.acos(a[0])), [a[1], a[2], a[3]]),
});
export const qconj = (a) => [a[0], -a[1], -a[2], -a[3]];
export const qnorm = (a) => Math.sqrt(qmul(a, qconj(a))[0]);
export const qnormalize = (a) => qscalarMul(1 / qnorm(a), a);
export const qinv = (a) => qscalarMul(1 / qmul(a, qconj(a))[0], qconj(a));
const qbasisStrings = ["", "i", "j", "k"];
export const qToString = (a) => a.reduce((prev, cur, i) => cur === 0
    ? prev
    : prev +
        (Math.sign(cur) > 0 ? " + " : " - ") +
        Math.abs(cur).toFixed(2) +
        qbasisStrings[i], "");
export const qFromV3 = (v) => [0, ...v];
export const qToV3 = (q) => [q[1], q[2], q[3]];
export const qap = (q) => (v) => qToV3(qmul(qmul(q, qFromV3(v)), qinv(q)));
// adapted from: https://stackoverflow.com/questions/62943083/interpolate-between-two-quaternions-the-long-way
// not yet tested
// could also implement `exp` and do `exp(qmul(qinv(a), b))` according to:
// https://en.wikipedia.org/wiki/Slerp#Quaternion_slerp
export const slerp = (a, b, t) => {
    const angle = Math.acos(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
    const denom = Math.sin(angle);
    //check if denom is zero
    return qscalarMul(1 / denom, qadd(qscalarMul(Math.sin((1 - t) * angle), a), qscalarMul(Math.sin(t * angle), b)));
};
console.log("qmul test!", qToString(qmul([0, 33, 1, 0], [-0.3, 1, -19, 1])));
console.log("qinv test!", qToString(qmul(qinv([-0.3, 1, -19, 1]), [-0.3, 1, -19, 1])));
const q = [0.27, 0.73, 0.61, 0.15];
console.log("q to axis angle", qfromAxisAngle([1, 0, 0], 0.13), "SHOULD BE [1, 0, 0], 0.13", qToAxisAngle(qfromAxisAngle([1, 0, 0], 0.13)), qToAxisAngle(q), "TEST!", v3length(qToAxisAngle(q).axis));
const testAxis = v3normalize([Math.random(), Math.random(), Math.random()]);
console.log("qap test!", qap(qfromAxisAngle(testAxis, 0.13 / 2))([0.1, 0.1, 0.1]), v3rot(testAxis, 0.13)([0.1, 0.1, 0.1]));
