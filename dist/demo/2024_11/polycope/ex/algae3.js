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

let y = 30;
export const Obs = [];
export const Ob = (v, flag) => {
  const newOb = { v, y: (y += 10), id: Math.random().toFixed(3).slice(2) };
  const newClass = new Set([newOb]);
  newOb.flag = flag;
  classes.add(newClass);
  obClass.set(newOb, newClass);
  initialClasses.add(newClass);
  Obs.push(newOb);
  return newOb;
};

const getElFromSet = (set) => {
  for (const el of set) return el;
};
export const init = () => {
  for (const cl of initialClasses) {
    const ob = getElFromSet(cl);
    set(ob, ob.v);
  }
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
  setMapAdd(rels, ob1, edge);
  setMapAdd(lers, ob2, edge);
  union(ob1, ob2);
  return edge;
};

const sum = (...vs) => vs.reduce((p, c) => p + c, 0);
export const avg = (...vs) => sum(...vs) / vs.length;
export const upRels = new Map();
export const downRels = new Map();
export const upRel = (ob1, ob2, f = Math.max) => {
  const edge = { ob1, ob2, f };
  setMapAdd(upRels, ob1, edge);
  setMapAdd(downRels, ob2, edge);

  initialClasses.delete(obClass.get(ob2));

  return edge;
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

  const obdelta = v - ob.v;

  const g = grade();

  let viewed = new Set([ob]);
  const noDown = new Set();
  let queue = [["down", ob, obdelta]];
  while (queue.length > 0) {
    const [dir, cur, delta] = queue.pop();

    if (dir === "up") {
      const children = [...(downRels.get(cur) ?? [])];
      if (children.length > 0)
        cur.v = children[0].f(...children.map((e) => e.ob1.v));
    }
    if (dir === "down") {
      cur.v += delta;
    }
    const {
      ups,
      downs,
      viewed: vv,
    } = updateInClass([obdelta, cur], noDown, (obBeingSet) => {
      queue = queue.filter(([dir, ob]) => ob !== obBeingSet);
      noDown.delete(obBeingSet);
    });
    viewed = viewed.union(vv);

    for (const edge of ups) {
      if (!viewed.has(edge.ob2)) {
        queue.push(["up", edge.ob2]);
        viewed.add(edge.ob2);
        noDown.add(edge.ob2);
      }
    }
    for (const edge of downs) {
      if (!viewed.has(edge.ob1)) {
        queue.push(["down", edge.ob1, edge.delta]);
        viewed.add(edge.ob1);
      }
    }

    queue.sort((a, b) => {
      const gradeB = g.get(obClass.get(b[1]));
      const gradeA = g.get(obClass.get(a[1]));
      if (gradeB === gradeA) return a[0] === "down" ? 1 : -1;
      return gradeB - gradeA;
    });
  }
};

const edgesOut = (cur) => {
  let res = [];

  for (const edge of rels.get(cur) ?? [])
    res.push({ from: edge.ob1, to: edge.ob2, f: edge.f.to });
  for (const edge of lers.get(cur) ?? [])
    res.push({ from: edge.ob2, to: edge.ob1, f: edge.f.from });

  return res;
};
const updateInClass = (obdelta, noDown, onset) => {
  const viewed = new Set([obdelta[1]]);
  let queue = [obdelta];
  const ups = [];
  const downs = [];
  while (queue.length > 0) {
    const [delta, cur] = queue.pop();
    setOrder.set(cur, setOrder.size);

    ups.push(...(upRels.get(cur) ?? []));
    if (!noDown.has(cur))
      downs.push(
        ...[...(downRels.get(cur) ?? [])].map((e) => ({ ...e, delta }))
      );

    for (const edge of edgesOut(cur)) {
      if (!viewed.has(edge.to)) {
        const v = edge.f(edge.from.v);
        const delta = v - edge.to.v;
        queue.push([delta, edge.to]);
        viewed.add(edge.to);
        edge.to.v = v;
        onset(edge.to);
      }
    }
  }

  return { ups, downs, viewed };
};

// TODO:
// - initialize values (how?)
// - propagate
// - visualize
