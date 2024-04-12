import { and, mo } from "./lib.js";

const leftMap = new Map();
const rightMap = new Map();

export const p = (l, r) => {
  const data = [[l[0], r[0]]]; // should I init to?: [[l[0], r[0]]]

  leftMap.set(data, l);
  rightMap.set(data, r);

  const le = mo((l, p) => (p[0][0] = l[0]))(l)(data);
  mo((p, l) => (l[0] = p[0][0]))(data)(l);

  const re = mo((r, p) => (p[0][1] = r[0]))(r)(data);
  mo((p, r) => (r[0] = p[0][1]))(data)(r);

  and(le, re);

  return data;
};

// a + b = c
// IMPORTANT: Update order matters!
// e.g. if `c` updates but not `b` or `a`, then this will only set `a` with `a = c - b`.
export const plus = (a, b) => {
  const c = [undefined];
  mo(([[a, b]], c) => (c[0] = a + b))(p(a, b))(c);
  mo(([[b, c]], a) => (a[0] = c - b))(p(b, c))(a); // IMPORTANT: the order of these last two lines matters
  mo(([[a, c]], b) => (b[0] = c - a))(p(a, c))(b);
  // should be product of aw, ax with bx[0] = ax + aw
  // which makes me think that I want to declare that product here
  // which makes me want to make products unique
  // thats an OPTIMIZATION tho
  return c;
};
export const eq = (a, b) => {
  mo(([a], b) => (b[0] = a))(a)(b);
  mo(([b], a) => (a[0] = b))(b)(a);
};
export const mof = (f: Function) => (a) => {
  const result = [f(a[0])];
  mo(([a], r) => (r[0] = f(a)))(a)(result);
  return result;
};
export const log =
  (s: string = "") =>
  (ob) =>
    mof((a) => console.log(s, a))(ob);
export const left = (product) => leftMap.get(product);
export const right = (product) => rightMap.get(product);

export const changed = new Set();
export const d = (v?: any) => {
  const box = [v];
  if (v !== undefined) changed.add(box);
  return box;
};
