import { mo, push } from "./lib.js";
const d1 = [];
const d2 = [10];
const d3 = [];
const d4 = [];
const d5 = [];
const d1xd2 = [];
const d1xd2xd5 = [];
const plus10 = mo((a, b) => (b[0] = a[0] + 10));
const minus10 = mo((a, b) => (b[0] = a[0] - 10));
plus10(d1)(d2);
minus10(d2)(d1);
plus10(d2)(d3);
plus10(d3)(d4);
plus10(d4)(d5);
const pl = mo((l, p) => (p[0] = [...l]));
const pr = mo((r, p) => (p[1] = [...r]));
pl(d1)(d1xd2);
pr(d2)(d1xd2);
pl(d1xd2)(d1xd2xd5);
pr(d5)(d1xd2xd5);
console.log(d1[0], d2[0], d3[0], d4[0], d5[0], [...d1xd2], [...d1xd2xd5]);
push(d2);
console.log(d1[0], d2[0], d3[0], d4[0], d5[0], [...d1xd2], [...d1xd2xd5]);
/*
{ x, y, bounds } => { x, y, bounds } 
