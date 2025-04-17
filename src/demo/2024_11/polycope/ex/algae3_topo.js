import { localStronglyConnectedComponents } from "./stronglyConnectedComponents.js";
const classes = new Set();
export const obClass = new Map();
const initialClasses = new Set();
const union = (ob1, ob2) => {
  const c1 = obClass.get(ob1);
  const c2 = obClass.get(ob2);
  classes.delete(c1);
  classes.delete(c2);
  const unionClass = c1.union(c2);
  classes.add(unionClass);
  for (const ob of unionClass) obClass.set(ob, unionClass);

  if (initialClasses.has(c1) && initialClasses.has(c2))
    initialClasses.add(unionClass);

  initialClasses.delete(c1);
  initialClasses.delete(c2);
};

export const Obs = [];
export const Ob = (v, flag) => {
  const newOb = { v, id: Math.random().toFixed(3).slice(2) };
  const newClass = new Set([newOb]);
  newOb.flag = flag;
  classes.add(newClass);
  obClass.set(newOb, newClass);
  initialClasses.add(newClass);
  Obs.push(newOb);
  return newOb;
};

const setMapAdd = (setMap, key, value) => {
  if (!setMap.has(key)) setMap.set(key, new Set());
  setMap.get(key).add(value);
  return value;
};

export const rels = new Map();
const lers = new Map();
export const rel = (ob1, ob2, f) => {
  const edge = { ob1, ob2, f };
  set(ob2, f.to(ob1.v));
  setMapAdd(rels, ob1, edge);
  setMapAdd(lers, ob2, edge);
  union(ob1, ob2);
  return edge;
};

const sum = (...vs) => vs.reduce((p, c) => p + c, 0);
export const avg = (...vs) => sum(...vs) / vs.length;
export const upRels = new Map();
export const downRels = new Map();
const upRelHelper = (ob1, ob2, f = Math.max) => {
  const edge = { ob1, ob2, f };
  setMapAdd(upRels, ob1, edge);
  setMapAdd(downRels, ob2, edge);

  initialClasses.delete(obClass.get(ob2));

  return edge;
};
export const upRel =
  (f, flag) =>
  (...obs) => {
    const upOb = Ob(f(...obs.map((ob) => ob.v)), flag);
    upOb.obs = obs;
    upOb.init = [f, ...obs.map((ob) => ob.v)];
    for (const ob of obs) upRelHelper(ob, upOb, f);
    return upOb;
  };

export const grade = () => {
  const classGrade = new Map();
  for (const cl of initialClasses) classGrade.set(cl, 0);
  const queue = [...initialClasses];
  while (queue.length > 0) {
    const cur = queue.pop();
    for (const ob of cur) {
      for (const edge of upRels.get(ob) ?? []) {
        const c2 = obClass.get(edge.ob2);
        classGrade.set(
          c2,
          Math.max(classGrade.get(c2) ?? 0, classGrade.get(cur) + 1)
        );
        queue.push(c2);
      }
    }
  }
  return classGrade;
};

export const setOrder = new Map();
export const set = (ob, v) => {
  setOrder.clear();

  const dag = findNiceDAG(ob);
  const delta = new Map();
  delta.set(ob, v - ob.v);
  ob.v = v;

  ob.setOrder = setOrder.size;
  setOrder.set(ob, 0);

  const alreadySet = new Set([ob]);

  localStronglyConnectedComponents(
    ob,
    (node) => dag.get(node) ?? [],
    (scc, enter) => {
      enter.setOrder = setOrder.size;
      if (setOrder.get(enter)) setOrder.set(enter, "!");
      else setOrder.set(enter, setOrder.size);

      traverseClass(enter, new Set(), (_, edge) => {
        edge.to.setOrder = setOrder.size;
        if (setOrder.get(edge.to)) setOrder.set(edge.to, "!");
        else setOrder.set(edge.to, setOrder.size);

        const v = edge.f(edge.from.v);
        delta.set(edge.to, v - edge.to.v);
        edge.to.v = v;
      });
    },
    ({ from, to, dir }) => {
      const cur = to;
      if (dir === "up") {
        // q: is this getting calculated duplicate times for some nodes?
        // a: yes
        const children = [...(downRels.get(cur) ?? [])];
        if (children.length > 0) {
          // ISSUE: we are not visiting edges in the right order, because
          //   we don't get correct behaviour if we return when `alreadySet.has(cur)`
          //if (alreadySet.has(cur)) return;
          alreadySet.add(cur);
          cur.v = children[0].f(...children.map((e) => e.ob1.v));
        }
      }
      if (dir === "down") {
        const v = cur.v + delta.get(from);
        delta.set(cur, v - cur.v);
        cur.v = v;
      }
    }
  );
};

export const findNiceDAG = (ob) => {
  const g = grade();

  const subgraph = new Map();

  let viewed = new Set([ob]);
  const noDown = new Set();
  let queue = [["down", ob]];
  while (queue.length > 0) {
    const [dir, cur, from] = queue.pop();

    if (dir === "up") {
      const children = [...(downRels.get(cur) ?? [])];
      for (const edge of children)
        setMapAdd(subgraph, edge.ob1, {
          from: edge.ob1,
          to: edge.ob2,
          dir: "up",
        });
    } else {
      setMapAdd(subgraph, from, {
        from,
        to: cur,
        dir: "down",
      });
    }

    const { ups, downs } = traverseClass(cur, noDown, (obBeingSet, edge) => {
      queue = queue.filter(([dir, ob]) => ob !== obBeingSet);
      viewed.add(obBeingSet);
      setMapAdd(subgraph, edge.from, edge);
      setMapAdd(subgraph, edge.to, { to: edge.from, from: edge.to });
      //noDown.delete(obBeingSet);
    });

    for (const edge of ups) {
      if (!viewed.has(edge.ob2)) {
        queue.push(["up", edge.ob2]);
        viewed.add(edge.ob2);
        noDown.add(edge.ob2);
      }
    }
    for (const edge of downs) {
      if (!viewed.has(edge.ob1)) {
        queue.push(["down", edge.ob1, edge.ob2]);
        viewed.add(edge.ob1);
      }
    }

    queue.sort((a, b) => {
      const gradeB = g.get(obClass.get(b[1]));
      const gradeA = g.get(obClass.get(a[1]));
      // prioritize going down
      if (gradeB === gradeA) return a[0] === "down" ? 1 : -1;
      return gradeB - gradeA;
    });
  }
  return subgraph;
};

const edgesOut = (cur) => {
  let res = [];

  for (const edge of rels.get(cur) ?? [])
    res.push({ from: edge.ob1, to: edge.ob2, f: edge.f.to });
  for (const edge of lers.get(cur) ?? [])
    res.push({ from: edge.ob2, to: edge.ob1, f: edge.f.from });

  return res;
};
const traverseClass = (ob, noDown, onset) => {
  const viewed = new Set([ob]);
  let queue = [ob];
  const ups = [];
  const downs = [];
  while (queue.length > 0) {
    const cur = queue.pop();

    ups.push(...(upRels.get(cur) ?? []));
    if (!noDown.has(cur)) downs.push(...[...(downRels.get(cur) ?? [])]);

    for (const edge of edgesOut(cur)) {
      if (!viewed.has(edge.to)) {
        queue.push(edge.to);
        viewed.add(edge.to);

        onset(edge.to, edge);
      }
    }
  }

  return { ups, downs };
};

// TODO:
// - initialize values (how?)
// - propagate
// - visualize
