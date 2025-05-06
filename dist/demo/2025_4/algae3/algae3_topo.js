export const Obs = [];
export const Ob = (v) => {
  const newOb = { v };
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
  (f, unf, selfLoop = false) =>
  (...obs) => {
    const upOb = Ob(f(...obs.map((ob) => ob.v)));
    upOb.f = f;
    upOb.selfLoop = selfLoop;
    upOb.unf = unf;
    //debug info
    upOb.obs = obs;
    upOb.edges = obs.map(addUpRelEdge(upOb));
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

export const set = (ob, v) => {
  const { subgraph: dag, opSubgraph: opDag } = upAndDownTraversalDAG(ob);

  const delta = new Map();
  delta.set(ob, v - ob.v);
  ob.v = v;

  // note: could set multiple things at once by finding DAG with
  // multiple initial nodes and adding those nodes to this queue
  const queue = [ob];
  const viewedOpEdges = new Map();
  while (queue.length > 0) {
    let cur = queue.pop();

    const edges = [];
    traverseClass(
      cur,
      (node) => edges.push(...(dag.get(node) ?? [])),
      (edge) => {
        // on side
        const v = edge.f(edge.from.v, edge.to.v);
        delta.set(edge.to, v - edge.to.v);
        edge.to.v = v;
      }
    );

    for (const edge of edges) {
      const { from, to, dir } = edge;
      setMapAdd(viewedOpEdges, to, edge);

      if (dir === "up") {
        // on up
        if (opDag.get(to).size === viewedOpEdges.get(to).size) {
          queue.push(to);
          const children = [...(downRels.get(to) ?? [])];
          to.v = to.f(
            ...children.map((e) => e.ob1.v),
            ...(to.selfLoop ? [to.v] : [])
          );
        }
      } else {
        // on down
        queue.push(to);

        const v = from.unf(to.v, delta.get(from), from.v);
        delta.set(to, v - to.v);
        to.v = v;
      }
    }
  }
};

export const upAndDownTraversalDAG = (ob) => {
  const subgraph = new Map();
  const opSubgraph = new Map();

  const setByDir = new Map([[ob, "enter"]]);

  const addEdge = (from, to, dir) => {
    const e = { from, to, dir };
    setMapAdd(subgraph, from, e);
    setMapAdd(opSubgraph, to, e);
    setByDir.set(to, dir);
  };

  let queue = [ob];
  while (queue.length > 0) {
    traverseClass(
      queue.pop(),
      (cur) => {
        for (const edge of upRels.get(cur) ?? []) {
          const to = edge.ob2;
          const from = edge.ob1;
          if (!setByDir.has(to)) {
            queue.push(to);
            // note: this is extra work that could be avoided by interleaving visiting classes
            traverseClass(to, (n) => setByDir.set(n, "side"));
            addEdge(from, to, "up");
          } else if (setByDir.get(to) === "up") {
            addEdge(from, to, "up");
          }
          // else don't use this edge
        }
        if (setByDir.get(cur) !== "up") {
          for (const edge of downRels.get(cur) ?? []) {
            const to = edge.ob1;
            const from = edge.ob2;
            if (!setByDir.has(to)) {
              queue.push(to);
              traverseClass(to, (n) => {
                if (!setByDir.has(n)) setByDir.set(n, "side");
              });
              addEdge(from, to, "down");
            }
          }
        }
      },
      (edge) => {
        const obBeingSet = edge.to;
        if (!setByDir.has(obBeingSet)) setByDir.set(obBeingSet, "side");
      }
    );
  }
  return { subgraph, opSubgraph };
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
