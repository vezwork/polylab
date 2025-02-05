import { SetMap } from "/dist/lib/structure/data.js";

const onSet = new SetMap();
const addOnSet = (ob, f) => onSet.add(ob, f);
const getOnSet = (ob) => onSet.get(ob) ?? [];

export const set = (ob) => (v) => {
  const oldV = ob.v;
  ob.v = v;
  ob.h.push({ v, z: ob.z, H: true });
  for (const f of getOnSet(ob)) f(v, oldV);
};
const SET_Z = -1;
export const put = (ob) => (v) => {
  if (ob.z === SET_Z) throw "setting determined ob";
  ob.z = SET_Z;
  set(ob)(v);
};

let obZCounter = 0;
export const Ob = (v = 0, z = obZCounter++) => ({
  v,
  z,
  h: [{ v, z, H: true }],
});

export const v = (val) => Ob(val, -Infinity);

// want z = -Infinity to not set other z
const zComp = (z1, z2) =>
  z1 === -Infinity && z2 === -Infinity ? true : z1 > z2;
const relHelper = (a, b, f) => (v, oldV) => {
  if (zComp(b.z, a.z)) {
    const res = f(v, oldV);
    if (b.z === Infinity || a.z !== -Infinity) b.z = a.z;
    set(b)(res);
  }
};
export const rel = (to) => (a, b) => {
  const f = relHelper(a, b, to);
  f(a.v, a.v);
  addOnSet(a, f);
};

// -Infinity is "wild"
// and Infinity always results in false
const everySame = (obs) => {
  let cur = -Infinity;
  for (const z of obs.map((ob) => ob.z)) {
    if (z === Infinity) return false;
    if (z !== -Infinity && cur === -Infinity) cur = z;
    if (z !== -Infinity && cur !== -Infinity) {
      if (z !== cur) return false;
    }
  }
  return cur;
};
const wrapped = (obOrV) => (obOrV.z !== undefined ? obOrV : v(obOrV));
const all = (...uobs) => {
  const obs = uobs.map(wrapped);
  // Infinity so that it never sets anything
  const resOb = Ob(null, Infinity);
  resOb.obs = obs;

  const f = () => {
    const inputZ = everySame(obs);
    if (inputZ !== false) {
      resOb.z = inputZ;
      set(resOb)(obs.map((ob) => ob.v));
    }
  };
  f();
  for (const ob of obs) addOnSet(ob, f);

  return resOb;
};

export const map =
  (f) =>
  (...obs) => {
    const resOb = Ob(null, Infinity);
    rel((vs) => f(...vs))(all(...obs), resOb);
    return resOb;
  };
export const reduce = (f, v) => map((...xs) => xs.reduce(f, v));

export const eq = (a, b) => {
  if (a.z === b.z && a.z !== -Infinity) console.error("loop in rels! z=" + a.z);
  rel((v) => v)(a, b);
  rel((v) => v)(b, a);
};
export const toEq = (a, b) => rel((v) => v)(b, a);
export const log = map((...xs) => (console.log(...xs), xs[0]));
export const add = reduce((acc, cur) => acc + cur, 0);
export const sub = map((a, b) => a - b);
export const mul = reduce((acc, cur) => acc * cur, 1);
export const div = map((a, b) => a / b);
export const min = map(Math.min);
export const max = map(Math.max);

export const interval = (x, x2) => {
  const w = sub(x2, x);
  if (w.z !== Infinity) {
    w.z = -Infinity;
    for (const f of getOnSet(w)) f(w.v);
  }
  addOnSet(w, () => {
    if (w.z === -Infinity) return;
    w.z = -Infinity;
    for (const f of getOnSet(w)) f(w.v);
  });
  toEq(x2, add(x, w));
  toEq(x, sub(x2, w));

  let cachedP = { 0: x, 1: x2 };
  let prevP;
  const p = (v) => {
    if (cachedP[v]) return cachedP[v];
    const pv = Ob();
    cachedP[v] = pv;

    toEq(pv, add(x, mul(v, w)));
    toEq(w, mul(1 / v, sub(pv, x)));
    toEq(x, sub(pv, mul(v, w)));
    // NOTE: This is excessive
    toEq(w, mul(1 / (1 - v), sub(x2, pv)));

    // BUG: this won't work if e.g. you create p(.1),p(.2),p(.3) and set p(.1) and p(.3)
    if (prevP !== undefined) {
      const [v2, pv2] = prevP;
      toEq(w, mul(1 / (v2 - v), sub(pv2, pv)));
    }
    prevP = [v, pv];
    return pv;
  };
  return { w, p };
};

