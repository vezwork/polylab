import { localStronglyConnectedComponents } from "./stronglyConnectedComponents.js";
const gradeUp = (...init) =>
  traverseUpClasses((edge) => {
    const class1 = obClass.get(edge.ob1);
    const class2 = obClass.get(edge.ob2);
    grades.set(
      class2,
      Math.max(grades.get(class2) ?? 0, grades.get(class1) + 1)
    );
  })(...init);

export const obClass = new Map();
const initialClasses = new Set();
const grades = new Map();

const union = (ob1, ob2) => {
  const c1 = obClass.get(ob1);
  const c2 = obClass.get(ob2);
  const unionClass = c1.union(c2);
  grades.set(unionClass, Math.max(grades.get(c1), grades.get(c2)));
  gradeUp(unionClass);
  for (const ob of unionClass) obClass.set(ob, unionClass);

  if (initialClasses.has(c1) && initialClasses.has(c2))
    initialClasses.add(unionClass);

  initialClasses.delete(c1);
  initialClasses.delete(c2);
  grades.delete(c1);
  grades.delete(c2);
};

export const Obs = [];
export const Ob = (v, flag) => {
  const newOb = { v, id: Math.random().toFixed(3).slice(2) };
  const newClass = new Set([newOb]);
  newOb.flag = flag;
  obClass.set(newOb, newClass);
  initialClasses.add(newClass);
  grades.set(0);
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
export const delRel = (edge) => {
  rels.get(edge.ob1)?.delete(edge);
  lers.get(edge.ob2)?.delete(edge);

  // un-union
  // - add new class
  const oldClass = obClass.get(edge.ob1);
  const newClass = new Set();
  // - set the obs connected to e.g. ob2 to the new class
  let hasUpRelsIn = false;
  traverseClass(edge.ob2, (cur) => {
    newClass.add(cur);
    oldClass.delete(cur);
    if (downRels.get(cur)?.size > 0) hasUpRelsIn = true;
  });
  // - maintain initialClasses
  if (!hasUpRelsIn) initialClasses.add(newClass);
  hasUpRelsIn = false;
  traverseClass(edge.ob1, (cur) => {
    if (downRels.get(cur)?.size > 0) hasUpRelsIn = true;
  });
  if (!hasUpRelsIn) initialClasses.add(oldClass);
  // note: maybe rethink classes and grading altogether because grade has a perf problem
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
    grades.set(
      obClass.get(upOb),
      Math.max(...obs.map((ob) => grades.get(obClass.get(ob))))
    );
    upOb.obs = obs;
    upOb.edges = obs.map((ob) => upRelHelper(ob, upOb, f));
    return upOb;
  };
export const delUpRelEdge = (upEdge) => {
  upRels.get(upEdge.ob1)?.delete(upEdge);
  downRels.get(upEdge.ob2)?.delete(upEdge);

  let hasUpRelsIn = false;
  traverseClass(upEdge.ob2, (cur) => {
    if (downRels.get(cur)?.size > 0) hasUpRelsIn = true;
  });
  if (!hasUpRelsIn) initialClasses.add(obClass.get(upEdge.ob2));
};
export const delOb = (ob) => {
  for (const edge of rels.get(ob) ?? []) delRel(edge);
  for (const edge of lers.get(ob) ?? []) delRel(edge);
  for (const edge of upRels.get(ob) ?? []) delUpRelEdge(edge);
  for (const edge of downRels.get(ob) ?? []) delUpRelEdge(edge);
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

      traverseClass(
        enter,
        () => {},
        (edge) => {
          edge.to.setOrder = setOrder.size;
          if (setOrder.get(edge.to)) setOrder.set(edge.to, "!");
          else setOrder.set(edge.to, setOrder.size);

          const v = edge.f(edge.from.v);
          delta.set(edge.to, v - edge.to.v);
          edge.to.v = v;
        }
      );
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
  const g = grades;

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

    traverseClass(
      cur,
      (cur) => {
        for (const edge of upRels.get(cur) ?? []) {
          if (!viewed.has(edge.ob2)) {
            queue.push(["up", edge.ob2]);
            viewed.add(edge.ob2);
            noDown.add(edge.ob2);
          }
        }
        if (!noDown.has(cur)) {
          for (const edge of downRels.get(cur) ?? []) {
            if (!viewed.has(edge.ob1)) {
              queue.push(["down", edge.ob1, edge.ob2]);
              viewed.add(edge.ob1);
            }
          }
        }
      },
      (edge) => {
        const obBeingSet = edge.to;
        queue = queue.filter(([dir, ob]) => ob !== obBeingSet);
        viewed.add(obBeingSet);
        setMapAdd(subgraph, edge.from, edge);
        setMapAdd(subgraph, edge.to, { to: edge.from, from: edge.to });
        //noDown.delete(obBeingSet);
      }
    );

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
const traverseClass = (ob, onNode, onEdge = () => {}) => {
  const viewed = new Set([ob]);
  let queue = [ob];
  while (queue.length > 0) {
    const cur = queue.pop();

    onNode(cur);

    for (const edge of edgesOut(cur)) {
      if (!viewed.has(edge.to)) {
        queue.push(edge.to);
        viewed.add(edge.to);

        onEdge(edge);
      }
    }
  }
};
const traverseUpClasses =
  (onEdge) =>
  (...init) => {
    const queue = [...init];
    while (queue.length > 0) {
      const cur = queue.pop();
      for (const ob of cur) {
        for (const edge of upRels.get(ob) ?? []) {
          const c2 = obClass.get(edge.ob2);
          onEdge(edge);
          queue.push(c2);
        }
      }
    }
  };

// TODO:
// - clean up core algorithm to be `findNiceDAG` then toposort (with visit direction and class entrance)
//   - remove unecessary up direction sets
// - add deletion of rels and upRels
// PERF TODO:
// - grade is taking up a lot of time
