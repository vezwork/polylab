import { SetMap } from "/dist/lib/structure/data.js";

const onSet = new SetMap();
const addOnSet = (ob, f) => onSet.add(ob, f);
const getOnSet = (ob) => onSet.get(ob) ?? [];

export const set = (ob) => (v) => {
  const oldV = ob.v;
  ob.v = v;
  for (const f of getOnSet(ob)) f(v, oldV);
};

let obZCounter = 0;
export const Ob = (v = 0, z = obZCounter++) => ({ v, z });

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

const plus10 = (a, b) => {
  if (a.z === b.z) console.error("loop in rels! z=" + a.z);
  rel((v) => v + 10)(a, b);
  rel((v) => v - 10)(b, a);
};
const eq = (a, b) => {
  if (a.z === b.z) console.error("loop in rels! z=" + a.z);
  rel((v) => v)(a, b);
  rel((v) => v)(b, a);
};
export const log = map((...xs) => (console.log(...xs), xs[0]));
export const add = reduce((acc, cur) => acc + cur, 0);
export const sub = map((a, b) => a - b);
export const mul = reduce((acc, cur) => acc * cur, 1);
export const div = map((a, b) => a / b);
export const min = map(Math.min);
export const max = map(Math.max);

export const group = (...obs) => {
  const g = {
    x: min(...obs.map((ob) => ob.x)),
    x2: max(...obs.map((ob) => ob.x2)),
    y: min(...obs.map((ob) => ob.y)),
    y2: max(...obs.map((ob) => ob.y2)),
    obs,
  };
  rel((v, oldV) => g.x.v + (v - oldV))(g.x2, g.x);
  rel((v, oldV) => g.x2.v + (v - oldV))(g.x, g.x2);
  for (const ob of obs) {
    rel((v, oldV) => ob.x.v + (v - oldV))(g.x, ob.x);
    rel((v, oldV) => ob.x2.v + (v - oldV))(g.x, ob.x2);
  }

  rel((v, oldV) => g.y.v + (v - oldV))(g.y2, g.y);
  rel((v, oldV) => g.y2.v + (v - oldV))(g.y, g.y2);
  for (const ob of obs) {
    rel((v, oldV) => ob.y.v + (v - oldV))(g.y, ob.y);
    rel((v, oldV) => ob.y2.v + (v - oldV))(g.y, ob.y2);
  }
  return g;
};

const toDraw = [];
export const d = (draw) => {
  let res = {};
  toDraw.push([res, draw]);
  res.x = Ob();
  res.x2 = Ob();
  res.y = Ob();
  res.y2 = Ob();
  return res;
};

export const put = (ob) => (v) => {
  if (ob.z === -1) throw "setting determined ob";
  ob.z = -1;
  set(ob)(v);
};
export const v = (val) => Ob(val, -Infinity);

export const toEq = (a, b) => rel((v) => v)(b, a);

export const xInterval = (dd) => {
  const w = sub(dd.x2, dd.x);
  if (w.z !== Infinity) {
    w.z = -Infinity;
    for (const f of getOnSet(w)) f(w.v);
  }
  addOnSet(w, () => {
    if (w.z === -Infinity) return;
    w.z = -Infinity;
    for (const f of getOnSet(w)) f(w.v);
  });
  toEq(dd.x2, add(dd.x, w));
  toEq(dd.x, sub(dd.x2, w));

  const { x, x2 } = dd;

  let cachedP = { 0: x, 1: x2 };
  let prevP;
  const p = (v) => {
    if (cachedP[v]) return cachedP[v];
    const pv = Ob();
    cachedP[v] = pv;

    toEq(pv, add(x, mul(v, w)));
    toEq(w, mul(1 / v, sub(pv, x)));
    toEq(x, sub(pv, mul(v, w)));

    if (prevP !== undefined) {
      const [v2, pv2] = prevP;
      toEq(w, mul(1 / (v2 - v), sub(pv2, pv)));
    }
    prevP = [v, pv];
    return pv;
  };
  dd.w = w;
  dd.p = p;
  dd.c = p(0.5);
  return { w, p };
};

export const draw = () =>
  toDraw.map(([ob, draw]) => draw(ob.x.v, ob.x2.v, ob.y.v, ob.y2.v));
// END OF LIB CODE

const t = (...ts) => {
  const d2 = d((x, x2, y, y2) => {
    ctx.save();
    ctx.fillStyle = "orange";
    ctx.fillRect(x + 1, y + 1, x2 - x - 2, y2 - y - 2);
    ctx.restore();
  });
  const WIDTH = 20;
  xInterval(d2);
  set(d2.w)(WIDTH);
  rel((v) => v + WIDTH)(d2.y, d2.y2);
  rel((v) => v - WIDTH)(d2.y2, d2.y);

  if (ts.length > 0) {
    eq(d2.y2, ts[0].y);
    for (let i = 0; i < ts.length - 1; i++) {
      eq(ts[i].x2, ts[i + 1].x);
      eq(d2.y2, ts[i + 1].y);
    }
    const children = group(...ts);
    xInterval(children);
    eq(children.c, d2.c);
    return group(d2, children);
  } else {
    return d2;
  }
};

const bb = t(t(), t(t(), t(), t()));
put(bb.obs[0].x)(300);
put(bb.obs[1].y)(400);

const renderText = (str) => (x, _, y) => {
  ctx.font = "30px sans-serif";
  ctx.textBaseline = "hanging";
  ctx.fillText(str, x, y);
};
const a = d(renderText("Σ"));
rel((x) => x + 10)(a.x, a.x2);
rel((x) => x - 10)(a.x2, a.x);
plus10(a.y, a.y2);
const a2 = d(renderText("x"));
rel((x) => x + 10)(a2.x, a2.x2);
rel((x) => x - 10)(a2.x2, a2.x);
plus10(a2.y, a2.y2);
plus10(a.x2, a2.x);
eq(a.y, a2.y);

console.log(a.x, a.x2);

put(a2.x2)(100);
put(a.y2)(200);

const arrow = d((x, x2, y, y2) => {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
});
eq(arrow.x, bb.x);
eq(arrow.x2, a2.x2);
eq(arrow.y, bb.y);
eq(arrow.y2, a.y2);

// TODO:
// -[x] make paint pass nice to use
// -[x] make setting nice to use for the user
// -[x] add x, y, w, c, i(I)
// -[x] add centering

// FOR LATER:
// - diagrammar-like API
// - detect rel loops better?
// - have array obs with all, add object obs
// - add arrows
// - test to see if I can add orthogonal dims to rels
// - examples: sigma, tree, DAG, BF examples
// - weak constraints with defaults e.g. `within`