// NOTE: I think this currently works because I assume that
// the obs inside the group are layed out relative to eachother first -
// before the group coordinates are set.
export const group = (...obs) => {
  const g = {};

  g.x = Ob();
  const minX = min(...obs.map((ob) => ob.x));
  const funcX = (v) => {
    if (minX.z === Infinity) return;
    if (obs[0].x.z !== minX.z) return;
    if (minX.z < g.x.z) {
      g.x.z = minX.z;
      set(g.x)(minX.v);
    } else if (minX.z > g.x.z) {
      const minOb = obs.find((ob) => ob.x.v === minX.v);
      minOb.x.z = g.x.z;
      set(minOb.x)(g.x.v);
    }
  };
  funcX();
  addOnSet(minX, funcX);
  addOnSet(g.x, funcX);

  g.x2 = max(...obs.map((ob) => ob.x2));

  g.y = Ob();
  const minY = min(...obs.map((ob) => ob.y));
  const funcY = (v) => {
    if (minX.z === Infinity) return;
    if (obs[0].y.z !== minY.z) return;
    if (minY.z < g.y.z) {
      g.y.z = minY.z;
      set(g.y)(minY.v);
    } else if (minY.z > g.y.z) {
      const minOb = obs.find((ob) => ob.y.v === minY.v);
      minOb.y.z = g.y.z;
      set(minOb.y)(g.y.v);
    }
  };
  funcY();
  addOnSet(minY, funcY);
  addOnSet(g.y, funcY);

  g.y2 = max(...obs.map((ob) => ob.y2));
  g.DEBUGy2 = obs.map((ob) => ob.y2);

  g.obs = obs;

  const xi = interval(g.x, g.x2);
  g.xc = xi.p(0.5);
  g.xi = xi.p;
  g.w = xi.w;
  const yi = interval(g.y, g.y2);
  g.yc = yi.p(0.5);
  g.yi = yi.p;
  g.h = yi.w;

  return g;
};

const toDraw = [];
export const d = (draw) => {
  let res = {};
  toDraw.push([res, draw]);
  res.x = Ob();

  res.x2 = Ob();
  const xi = interval(res.x, res.x2);
  res.xc = xi.p(0.5);
  res.xi = xi.p;
  res.w = xi.w;
  res.y = Ob();
  res.y2 = Ob();
  const yi = interval(res.y, res.y2);
  res.yc = yi.p(0.5);
  res.yi = yi.p;
  res.h = yi.w;

  return res;
};

export const above = (d1, d2) => eq(d1.y2, d2.y);
export const beside = (d1, d2) => eq(d1.x2, d2.x);
export const xAlign = (v) => (d1, d2) => eq(d1.xi(v), d2.xi(v));
export const yAlign = (v) => (d1, d2) => eq(d1.yi(v), d2.yi(v));

export const xCenter = xAlign(0.5);
export const yCenter = yAlign(0.5);

export const xStack = (...ds) => {
  for (let i = 0; i < ds.length - 1; i++) {
    beside(ds[i], ds[i + 1]);
    yCenter(ds[i], ds[i + 1]);
  }
  return group(...ds);
};
export const yStack = (...ds) => {
  for (let i = 0; i < ds.length - 1; i++) {
    above(ds[i], ds[i + 1]);
    xCenter(ds[i], ds[i + 1]);
  }
  return group(...ds);
};

export const draw = () =>
  toDraw.map(([ob, draw]) => draw(ob.x.v, ob.x2.v, ob.y.v, ob.y2.v, ob));
// END OF LIB CODE

// TODO:
// -[x] make paint pass nice to use
// -[x] make setting nice to use for the user
// -[x] add x, y, w, c, i(I)
// -[x] add centering

// FOR LATER:
// - [x] diagrammar-like API
// - detect rel loops better?
// - have array obs with all, add object obs
// - add arrows
// - test to see if I can add orthogonal dims to rels
// - examples: sigma, tree, DAG, BF examples
// - weak constraints with defaults e.g. `within`
