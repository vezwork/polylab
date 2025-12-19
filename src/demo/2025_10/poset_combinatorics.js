function funcs(as, bs) {
  if (as.length === 0) return [];
  if (bs.length === 0) return [];
  if (as.length === 1) return bs.map((b) => [[as[0], b]]);
  if (bs.length === 1) return [as.map((a) => [a, bs[0]])];
  const res = [];
  for (const f of funcs(as.slice(1), bs))
    for (const b of bs) res.push([[as[0], b], ...f]);
  return res;
}

const hasEdge = ({ ps, es }, key, value) => es.get(key)?.has(value);

const isHomo = (f, s1, s2) => {
  const map = new Map(f);
  for (const [sel1, sel2] of f)
    for (const to of s1.es.get(sel1) ?? [])
      if (
        map.get(sel1) !== map.get(to) &&
        !hasEdge(s2, map.get(sel1), map.get(to))
      )
        return false;
  return true;
};

const setMapAdd = (setMap, key, value) => {
  if (!setMap.has(key)) setMap.set(key, new Set());
  setMap.get(key).add(value);
};
const setMap = (...pairs) => {
  const res = new Map();
  for (const [key, value] of pairs) setMapAdd(res, key, value);
  return res;
};

const a = { ps: [1, 2, 3], es: setMap([1, 2], [2, 3], [3, 1]) };
const b = {
  ps: ["a", "b", "c"],
  es: setMap(["a", "c"], ["c", "b"], ["b", "a"]),
};

// all homomorphisms between a and b
const homos = (a, b) => funcs(a.ps, b.ps).filter((f) => isHomo(f, a, b));
homos(a, b);

// traversal includes `start`
function* traverseBreadthFirst(setMap, start) {
  const toVisit = [start];
  const visited = new Set();
  while (toVisit.length > 0) {
    const cur = toVisit.pop();
    visited.add(cur);
    for (const next of setMap.get(cur) ?? []) {
      if (!visited.has(next)) toVisit.push(next);
    }
    yield cur;
  }
}
const isGeq = (setMap, a, b) => {
  for (const c of traverseBreadthFirst(setMap, a)) {
    if (c === b) return true;
  }
  return false;
};
// compare homomorphisms by: f1 >= f2 <=> for all p in a, f1(p) >= f2(p)
const isHomoGeq = (f1, f2, a, b) => {
  const m1 = new Map(f1);
  const m2 = new Map(f2);
  for (const p of a.ps) {
    if (!isGeq(b.es, m1.get(p), m2.get(p))) return false;
  }
  return true;
};

const cartesianProduct = (a, b) => {
  const res = [];
  for (const p1 of a) {
    for (const p2 of b) {
      res.push([p1, p2]);
    }
  }
  return res;
};

const c = { ps: [1, 2, 3], es: setMap([1, 2], [1, 3]) };
const d = {
  ps: ["a", "b"],
  es: setMap(["a", "b"]),
};

const hs = homos(c, d);
// adjacency matrix for transitive graph
const cs = [];
for (let i = 0; i < hs.length; i++) {
  cs[i] = [];
  for (let j = 0; j < hs.length; j++) {
    cs[i][j] = isHomoGeq(hs[i], hs[j], c, d);
  }
}

// now how do I get a hasse graph from this?

// source: https://stackoverflow.com/a/6702198
// square matrix `mIn`
const transitiveReduction = (mIn) => {
  const m = structuredClone(mIn);
  const N = m.length;
  // reflexive reduction
  for (let i = 0; i < N; i++) m[i][i] = false;

  // transitive reduction
  for (let j = 0; j < N; ++j)
    for (let i = 0; i < N; ++i)
      if (m[i][j]) for (let k = 0; k < N; ++k) if (m[j][k]) m[i][k] = false;

  return m;
};

// convert mcs to a setMap
const mcs = transitiveReduction(cs);
const mm = setMap();
for (let i = 0; i < mcs.length; i++) {
  for (let j = 0; j < mcs.length; j++) {
    if (mcs[i][j]) setMapAdd(mm, hs[i], hs[j]);
  }
}
console.log(mm);
