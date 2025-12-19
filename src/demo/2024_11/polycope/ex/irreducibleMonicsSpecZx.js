const s = (v) => v.toString();

// set that works with objects
class Myset {
  _backing = new Set();
  constructor(ar = [], Class) {
    for (const a of ar) this.add(a);
    this._Class = Class;
  }
  add(v) {
    this._backing.add(s(v));
  }
  has(v) {
    return this._backing.has(s(v));
  }
  *[Symbol.iterator]() {
    for (const v of this._backing) yield this._Class.fromString(v);
  }
  sub(ms) {
    if (this._Class !== ms._Class) throw "sub different types of sets!";
    const newMs = new Myset([], this._Class);
    for (const k of this) if (!ms.has(k)) newMs.add(k);
    return newMs;
  }
  union(ms) {
    if (this._Class !== ms._Class) throw "union different types of sets!";
    const newMs = new Myset([], this._Class);
    for (const k of this) newMs.add(k);
    for (const k of ms) newMs.add(k);
    return newMs;
  }
  get size() {
    return this._backing.size;
  }
}

class Multiset {
  _backing = new Map();
  constructor(...ls) {
    for (const l of ls) this.add(l);
  }
  add(v, inc = 1) {
    const value = s(v);
    if (this._backing.has(value)) {
      this._backing.set(value, inc + this._backing.get(value));
    } else {
      this._backing.set(value, inc);
    }
    return this;
  }

  delete(v) {
    const value = s(v);
    if (this._backing.get(value) > 0) {
      this._backing.set(value, this._backing.get(value) - 1);
    } else {
      //do nothing
    }
    return this;
  }

  get(v) {
    const value = s(v);
    if (this._backing.get(value) > 0) {
      return this._backing.get(value);
    } else {
      return 0;
    }
  }
  has(v) {
    const value = s(v);
    return this._backing.has(value);
  }
  count(v) {
    const value = s(v);
    return this._backing.get(value) ?? 0;
  }

  union(ms) {
    const newMs = new Multiset();
    for (const [k, v] of this._backing) newMs.add(k, v);
    for (const [k, v] of ms._backing) newMs.add(k, v);
    return newMs;
  }

  *[Symbol.iterator]() {
    for (const [k, v] of this._backing)
      for (let i = 0; i < v; i++) yield JSON.parse(k);
  }

  counts() {
    return [...this._backing.entries()].map(([k, v]) => [JSON.parse(k), v]);
  }

  toString() {
    return (
      "[" +
      [...this._backing.entries()]
        .map(([k, v]) => "[" + s(k) + "," + v + "]")
        .sort()
        .join(",") +
      "]"
    );
  }
  static fromString(str) {
    const newMs = new Multiset();
    for (const [k, v] of JSON.parse(str)) newMs.add(k, v);
    return newMs;
  }
}

const sumsOf = function (n, cache = new Map()) {
  if (cache.has(n)) return cache.get(n);
  const res = new Myset([], Multiset);
  res.add(new Multiset(n));

  for (let i = 1; i < n; i++) {
    for (const a of sumsOf(n - i, cache)) {
      for (const b of sumsOf(i, cache)) {
        res.add(a.union(b));
      }
    }
  }
  cache.set(n, res);
  return res;
};

// we want to place m dividers in n items
const divisions = (m, n) => {
  let res = [[]];
  while (m > 0) {
    const curRes = [];
    for (const r of res)
      for (let i = r.at(-1) ?? 0; i <= n; i++) curRes.push([...r, i]);
    res = curRes;
    m--;
  }
  return res;
};

const choices = (arr, n) => {
  const res = [];
  for (const d of divisions(arr.length - 1, n)) {
    const choice = [];
    let lo = 0;
    [...d, n].forEach((hi, arri) => {
      for (let i = lo; i < hi; i++) choice[i] = arr[arri];
      lo = hi;
    });
    res.push(choice);
  }
  return res;
};

//console.log(choices([1,2,3,4], 2))

const arrayOf = (len, f = (i) => i) =>
  Array(len)
    .fill(0)
    .map((_, i) => f(i));
const mysetOf = (len, f, Class) => new Myset(arrayOf(len, f), Class);

//console.log(arrayOf(7, sumsOf))
//console.log(sumsOf(2))

// cartesian product
const cartese = (a, b) => a.flatMap((x) => b.map((y) => [x, y]));
const carteses = (as) => {
  if (as.length === 1) return as[0].map((a) => [a]);
  const prev = carteses(as.slice(1));
  return as[0].flatMap((a) => prev.map((p) => [a, ...p]));
};

class Polynomial extends Array {
  toString() {
    return JSON.stringify(this);
  }
  static fromString(str) {
    return Polynomial.from(JSON.parse(str));
  }
}
const polynomialOf = (len, f) => Polynomial.from(arrayOf(len, f));

