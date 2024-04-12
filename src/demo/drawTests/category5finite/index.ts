import { and, mo, pull, push } from "./lib.js";

const leftMap = new Map();
const rightMap = new Map();

const p = (l, r) => {
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

const TEST1 = () => {
  const a1 = [9];
  const d2 = [10];
  const d3 = [];
  const d4 = [];
  const d5 = [];
  const d6 = [8];

  const d1xd2 = p(a1, d2);
  const d1xd2xd6 = p(d1xd2, d6);

  const plus10 = mo((a, b) => (b[0] = a[0] + 10));
  const minus10 = mo((a, b) => (b[0] = a[0] - 10));

  plus10(a1)(d2);
  minus10(d2)(a1);

  plus10(d2)(d3);

  plus10(d3)(d4);

  plus10(d4)(d5);

  minus10(d6)(d5);
  plus10(d5)(d6);

  console.log(
    a1[0],
    d2[0],
    d3[0],
    d4[0],
    d5[0],
    d6[0],
    [...d1xd2],
    [...d1xd2xd6]
  );
  push(a1, d2);
  console.log(
    a1[0],
    d2[0],
    d3[0],
    d4[0],
    d5[0],
    d6[0],
    [...d1xd2],
    [...d1xd2xd6]
  );
};

// BOUNDS TESTS

// // padding

// // alignX left, center, right
// // alignY top, center, bottom

// a + b = c
// IMPORTANT: Update order matters!
// e.g. if `c` updates but not `b` or `a`, then this will only set `a` with `a = c - b`.
const plus = (a, b) => {
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
const eq = (a, b) => {
  mo(([a], b) => (b[0] = a))(a)(b);
  mo(([b], a) => (a[0] = b))(b)(a);
};
const mof = (f: Function) => (a) => {
  const result = [f(a[0])];
  mo(([a], r) => (r[0] = f(a)))(a)(result);
  return result;
};
const log =
  (s: string = "") =>
  (ob) =>
    mof((a) => console.log(s, a))(ob);
const left = (product) => leftMap.get(product);
const right = (product) => rightMap.get(product);

const changed = new Set();
const d = (v?: any) => {
  const box = [v];
  if (v !== undefined) changed.add(box);
  return box;
};

const TEST2 = () => {
  changed.clear();
  const test = d();
  const testa = d(1);
  const testb = d(7);
  eq(testb, plus(test, testa));
  push(...changed);
  console.log("ISSUE WHERE ORDER OF ARGS MATTERS!", test, testa, testb);
};
//TEST2();

const TEST3 = () => {
  changed.clear();

  const c = document.getElementById("c") as HTMLCanvasElement;
  const ctx = c.getContext("2d")!;

  const d0 = p(p(d(100), d(100)), p(d(50), d(50)));
  const d1 = p(p(d(), d()), p(d(60), d(60)));
  const x = (ob) => left(left(ob));
  const y = (ob) => right(left(ob));
  const w = (ob) => left(right(ob));
  const h = (ob) => right(right(ob));

  const beside = (a, b) => eq(x(b), plus(x(a), w(a)));
  const above = (a, b) => eq(y(b), plus(y(a), h(a)));
  const centerHorizontal = (a, b) => {
    const ah2 = mof((a) => a / 2)(h(a));
    const bh2 = mof((a) => a / 2)(h(b));

    const bh2_ah2 = d();
    eq(bh2, plus(bh2_ah2, ah2));
    eq(y(a), plus(y(b), bh2_ah2));
    //eq(ay, plus(bh2_ah2, by));
    // const ayhbh = p(
    //   p(right(left(a)), right(right(a))),
    //   right(right(b))
    // );
    // mo(([[[ay, ah], bh]], by) => (by[0] = ay + ah / 2 - bh / 2))(ayhbh)(by);
    // const byhah = p(
    //   p(right(left(b)), right(right(b))),
    //   right(right(a))
    // );
    // mo(([[[by, bh], ah]], ay) => (ay[0] = by + bh / 2 - ah / 2))(byhah)(ay);
  };
  const centerVertical = (a, b) => {
    const aw2 = mof((a) => a / 2)(w(a));
    const bw2 = mof((a) => a / 2)(w(b));

    const bw2_aw2 = d();
    eq(bw2, plus(bw2_aw2, aw2));
    eq(x(a), plus(x(b), bw2_aw2));

    // compute the combined bounding box:
    // note: I was not able to do `mof(([a,b])=>...)` because `a` and `b` as args to mof are not the
    //   same containers as the `a` and `b` as args to `centerVertical`, the product unpackages
    //   the values so I cannot get references to the original containers. This is pretty annoying.
    return mof(() => [
      Math.min(x(a)[0], x(b)[0]),
      Math.min(y(a)[0], y(b)[0]),
      Math.max(x(a)[0] + w(a)[0], x(b)[0] + w(b)[0]) -
        Math.min(x(a)[0], x(b)[0]),
      Math.max(y(a)[0] + h(a)[0], y(b)[0] + h(b)[0]) -
        Math.min(y(a)[0], y(b)[0]),
    ])(p(a, b));
  };

  const defaultDrawableDims = ([[x, y], [w, h]]) => [
    x ?? 0,
    y ?? 0,
    w ?? 0,
    h ?? 0,
  ];
  const d0defaulted = mof(defaultDrawableDims)(d0);
  const d1defaulted = mof(defaultDrawableDims)(d1);
  mof(([x, y, w, h]) => {
    ctx.fillStyle = "blue";
    ctx.fillRect(x, y, w, h);
  })(d0defaulted);
  mof(([x, y, w, h]) => {
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, w, h);
  })(d1defaulted);

  //beside(d0, d1);
  //centerHorizontal(d0, d1);
  const result = centerVertical(d1, d0);
  above(d0, d1);
  ctx.clearRect(0, 0, c.width, c.height);
  push(...changed);
  console.log(d0, d1, result);
};
TEST3();

const TEST4 = () => {
  changed.clear();

  const a = p(d(1), d(2));
  const b = p(d(), d());
  eq(left(b), plus(left(a), right(a)));

  push(...changed);
  console.log(a, b);
};
//TEST4();
