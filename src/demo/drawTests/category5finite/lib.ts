import { SetMap } from "../../../lib/structure/data.js";

type Edge = [Function, Object];
const cat = new SetMap<Object, Edge>();
const catop = new SetMap<Object, Edge>();
const op = new Map<Edge, Edge>();
const ands = new Map<Edge, Set<Edge>>();

export const mo =
  (edge: Function) =>
  (from: any) =>
  (to: any = Symbol()) => {
    const forward = [edge, to] as Edge;
    const backward = [edge, from] as Edge;
    op.set(forward, backward);
    op.set(backward, forward);

    cat.add(from, forward);
    catop.add(to, backward);

    return forward;
  };
export const and = (...edges: any) => {
  for (const edge of edges) {
    if (ands.has(edge)) throw "ands already has edge!";
    ands.set(edge, edges);
  }
};

const get = <A, B>(map: Map<A, Iterable<B>>, key: A): B[] => [
  ...(map.get(key) ?? []),
];

// same as init but without the pulls after the inner while loop
export const push = (start) => {
  const visitedNodes = new Set();
  const visitedEdges = new Set();
  const unvisitedProducts = new Set([start]);

  while (unvisitedProducts.size > 0) {
    const queue = [...unvisitedProducts];
    unvisitedProducts.clear();

    while (queue.length > 0) {
      const from = queue.shift();
      unvisitedProducts.delete(from);

      for (const forward of get(cat, from)) {
        const [edge, to] = forward;
        if (visitedNodes.has(to)) continue;
        visitedEdges.add(forward);

        console.log("push edge", edge, from, to);
        edge(from, to);

        // only propagate once all ands are visited, to ensure
        // products are fully valuated before propagation
        const andsAreVisited = get(ands, forward).every((andEdge) =>
          visitedEdges.has(andEdge)
        );

        if (andsAreVisited) {
          queue.push(to);
          visitedNodes.add(to);
        } else unvisitedProducts.add(to);
      }
    }
  }
};

export const init = (start) => {
  const visitedNodes = new Set();
  const visitedEdges = new Set();
  const unvisitedProducts = new Set([start]);

  while (unvisitedProducts.size > 0) {
    const queue = [...unvisitedProducts];
    unvisitedProducts.clear();

    while (queue.length > 0) {
      const from = queue.shift();
      unvisitedProducts.delete(from);
      console.group("push visiting!");
      console.log("visiting: ", from);

      for (const forward of get(cat, from)) {
        const [edge, to] = forward;
        if (visitedNodes.has(to)) continue;
        visitedEdges.add(forward);

        console.log("push edge 1", edge, from, to);
        edge(from, to);
        console.log("push edge 2", edge, from, to);

        // only propagate once all ands are visited, to ensure
        // products are fully valuated before propagation
        const andsAreVisited = get(ands, forward).every((andEdge) =>
          visitedEdges.has(andEdge)
        );

        if (andsAreVisited) {
          queue.push(to);
          visitedNodes.add(to);
        } else unvisitedProducts.add(to);
      }
      console.groupEnd();
    }

    for (const a of unvisitedProducts) pull(a, visitedNodes, visitedEdges);
  }
};

// unecessarily pulls multiple `and`s (necessary for init though prob)
export const pull = (
  to,
  visitedNodes = new Set(),
  visitedForwardEdges = new Set()
) => {
  if (visitedNodes.has(to)) return; // INCORRECT
  visitedNodes.add(to); // INCORRECT
  console.group("pull visiting!");
  console.log("visiting: ", to);
  for (const backward of get(catop, to)) {
    const forward = op.get(backward);
    if (visitedForwardEdges.has(forward)) continue;
    visitedForwardEdges.add(forward);

    const [edge, from] = backward;

    // valuate `from`, then propagate to `to`
    pull(from, visitedNodes, visitedForwardEdges);
    console.log("pull edge 1", edge, from, to);
    edge(from, to);
    console.log("pull edge 2", edge, from, to);
  }
  console.groupEnd();
};

// note: need an "init" which is a combination of "push" and "pull"
// because we need the property that the entire system is in a consistent state
// before pushing / pulling e.g.
// a=[0], b=[1], c=[[],[]]; a->c[0], b->c[1]; push(a)
// will result in a=[0], b=[1], c=[[0],[]]
// which is not consistent.

// IMPORTANT NOTE: I just realized, after testing category4finite out, that
// it is necessary to have splits (a.k.a. `and`s) in order to have bidirectional products.

// IMPORTANT NOTE: it is not possible to have an "init" based entirely upon connectivity.
// init would need to check the values at each node to see if they are defined and propagate
// defined values into undefined values. e.g. `undefined <-> a <-> undefined`.
