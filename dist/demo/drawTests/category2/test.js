import { applyPath, create, edge, inv, } from "./lib.js";
const splits = new Map();
const splitEdge = (...froms) => (to) => {
    // add all edges
    const edges = froms.map((from) => edge(from, to));
    // mark each edge as split
    edges.forEach((edge) => splits.set(edge, edges));
    return edges;
};
// - now need spec-reachability check
// - and need to modify propagate to not execute split edges until
//   1. all the edges in the split are visited
//   2. all unvisited edges in the split are spec-unreachable
const L = Symbol("L");
const R = Symbol("R");
const O = Symbol("O");
const SS = Symbol("SS");
const OL = Symbol("OL");
const [el, er] = splitEdge(L, R)(SS);
const [eo1, eo2] = splitEdge(L, O)(OL);
const elo = edge(L, O, () => [eo1, inv(eo2)]);
edge(OL, R, () => [inv(eo1), el, inv(er)]);
const s = create(SS);
const l = applyPath(s, [inv(el)]);
const o = applyPath(l, [elo]);
const r = applyPath(s, [inv(er)]);
const walk = walkIt(o);
console.log("test", [...walk]); // success!
export const splitSources = (s) => [...s.from.entries()]
    .filter(([e]) => splits.has(e))
    .map(([e, { get }]) => get());
function* walkIt(start) {
    const visitedSymbols = new Set([start.symbol]);
    const visitedThings = new Set();
    const toVisit = [start];
    while (toVisit.length > 0) {
        const cur = toVisit.shift();
        visitedThings.add(cur);
        yield cur;
        for (const [e, { get }] of cur.to.entries()) {
            const to = get();
            const split = splits.get(e);
            if (split) {
                const areSplitSourcesVisited = splitSources(to).every((t) => visitedThings.has(t));
                if (areSplitSourcesVisited && !visitedSymbols.has(to.symbol)) {
                    visitedSymbols.add(to.symbol);
                    toVisit.push(to);
                }
            }
            else {
                if (!visitedSymbols.has(to.symbol)) {
                    visitedSymbols.add(to.symbol);
                    toVisit.push(to);
                }
            }
        }
        for (const [e, { get }] of cur.from.entries()) {
            const from = get();
            // ignore from splits
            if (!splits.has(e)) {
                if (!visitedSymbols.has(from.symbol)) {
                    visitedSymbols.add(from.symbol);
                    toVisit.push(from);
                }
            }
        }
    }
}
