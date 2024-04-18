import { SetMap } from "../../../lib/structure/data.js";

type Edge = [Function, Object];
const cat = new SetMap<Object, Edge>();
const ands = new Map<Edge, Edge[]>();

export const mo =
  (edge: Function) =>
  (from: any) =>
  (to: any = Symbol()) => {
    const forward = [edge, to] as Edge;

    cat.add(from, forward);
    return forward;
  };
export const and = (...edges: Edge[]) => {
  for (const edge of edges) {
    if (ands.has(edge)) throw "ands already has edge!";
    ands.set(edge, edges);
  }
  return edges;
};
const andNodesSet = new SetMap<Edge[], any>();
export const andNodes =
  (edges: Edge[]) =>
  (...nodes: any) => {
    for (const node of nodes) andNodesSet.add(edges, node);
  };

const get = <A, B>(map: Map<A, Iterable<B>>, key: A): B[] => [
  ...(map.get(key) ?? []),
];

function* traverseBreadthFirst(...starts: any[]) {
  const visitedNodes = new Set(starts);
  const queue = [...starts];
  while (queue.length > 0) {
    const from = queue.shift();
    for (const forward of get(cat, from)) {
      const [edge, to] = forward;
      if (visitedNodes.has(to)) continue;
      const shoulPropagate = (yield { from, forward }) !== false;
      if (shoulPropagate) {
        queue.push(to);
        visitedNodes.add(to);
      }
    }
  }
}

const forEach = (iter: Generator, f: (...args: any) => any) => {
  let cur = iter.next();
  while (!cur.done) cur = iter.next(f(cur.value));
};

const isAndVisited = (forward: Edge, visitedEdges: Set<Edge>) =>
  get(ands, forward).every((andEdge) => visitedEdges.has(andEdge));

// same as init but without the pulls after the inner while loop
export const push = (...starts: any[]) => {
  const visitedEdges = new Set<Edge>();
  const unvisitedAnds = new Set(starts);

  //console.groupCollapsed();

  // traverse graph, record unvisitedAnds, repeat with unvisitedAnds as input
  while (unvisitedAnds.size > 0) {
    const traversalGenerator = traverseBreadthFirst(...unvisitedAnds);
    unvisitedAnds.clear();

    // iterate over all edges in the graph
    forEach(traversalGenerator, ({ from, forward }) => {
      const [edgeFunction, to] = forward;

      visitedEdges.add(forward);

      //console.debug(from, forward);

      edgeFunction(from, to);

      const shouldTraverseEdge = isAndVisited(forward, visitedEdges);
      if (!shouldTraverseEdge) unvisitedAnds.add(to);
      return shouldTraverseEdge;
    });
  }
  //console.groupEnd();
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
