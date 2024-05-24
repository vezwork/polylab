import { SetMap, EndoSetMapWithReverse } from "../../../lib/structure/data.js";
export const graph = new SetMap();
export const edgeOp = new Map();
export const edgeAnds = new Map();
export const to = (f) => (from) => (to = Symbol()) => {
    const forward = [f, from, to];
    graph.add(from, forward);
    return forward;
};
export const op = (e1, e2) => {
    edgeOp.set(e1, e2);
    edgeOp.set(e2, e1);
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
const andSorter = (andTrack) => (and1, and2) => andTrack.hasPathBetween(and1, and2) ? -1 : 1;
// same as init but without the pulls after the inner while loop
export const push = (...starts) => {
    const sorter = andSorter(andTracker(...starts));
    const visitedNodes = new Set(starts);
    const visitedEdges = new Set();
    const unvisitedAnds = new Set();
    let queue = starts.map((node) => [null, node]);
    do {
        while (queue.length > 0) {
            const [fromEdge, fromNode] = queue.shift();
            for (const forward of get(graph, fromNode)) {
                const [f, from, to] = forward;
                // don't revisit nodes
                if (visitedNodes.has(to))
                    continue;
                visitedEdges.add(forward);
                // don't propagate to other `and` edges when coming from an anded edge
                const backwardAnd = get(edgeAnds, edgeOp.get(forward));
                if (backwardAnd.includes(fromEdge))
                    continue;
                f(from, to);
                //console.log("f", from, to);
                // only propagate once all ands are visited, to ensure
                // products are fully valuated before propagation
                if (isAndVisited(forward, visitedEdges)) {
                    queue.push([forward, to]);
                    visitedNodes.add(to);
                    unvisitedAnds.delete(edgeAnds.get(forward));
                }
                else
                    unvisitedAnds.add(edgeAnds.get(forward));
            }
        }
        // visit unvisited and in a pretty good dependency order
        queue = [...unvisitedAnds]
            .sort(sorter)
            .map((and) => [and[0], and[0][2]])
            .filter(([_, node]) => !visitedNodes.has(node));
        for (const [fromEdge, fromNode] of queue)
            visitedNodes.add(fromNode);
        unvisitedAnds.clear();
    } while (queue.length > 0);
};
// does not worry about fully visiting ands
// figures out which ands come before which for given starts
// andTrack from a to b means b is before a
export const andTracker = (...starts) => {
    const visitedNodes = new Set(starts);
    const andTrack = new EndoSetMapWithReverse();
    // queue entry's [0] and [1] are often redundant because Edge[1] = entry[1], but Edge can be null.
    const queue = starts.map((node) => [null, node, null]);
    while (queue.length > 0) {
        const [fromEdge, fromNode, lastAnd] = queue.shift();
        for (const forward of get(graph, fromNode)) {
            const [edge, from, to] = forward;
            // don't propagate to other `and` edges when coming from an anded edge
            const backwardAnd = get(edgeAnds, edgeOp.get(forward));
            if (backwardAnd.includes(fromEdge))
                continue;
            // track and
            const forwardAnd = edgeAnds.get(forward);
            if (forwardAnd !== undefined && lastAnd !== null)
                andTrack.add(forwardAnd, lastAnd);
            // don't revisit nodes
            if (visitedNodes.has(to))
                continue;
            visitedNodes.add(to);
            queue.push([forward, to, forwardAnd ?? lastAnd]);
        }
    }
    return andTrack;
};
// OLD NOTE:
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
// edit: this has a major issue as can be seen when running index.ts. Order of propagation does not
// work when products depend on eachother.
