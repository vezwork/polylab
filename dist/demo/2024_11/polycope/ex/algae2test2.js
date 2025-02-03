import { SetMap } from "../../../lib/structure/data.js";

const onSet = new SetMap();
const addOnSet = (ob, f) => onSet.add(ob, f);
const getOnSet = (ob) => onSet.get(ob) ?? [];

const set = (ob) => (v) => {
  const oldV = ob.v;
  ob.v = v;
  for (const f of getOnSet(ob)) f(v, oldV);
};

let obZCounter = 0;
const Ob = (v = 0, z = obZCounter++) => ({ v, z });

const SPECZ = Symbol("SPECZ");

const relHelper = (a, b, f) => (v, oldV) => {
  if (b.z > a.z) {
    b.z = a.z;
    set(b)(f(v, oldV));
  }
};
const rel = (to) => (a, b) => {
  const f = relHelper(a, b, to);
  f(a.v, a.v);
  addOnSet(a, f);
};

const all = (...obs) => {
  // Infinity so that it never sets anything
  const resOb = Ob(null, Infinity);
  resOb.obs = obs;

  const f = () => {
    if (obs.every((ob) => ob.z === obs[0].z || ob.z === SPECZ)) {
      resOb.z = obs[0].z;
      set(resOb)(obs.map((ob) => ob.v));
    }
  };
  f();
  for (const ob of obs) addOnSet(ob, f);

  return resOb;
};

const map =
  (f) =>
  (...obs) => {
    const resOb = Ob(null, Infinity);
    rel((vs) => f(...vs))(all(...obs), resOb);
    return resOb;
  };
const reduce = (f, v) => map((...xs) => xs.reduce(f, v));

const plus10 = (a, b) => {
  if (a.z === b.z) throw "loop in rels!";
  rel((v) => v + 10)(a, b);
  rel((v) => v - 10)(b, a);
};
const log = map(console.log);
const add = reduce((acc, cur) => acc + cur, 0);
const sub = map((a, b) => a - b);
const mul = reduce((acc, cur) => acc * cur, 1);
const div = map((a, b) => a / b);
const min = map(Math.min);
const max = map(Math.max);

const group = (...obs) => {
  const g = {
    x: min(...obs.map((ob) => ob.x)),
    x2: max(...obs.map((ob) => ob.x2)),
  };
  rel((v, oldV) => g.x.v + (v - oldV))(g.x2, g.x);
  rel((v, oldV) => g.x2.v + (v - oldV))(g.x, g.x2);
  for (const ob of obs) {
    rel((v, oldV) => ob.x.v + (v - oldV))(g.x, ob.x);
    rel((v, oldV) => ob.x2.v + (v - oldV))(g.x, ob.x2);
  }
  return g;
};

const d = () => {
  const x = Ob();
  const x2 = Ob();
  return { x, x2 };
};

const toDraw = [];
const t = (...ts) => {
  const d2 = d();
  d2.d = d2;
  d2.layer = Math.max(0, ...ts.map((t) => t.d.layer)) + 1;
  toDraw.push(d2);
  const WIDTH = 20;
  rel((v) => v + WIDTH)(d2.x, d2.x2);
  rel((v) => v - WIDTH)(d2.x2, d2.x);

  if (ts.length > 0) {
    for (let i = 0; i < ts.length - 1; i++) {
      const ti = ts[i];
      const tii = ts[i + 1];
      rel((v) => v)(ti.x2, tii.x);
      rel((v) => v)(tii.x, ti.x2);
    }
    const children = group(...ts);
    rel(([x, x2]) => x + (x2 - x) / 2 - (d2.x2.v - d2.x.v) / 2)(
      all(children.x, children.x2),
      d2.x
    );
    rel((x) => x + (d2.x2.v - d2.x.v) / 2 - (children.x2.v - children.x.v) / 2)(
      d2.x,
      children.x
    );

    const g = group(d2, children);
    g.d = d2;
    return g;
  } else {
    return d2;
  }
};

const l = t();
const r = t();
const b = t(l, r);
const br = t();
const br2 = t(br);
const br3 = t(br2);
const bb = t(b, br3);

bb.x2.z = -1;
set(bb.x2)(150);

for (const ob of toDraw) {
  ctx.fillRect(ob.d.x.v, ob.d.layer * 20, ob.d.x2.v - ob.d.x.v - 2, 20 - 2);
}
