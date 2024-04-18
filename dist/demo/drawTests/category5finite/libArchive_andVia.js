import { SetMap } from "../../../lib/structure/data.js";
const cat = new SetMap();
const ands = new Map();
export const mo = (edge) => (from) => (to = Symbol()) => {
    const forward = [edge, to];
    cat.add(from, forward);
    return forward;
};
export const and = (...edges) => {
    for (const edge of edges) {
        if (ands.has(edge))
            throw "ands already has edge!";
        ands.set(edge, edges);
    }
    return edges;
};
const ops = new Map();
export const op = (edges, opEdges) => {
    for (const edge of edges) {
        ops.set(edge, opEdges);
    }
};
const get = (map, key) => [
    ...(map.get(key) ?? []),
];
function* traverseBreadthFirst(...starts) {
    const visitedNodes = new Set(starts);
    const queue = [...starts];
    while (queue.length > 0) {
        const from = queue.shift();
        for (const forward of get(cat, from)) {
            const [edge, to] = forward;
            const shoulPropagate = (yield [from, edge, to]) !== false;
            if (shoulPropagate) {
                queue.push(to);
                visitedNodes.add(to);
            }
        }
    }
}
// same as init but without the pulls after the inner while loop
export const push = (...starts) => {
    const visitedNodes = new Set(starts);
    const visitedEdges = new Set();
    const unvisitedAnds = new Set(starts);
    const nodesVia = new Map();
    while (unvisitedAnds.size > 0) {
        const queue = [...unvisitedAnds];
        unvisitedAnds.clear();
        while (queue.length > 0) {
            const from = queue.shift();
            unvisitedAnds.delete(from);
            for (const forward of get(cat, from)) {
                const [edge, to] = forward;
                if (visitedNodes.has(to))
                    continue;
                const viaEdge = nodesVia.get(to);
                if (viaEdge && get(ops, viaEdge).includes(forward))
                    continue;
                visitedEdges.add(forward);
                //console.debug("push edge", edge, from, to);
                edge(from, to);
                nodesVia.set(to, forward);
                // only propagate once all ands are visited, to ensure
                // products are fully valuated before propagation
                const myAnd = get(ands, forward);
                const andsAreVisited = myAnd.every((andEdge) => visitedEdges.has(andEdge));
                if (andsAreVisited) {
                    queue.push(to);
                    visitedNodes.add(to);
                }
                else {
                    unvisitedAnds.add(to);
                }
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
