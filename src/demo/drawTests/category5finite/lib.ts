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
export const push = (...starts: any[]) => {
  const visitedNodes = new Set(starts);
  const visitedEdges = new Set();
  const unvisitedProducts = new Set(starts);

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

        console.debug("push edge", edge, from, to);
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
