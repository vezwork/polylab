import { SetMap } from "../../../lib/structure/data.js";
const cat = new SetMap();
const catop = new SetMap();
const op = new Map();
export const mo = (edge) => (from) => (to = Symbol()) => {
    const forward = [edge, to];
    const backward = [edge, from];
    op.set(forward, backward);
    op.set(backward, forward);
    cat.add(from, forward);
    catop.add(to, backward);
};
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
            for (const forward of cat.get(from) ?? []) {
                const [edge, to] = forward;
                if (visitedNodes.has(to))
                    continue;
                visitedEdges.add(forward);
                console.log("push edge", edge, from, to);
                edge(from, to);
                // only propagate once all froms are visited, to ensure
                // products are fully valuated before propagation
                const allForwardsToCurAreVisited = [...(catop.get(to) ?? [])].every((backward) => visitedEdges.has(op.get(backward)));
                if (allForwardsToCurAreVisited) {
                    queue.push(to);
                    visitedNodes.add(to);
                }
                else
                    unvisitedProducts.add(to);
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
            console.log("push visiting!", from);
            for (const forward of cat.get(from) ?? []) {
                const [edge, to] = forward;
                if (visitedNodes.has(to))
                    continue;
                visitedEdges.add(forward);
                console.log("push edge 1", edge, from, to);
                edge(from, to);
                console.log("push edge 2", edge, from, to);
                // only propagate once all froms are visited, to ensure
                // products are fully valuated before propagation
                const allForwardsToCurAreVisited = [...(catop.get(to) ?? [])].every((backward) => visitedEdges.has(op.get(backward)));
                if (allForwardsToCurAreVisited) {
                    queue.push(to);
                    visitedNodes.add(to);
                }
                else
                    unvisitedProducts.add(to);
            }
        }
        for (const a of unvisitedProducts)
            pull(a, visitedNodes, visitedEdges);
    }
};
export const pull = (to, visitedNodes = new Set(), visitedForwardEdges = new Set()) => {
    if (visitedNodes.has(to))
        return;
    visitedNodes.add(to);
    console.log("pull visiting!", to);
    for (const backward of catop.get(to) ?? []) {
        const forward = op.get(backward);
        if (visitedForwardEdges.has(forward))
            continue;
        visitedForwardEdges.add(forward);
        const [edge, from] = backward;
        // valuate `from`, then propagate to `to`
        pull(from, visitedNodes, visitedForwardEdges);
        console.log("pull edge 1", edge, from, to);
        edge(from, to);
        console.log("pull edge 2", edge, from, to);
    }
};
// note: need an "init" which is a combination of "push" and "pull"
// because we need the property that the entire system is in a consistent state
// before pushing / pulling e.g.
// a=[0], b=[1], c=[[],[]]; a->c[0], b->c[1]; push(a)
// will result in a=[0], b=[1], c=[[0],[]]
// which is not consistent.
// IMPORTANT NOTE: I just realized, after testing this lib out, that
// it is necessary to have splits in order to have bidirectional products.
