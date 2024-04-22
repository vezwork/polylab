import { SetMap } from "../../../lib/structure/data.js";

export type Edge = [Function, Object];
export const graph = new SetMap<Object, Edge>();
export const edgeAnds = new Map<Edge, Edge[]>();

export const to =
  (edge: Function) =>
  (from: any) =>
  (to: any = Symbol()) => {
    const forward = [edge, to] as Edge;

    graph.add(from, forward);
    return forward;
  };
export const and = (edges: Edge[]) => {
  for (const edge of edges) {
    if (edgeAnds.has(edge)) throw "ands already has edge!";
    edgeAnds.set(edge, edges);
  }
  return edges;
};

const get = <A, B>(map: Map<A, Iterable<B>>, key: A): B[] => [
  ...(map.get(key) ?? []),
];

const isAndVisited = (forward: Edge, visitedEdges: Set<Edge>) =>
  get(edgeAnds, forward).every((andEdge) => visitedEdges.has(andEdge));

// same as init but without the pulls after the inner while loop
export const push = (...starts: any[]) => {
  const visitedNodes = new Set(starts);
  const visitedEdges = new Set<Edge>();
  const unvisitedAnds = new Set(starts);

  while (unvisitedAnds.size > 0) {
    const queue = [...unvisitedAnds];
    unvisitedAnds.clear();

    console.warn("loop");

    while (queue.length > 0) {
      const from = queue.shift();
      unvisitedAnds.delete(from);

      for (const forward of get(graph, from)) {
        const [edge, to] = forward;
        if (visitedNodes.has(to)) continue;
        visitedEdges.add(forward);

        console.debug("push edge", edge, from, to);
        edge(from, to);

        // only propagate once all ands are visited, to ensure
        // products are fully valuated before propagation
        if (isAndVisited(forward, visitedEdges)) {
          queue.push(to);
          visitedNodes.add(to);
        } else unvisitedAnds.add(to);
      }
    }
  }
};

// This is in a good spot. It works well and I understand it more than category3!
// core limitations (maybe can live with them though):
// - consistency of pushed data is assumed. I can't easily reason about what happens
//   when pushed data is not consistent, and I believe it can lead to real issues like products not
//   being consistent with their components. partial soln: we can check if already-visited node data is consistent
//   with what would be propagated via other edges. Partial soln: can we introduce some edge priority or something?
// - order of edges? Mostly necessary for side effects like drawing order or clearing the screen at start of push.
// - conditional propogation. The algorithm currently assumes that EVERYTHING is relevant and should be
//   filled out. This is not always the case, sometimes things are out of view or don't need to be computed
//   for current calculations (e.g. really small things on the screen don't necessarily have to be calculated and rendered).
//   Will come back to this when I have a more concrete need for it.
