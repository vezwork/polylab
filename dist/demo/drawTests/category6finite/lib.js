import { SetMap } from "../../../lib/structure/data.js";
export const graph = new SetMap();
const edgeAnds = new Map();
export const to = (edge) => (from) => (to = Symbol()) => {
    const forward = [edge, to];
    graph.add(from, forward);
    return forward;
};
export const and = (edges) => {
    for (const edge of edges) {
        if (edgeAnds.has(edge))
            throw "ands already has edge!";
        edgeAnds.set(edge, edges);
    }
    return edges;
};
const get = (map, key) => [
    ...(map.get(key) ?? []),
];
const isAndVisited = (forward, visitedEdges) => get(edgeAnds, forward).every((andEdge) => visitedEdges.has(andEdge));
// same as init but without the pulls after the inner while loop
export const push = (...starts) => {
    const visitedNodes = new Set(starts);
    const visitedEdges = new Set();
    const unvisitedAnds = new Set(starts);
    while (unvisitedAnds.size > 0) {
        const queue = [...unvisitedAnds];
        unvisitedAnds.clear();
        while (queue.length > 0) {
            const from = queue.shift();
            unvisitedAnds.delete(from);
            for (const forward of get(graph, from)) {
                const [edge, to] = forward;
                if (visitedNodes.has(to))
                    continue;
                visitedEdges.add(forward);
                //console.debug("push edge", edge, from, to);
                edge(from, to);
                // only propagate once all ands are visited, to ensure
                // products are fully valuated before propagation
                if (isAndVisited(forward, visitedEdges)) {
                    queue.push(to);
                    visitedNodes.add(to);
                }
                else
                    unvisitedAnds.add(to);
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