const mul = (as, bs) => {
  const cs = new Polynomial();
  for (let ai = as.length - 1; ai >= 0; ai--) {
    for (let bi = bs.length - 1; bi >= 0; bi--) {
      if (cs[ai + bi] === undefined) cs[ai + bi] = 0;
      cs[ai + bi] += as[ai] * bs[bi];
    }
  }
  return cs;
};
const muls = (ps) => (ps.length === 1 ? ps[0] : mul(ps[0], muls(ps.slice(1))));

const pmod = (mod) => (as) => as.map((a) => a % mod);

const countBy = (ar, f = (a) => a) => {
  const res = {};
  for (const a of ar) {
    const far = f(a);
    res[far] = (res[far] ?? 0) + 1;
  }
  return res;
};

function composites(degree, mod) {}

// ref: https://www.youtube.com/watch?v=GMjnyqOx05M
// we are constructing monic polynomials
const monics = (degree, mod) =>
  new Myset(
    carteses([[1], ...arrayOf(degree, (i) => arrayOf(mod))]).map((x) =>
      Polynomial.from(x)
    ),
    Polynomial
  );

const arMapAdd = (setMap, k, value) => {
  const key = k.toString();
  if (!setMap.has(key)) setMap.set(key, []);
  setMap.get(key).push(value);
};

const monicPolysData = (upToDegree, mod) => {
  const all = [];
  const prms = [];
  const cmps = [];
  const factors = new Map();

  all[1] = monics(1, mod);
  cmps[1] = new Myset([], Polynomial);
  prms[1] = all[1].sub(cmps[1]);

  const mulFactors = (mod) => (ps) => {
    const res = pmod(mod)(muls(ps));
    for (const p of ps) arMapAdd(factors, res, p);
    return res;
  };

  const mmm = (n) => {
    all[n] = monics(n, mod);
    cmps[n] = new Myset([], Polynomial);
    for (const sum of [...sumsOf(n)]) {
      if (!sum.get(n)) {
        const sumsum = sum
          .counts()
          .map(([deg, count]) => choices([...prms[deg]], count));
        const b = carteses(sumsum).map((x) => x.flat());
        const sumPolys = b.map(mulFactors(mod));
        cmps[n] = cmps[n].union(new Myset(sumPolys, Polynomial));
      }
    }
    prms[n] = all[n].sub(cmps[n]);
  };
  for (let i = 2; i < upToDegree; i++) mmm(i);
  return { all, prms, cmps, factors };
};

const targets = [
  { p: new Polynomial(1, 0, 1), col: "orange", m: {} },
  { p: new Polynomial(1, 5), col: "violet", m: {} },
  { p: new Polynomial(1, 0, 1), col: "red", m: {} },
];

// TODO
for (const mod of [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]) {
  const d = monicPolysData(3, mod);

  const ts = targets.map((t) => ({
    p: pmod(mod)(t.p),
    col: t.col,
    fs: d.factors.get(pmod(mod)(t.p).toString()),
  }));

  let i = 30;
  d.all.forEach((a) => {
    if (a) {
      //a.length
      for (const aa of a) {
        ctx.fillStyle = "black";
        const x = mod * 20 - 2 * 20 + 40;
        const y = i;
        ts.forEach(({ p, col, fs, d }, i) => {
          if (fs && fs.some((p) => p.toString() === aa.toString()))
            targets[i].m[mod] = [
              ...(targets[i].m[mod] ?? []),
              { p: aa.toString(), x, y },
            ];
          if (!fs && p.toString() === aa.toString())
            targets[i].m[mod] = [
              ...(targets[i].m[mod] ?? []),
              { p: aa.toString(), x, y },
            ];
        });
        ctx.fillText(aa, x, y);
        i += 333 / a.size;
      }
    }
  });
}
// todo make the lines nicer
for (const t of targets) {
  ctx.strokeStyle = t.col;
  ctx.beginPath();
  ctx.moveTo(0, 300);
  let prev = [];
  for (const [mod, es] of Object.entries(t.m)) {
    if (prev.length === 1 && es.length === 1) ctx.lineTo(es[0].x, es[0].y);
    if (prev.length === 1 && es.length === 2) {
      ctx.lineTo(es[0].x, es[0].y);
      ctx.moveTo(...prev[0]);
      ctx.lineTo(es[1].x, es[1].y);
    }
    if (prev.length === 2 && es.length === 1) {
      ctx.moveTo(...prev[0]);
      ctx.lineTo(es[0].x, es[0].y);
      ctx.moveTo(...prev[1]);
      ctx.lineTo(es[0].x, es[0].y);
    }
    if (prev.length === 2 && es.length === 2) {
      ctx.moveTo(...prev[1]);
      ctx.lineTo(es[1].x, es[1].y);
      ctx.moveTo(...prev[0]);
      ctx.lineTo(es[0].x, es[0].y);
    }
    prev = es.map((e) => [e.x, e.y]);
  }
  ctx.stroke();
}

// ref: https://youtu.be/WirufRI1_Uo?si=FqqS91UOqc9PHItb&t=909 Professor Borcherds
// ref: https://www.youtube.com/watch?v=GMjnyqOx05M theGrayCuber
