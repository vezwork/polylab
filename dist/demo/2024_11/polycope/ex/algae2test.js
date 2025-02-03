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

const d = (draw) => {
  const x = Ob();
  const x2 = Ob();
  map(draw)(x, x2);
  return { x, x2 };
};

const myFirstSystem = () => {
  const d0 = d((x, x2) => ctx.fillRect(x, 20, x2 - x, 5));
  const d1 = d((x, x2) => ctx.fillRect(x, 20, x2 - x, 5));

  plus10(d0.x, d0.x2);
  plus10(d0.x2, d1.x);
  plus10(d1.x, d1.x2);

  rel((v) => v + 200)(d0.x, d1.x);
  rel((v) => v - 200)(d1.x, d0.x);

  const g = group(d0, d1);

  const d2 = d((x, x2) => ctx.fillRect(x, 20, x2 - x, 25));
  rel((v) => v + 2)(d2.x, d2.x2);
  rel((v) => v - 2)(d2.x2, d2.x);

  //rel((x,x2)=>x+(x2-x)/2)(all(g.x,g.x2),d2.x)

  rel((v) => v + 15)(d2.x, g.x2);
  rel((v) => v - 15)(g.x2, d2.x);
  return { g, d0, d1, d2 };
};
const { d2 } = myFirstSystem();
const { d1, d2: d22 } = myFirstSystem();
const { d1: d12 } = myFirstSystem();

rel((v) => v + 100)(d2.x2, d1.x);
rel((v) => v - 100)(d1.x, d2.x2);

rel((v) => v + 100)(d22.x2, d12.x);
rel((v) => v - 100)(d12.x, d22.x2);

ctx.clearRect(0, 0, c.width, c.height);
d1.x.z = -1;
set(d1.x)(350);

console.log(d12, d2);
