export const Ob = (v, name) => {
  const newOb = { v, name };
  newOb.valueOf = () => newOb.v;
  newOb.plus = (a) => {
    const plusOb = Ob(v + a);
    rel(newOb, plusOb, { to: (vv) => vv + a, from: (vv) => vv - a });
    return plusOb;
  };
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
  return edge;
};
export const delRel = (edge) => {
  rels.get(edge.ob1)?.delete(edge);
  lers.get(edge.ob2)?.delete(edge);
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
  (f, unf, name, selfLoop = false) =>
  (...obs) => {
    const upOb = Ob(f(...obs.map((ob) => ob.v)), name);
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
  for (const edge of lers.get(ob) ?? []) delRel(edge);
  for (const edge of upRels.get(ob) ?? []) delUpRelEdge(edge);
  for (const edge of downRels.get(ob) ?? []) delUpRelEdge(edge);
};

const padTo = (s = "", l = 0) => s + " ".repeat(Math.max(0, l - s.length));
const columns =
  (...widths) =>
  (...args) =>
  (...data) => {
    console.log(widths.map((w, i) => padTo(data[i], w)).join(""), ...args);
  };
// const collog = columns(16, 10, 14, 15, 8, 0)("color: gray", "color: white");
const collog = () => {};

const setUpHelper = (to, delta, newValue) => {
  const children = [...(downRels.get(to) ?? [])];
  const v = to.f(
    ...children.map((e) => newValue.get(e.ob1) ?? e.ob1.v),
    ...(to.selfLoop ? [newValue.get(to) ?? to.v] : [])
  );
  // delta.set(to, v - to.v);
  collog(
    `${children.map((c) => c.ob1.name)}↑${to.name}`,
    `${children.map((c) => newValue.get(c.ob1) ?? c.ob1.v)}`,
    `↑(%c${newValue.get(to) ?? to.v}`,
    `=> %c${v})`,
    `Δ${delta.get(to)}`
  );
  newValue.set(to, v);
  // to.v = v;
};
const setDownHelper = (from, to, delta, newValue) => {
  const v = from.unf(
    newValue.get(to) ?? to.v,
    delta.get(from),
    newValue.get(from) ?? from.v
  );
  delta.set(to, v - (newValue.get(to) ?? to.v));
  collog(
    `${from.name}↓${to.name}`,
    `Δ${delta.get(from)}`,
    `↓(%c${newValue.get(to) ?? to.v}`,
    `=> %c${v})`,
    `Δ${delta.get(to)}`
  );

  newValue.set(to, v);
  // to.v = v;
};
const setSideHelper = (delta, newValue) => (edge) => {
  const v = edge.f(
    newValue.get(edge.from) ?? edge.from.v,
    newValue.get(edge.to) ?? edge.to.v
  );
  if (!delta.has(edge.to))
    delta.set(edge.to, v - (newValue.get(edge.to) ?? edge.to.v));

  collog(
    `${edge.from.name}→${edge.to.name}`,
    `${newValue.get(edge.from) ?? edge.from.v}`,
    `→(%c(${edge.to.v})${newValue.get(edge.to) ?? edge.to.v}`,
    `=> %c${v})`,
    `Δ${delta.get(edge.to)}`
  );

  newValue.set(edge.to, v);
  // edge.to.v = v;
};
export const set = (ob, v) => {
  const usedEdges = new Set();
  const opDag = upAndDownTraversalDAG(ob);
  const done = new Set();

  const newValue = new Map();
  const delta = new Map();
  delta.set(ob, v - ob.v);
  newValue.set(ob, v);
  // ob.v = v;

  let queue = [[ob, "enter", null]];
  const upNodesToViewedUpEdges = new Map();
  while (queue.length > 0) {
    const [classEntryNode, entryDir, fromNode] = queue.pop();

    traverseClass(classEntryNode, () => {}, setSideHelper(delta, newValue));
    traverseClass(classEntryNode, (cur) => {
      for (const edge of upRels.get(cur) ?? []) {
        if (usedEdges.has(edge)) continue;

        const { ob2: to, ob1: from } = edge;

        usedEdges.add(edge);
        setMapAdd(upNodesToViewedUpEdges, to, edge);

        if (opDag.get(to).size === upNodesToViewedUpEdges.get(to).size) {
          queue.push([to, "up", from]);
          setUpHelper(to, delta, newValue);
        }
      }

      if (!(cur === classEntryNode && entryDir === "up")) {
        for (const edge of downRels.get(cur) ?? []) {
          if (usedEdges.has(edge)) continue;

          const { ob1: to, ob2: from } = edge;
          if (done.has(to)) continue;

          queue.unshift([to, "down", from]);
          done.add(to);
          usedEdges.add(edge);
          setDownHelper(from, to, delta, newValue);
        }
      }
    });
  }

  for (const [ob, v] of newValue) ob.v = v;
};

export const upAndDownTraversalDAG = (ob) => {
  const done = new Set();
  const usedEdges = new Set();
  const opDag = new Map();
  const addEdge = (from, to, dir) => {
    const e = { from, to, dir };
    setMapAdd(opDag, to, e);
  };

  let queue = [[ob, "enter", null]];
  while (queue.length > 0) {
    const [classEntryNode, entryDir, fromNode] = queue.pop();

    traverseClass(classEntryNode, (cur) => {
      for (const edge of upRels.get(cur) ?? []) {
        if (usedEdges.has(edge)) continue;
        const { ob2: to, ob1: from } = edge;

        if (!opDag.has(to)) {
          queue.push([to, "up", from]);
        }
        usedEdges.add(edge);
        addEdge(from, to, "up");
      }

      if (!(cur === classEntryNode && entryDir === "up")) {
        for (const edge of downRels.get(cur) ?? []) {
          if (usedEdges.has(edge)) continue;
          const { ob1: to, ob2: from } = edge;
          if (done.has(to)) continue;
          queue.unshift([to, "down", from]);
          done.add(to);
          usedEdges.add(edge);
        }
      }
    });
  }
  return opDag;
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

// TESTS
const test = (f) => {
  const testSuccess = f();
  console.log(
    `test${f.toString().split("=>")[1]} %c` +
      (testSuccess ? "passed" : "failed"),
    `color: ${testSuccess ? "yellowgreen" : "crimson"}`
  );
};

const scenario1 = () => {
  const o1 = Ob(0, "1");
  const o2 = Ob(0, "2");
  const o3 = Ob(0, "3");

  const g1 = upRel(Math.min, (a, d, b) => a + d, "g1")(o1);
  const g12 = upRel(Math.min, (a, d, b) => a + d, "g12")(o1, o2);
  const g23 = upRel(Math.min, (a, d, b) => a + d, "g23")(o2, o3);
  rel(g1, g23, { to: (v) => v + 10, from: (v) => v - 10 });

  console.log("start", o1, o2, o3, g12, g23);
  set(g12, 90);
  console.log(o1, o2, o3, g12, g23);
  test(() => o1.v === 90);
  test(() => o2.v === 100);
  test(() => o3.v === 100);
};
scenario1();

const scenario2 = () => {
  const o1 = Ob(0, "1");
  const o2 = Ob(0, "2");
  const o3 = Ob(0, "3");

  const g12 = upRel(Math.min, (a, d, b) => a + d, "g12")(o1, o2);
  const g23 = upRel(Math.min, (a, d, b) => a + d, "g23")(o2, o3);
  rel(o1, g23, { to: (v) => v + 10, from: (v) => v - 10 });

  console.log("start scenario 2", o1, o2, o3, g12, g23);
  set(g12, 90);
  console.log(o1, o2, o3, g12, g23);
  test(() => o1.v === 90);
  test(() => o2.v === 100);
  test(() => o3.v === 100);
};
scenario2();

const scenario3 = () => {
  const o1 = Ob(0, "1");
  const o2 = Ob(0, "2");
  const o3 = Ob(0, "3");
  const o4 = Ob(0, "4");

  const g13 = upRel(Math.min, (a, d, b) => a + d, "g13")(o1, o3);
  const g12 = upRel(Math.min, (a, d, b) => a + d, "g12")(o1, o2);
  const g34 = upRel(Math.min, (a, d, b) => a + d, "g34")(o3, o4);
  rel(g12, g34, { to: (v) => v + 10, from: (v) => v - 10 });

  console.log("start scenario 3");
  test(() => o1.v === 0);
  test(() => o2.v === 0);
  test(() => o3.v === 10);
  test(() => o4.v === 10);
  set(g13, -100);

  console.log(o1, o2, o3, o4, g13, g12, g34);
  test(() => o1.v === -100);
  test(() => o2.v === 0);
  test(() => o3.v === -90);
  test(() => o4.v === 10);
};
scenario3();

const scenario4 = () => {
  const o1 = Ob(0, "1");
  const o2 = Ob(0, "2");
  const o3 = Ob(0, "3");
  const o4 = Ob(0, "4");

  const g13 = upRel(Math.min, (a, d, b) => a + d, "g13")(o1, o3);
  const g12 = upRel(Math.min, (a, d, b) => a + d, "g12")(o1, o2);
  const g34 = upRel(Math.min, (a, d, b) => a + d, "g34")(o3, o4);
  rel(g12, g34, { to: (v) => v + 10, from: (v) => v - 10 });

  console.log("start scenario 4");
  test(() => o1.v === 0);
  test(() => o2.v === 0);
  test(() => o3.v === 10);
  test(() => o4.v === 10);
  set(g13, 200);

  console.log(o1, o2, o3, o4, g13, g12, g34);
  test(() => o1.v === 200);
  test(() => o2.v === 0);
  test(() => o3.v === 210);
  test(() => o4.v === 10);
};
scenario4();

const scenario5 = () => {
  const o1 = Ob(0, "1");
  const o2 = Ob(0, "2");
  const o3 = Ob(0, "3");
  const o4 = Ob(0, "4");

  const g13 = upRel(Math.min, (a, d, b) => a + d, "g13")(o1, o3);
  const g12 = upRel(Math.max, (a, d, b) => a + d, "g12")(o1, o2);
  const g34 = upRel(Math.min, (a, d, b) => a + d, "g34")(o3, o4);
  rel(g12, g34, { to: (v) => v + 10, from: (v) => v - 10 });

  console.log("start scenario 5");
  test(() => o1.v === 0);
  test(() => o2.v === 0);
  test(() => o3.v === 10);
  test(() => o4.v === 10);
  set(g13, 200);

  console.log(o1, o2, o3, o4, g13, g12, g34);
  test(() => o1.v === 200);
  test(() => o2.v === 0);
  test(() => o3.v === 210);
  test(() => o4.v === 210);
};
scenario5();

const scenario6 = () => {
  const o1 = Ob(0, "1");
  const o2 = Ob(0, "2");
  const o3 = Ob(0, "3");
  const o4 = Ob(0, "4");

  const g13 = upRel(Math.min, (a, d, b) => a + d, "g13min")(o1, o3);
  const g12 = upRel(Math.max, (a, d, b) => a + d, "g12max")(o1, o2);
  const g34 = upRel(Math.min, (a, d, b) => a + d, "g34min")(o3, o4);
  rel(g12, g34, { to: (v) => v + 10, from: (v) => v - 10 });

  console.log("start scenario 6");
  console.log(o1, o2, o3, o4, g13, g12, g34);
  test(() => o1.v === 0);
  test(() => o2.v === 0);
  test(() => o3.v === 10);
  test(() => o4.v === 10);
  set(g13, -200);

  console.log(o1, o2, o3, o4, g13, g12, g34);
  test(() => o1.v === -200);
  test(() => o2.v === -200);
  test(() => o3.v === -190);
  test(() => o4.v === 10);
};
scenario6();

// --- current issues and worries May 21 2025
// The example I have on my screen works correctly! But! I made another
// , slightly more complex, example that does not work correctly :(
// I'm not confident I will be able to fix this issue by iterating on /
// bug fixing the current implementation.
// Here are some thoughts about how I can think about the problem / solution
// - I feel like it is POSSIBLE to fix this issue because in theory every
//   Ob only needs to be set once. EXCEPT upRel Obs because setting something
//   on the inside and then setting it from the outside can result in two
//   different set values. (when setting from the inside ends up nedging the
//   upRel ob by less than a full delta e.g. a min upRel ob has two obs at 10 and 20
//   and the 20 ob gets moves by -12 to 8 which nudges the upRel ob from 10 to 8 for
//   a delta of -2)
//   - can this be addressed? Could we wait for both the outside set and the inside sets?
//     What if finding a traversal DAG made it so this case does not happen and inside sets
//     + outside sets get turned just into an outside set (the up path gets overwritten by
//     a down path?)
// - The new examples I've come up with have been confusing me. Does the traversal order matter?
//   Are there subtle differences between the DAG which insantly crosses edges and the topologically
//   traversed graph?
// - I can think of three possible approaches to going forward:
//   - diagnose issue in an example and slap on a fix
//   - eliminate the planning / DAG-finding phase and try an innefficient fixed point propagation
//   - de-duplicate the traversal logic in the DAG-finding and value propagation functions by
//     creating the complete value propagation graph in the DAG-finder and then using a generic
//     topological traversal algorithm on that
