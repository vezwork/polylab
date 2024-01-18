export const nonSplitEdges = (t, splits) => [...t.to.entries(), ...t.from.entries()].filter(([edge]) => !splits.has(edge));
export const splitOutEdges = (t, splits) => [...t.to.entries()].filter(([edge]) => splits.has(edge));
export function* metaSplitOutEdges(metaNode, splits) {
    for (const node of metaNode)
        yield* splitOutEdges(node, splits); // no, this needs to yield metaNodes, not nodes
}
export function quotientNode(start, splits) {
    const visited = new Set([start.symbol]);
    const quotient = new Set([start]);
    const toVisit = [start];
    while (toVisit.length > 0) {
        const cur = toVisit.pop();
        for (const [e, { get }] of nonSplitEdges(cur, splits)) {
            const next = get();
            if (!visited.has(next.symbol)) {
                visited.add(next.symbol);
                quotient.add(next);
                toVisit.push(next);
            }
        }
    }
    return quotient;
}
export function metas(start, splits) {
    const visited = new Set();
    const quotientNodeFromThing = new Map();
    const quotient = quotientNode(start, splits);
    for (const node of quotient) {
        quotientNodeFromThing.set(node, quotient);
        visited.add(node.symbol);
        for (const [e, { get }] of node.to.entries()) {
        }
        for (const [e, { get }] of node.from.entries()) {
        }
    }
}
//  const componentFromNode = new Map<Thing, Set<Thing>>();
//const components = new Set<Set<Thing>>();
//{ components: Set<Set<Thing>>; componentFromNode: Map<Thing, Set<Thing>> }
//  return { components, componentFromNode };
