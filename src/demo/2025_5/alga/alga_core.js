const setMapAdd = (setMap, key, value) => {
  if (!setMap.has(key)) setMap.set(key, new Set());
  setMap.get(key).add(value);
  return value;
};

export const Ob = (v) => {
  const newOb = { v };
  newOb.valueOf = () => newOb.v;
  newOb.plus = (a) => {
    const plusOb = Ob(v + a);
    rel(newOb, plusOb, { to: (vv) => vv + a, from: (vv) => vv - a });
    return plusOb;
  };
  return newOb;
};

export const rels = new Map();
const opEdges = new Map();
export const rel = (ob1, ob2, f) => {
  const edge = { ob1, ob2, f: f.to };
  const fromEdge = { ob1: ob2, ob2: ob1, f: f.from };
  opEdges.set(edge, fromEdge);
  opEdges.set(fromEdge, edge);
  set(ob2, f.to(ob1.v));
  setMapAdd(rels, ob1, edge);
  setMapAdd(rels, ob2, fromEdge);
  return edge;
};
export const delRel = (edge) => {
  rels.get(edge.ob1)?.delete(edge);
  const op = opEdges.get(edge);
  rels.get(op.ob1)?.delete(op);
};

const sum = (...vs) => vs.reduce((p, c) => p + c, 0);
export const avg = (...vs) => sum(...vs) / vs.length;
export const upRels = new Map();
export const downRels = new Map();
const addUpRelEdge = (upOb) => (ob1) => {
  const edge = { ob1, ob2: upOb };
  setMapAdd(upRels, ob1, edge);
  setMapAdd(downRels, upOb, edge);

  return edge;
};

export const upRel =
  (f, unf, selfLoop = false) =>
  (...obs) => {
    const upOb = Ob(f(...obs.map((ob) => ob.v)));
    upOb.f = f;
    upOb.selfLoop = selfLoop;
    upOb.unf = unf;
    //debug info
    upOb.obs = obs;
    upOb.edges = obs.map(addUpRelEdge(upOb));
    // methods
    upOb.addOb = (ob) => {
      const edge = addUpRelEdge(upOb)(ob);

      upOb.obs.push(ob);
      upOb.edges.push(edge);

      set(ob, ob.v);
    };
    upOb.delOb = (ob) => {
      const edge = upOb.edges.find((e) => e.ob1 === ob);
      if (edge === undefined) return;
      delUpRelEdge(edge);
      upOb.obs = upOb.obs.filter((oob) => oob !== ob);
      upOb.edges = upOb.edges.filter((e) => e !== edge);

      // TODO: test. I don't think this is correct.
      set(upOb, f(...upOb.obs.map((ob) => ob.v)));
    };
    return upOb;
  };
export const delUpRelEdge = (upEdge) => {
  upRels.get(upEdge.ob1)?.delete(upEdge);
  downRels.get(upEdge.ob2)?.delete(upEdge);
};
export const delOb = (ob) => {
  for (const edge of rels.get(ob) ?? []) delRel(edge);
  for (const edge of upRels.get(ob) ?? []) delUpRelEdge(edge);
  for (const edge of downRels.get(ob) ?? []) delUpRelEdge(edge);
};

const calculateForces = (obs, delta) => {
  const force = new Map(obs.map((ob) => [ob, delta]));
  let todo = [...obs.map((ob) => [ob, "enter"])];

  const proposeValue = (cur, to, proposedToValue, dir) => {
    const toForce = proposedToValue - to.v;
    if (Math.abs(force.get(to)) > Math.abs(force.get(cur))) return;
    if (Math.abs(toForce) < 0.01) return;

    if (!force.has(to) || Math.abs(toForce) > Math.abs(force.get(to))) {
      force.set(to, toForce);
      todo = todo.filter(([item]) => item !== to);
      todo.push([to, dir]);
    }
  };

  // const visited = new Set();

  while (todo.length > 0) {
    const [cur, dir] = todo.pop();

    // if (visited.has(cur)) console.error("loop in dependency graph!");
    // visited.add(cur);

    for (const { ob2: to, f } of rels.get(cur) ?? []) {
      proposeValue(
        cur,
        to,
        f(cur.v + force.get(cur), to.v, force.get(cur)),
        "side"
      );
    }
    for (const { ob2: to } of upRels.get(cur) ?? []) {
      proposeValue(
        cur,
        to,
        to.f(
          ...[...downRels.get(to)].map((e) => (force.get(e.ob1) ?? 0) + e.ob1.v)
        ),
        "up"
      );
    }
    if (dir !== "up") {
      for (const { ob1: to, ob2: from } of downRels.get(cur) ?? []) {
        proposeValue(
          cur,
          to,
          from.unf(to.v, force.get(cur), cur.v + force.get(cur)),
          "down"
        );
      }
    }
    // todo.sort(([a], [b]) => Math.abs(force.get(a)) - Math.abs(force.get(b)));
  }
  return force;
};

export const set = (ob, v) => {
  const force = calculateForces([ob], v - ob.v);
  for (const [ob, delta] of force) ob.v += delta;
  return force;
};
