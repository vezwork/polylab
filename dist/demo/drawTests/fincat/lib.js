import { SetMap } from "../../../lib/structure/data.js";
const cat = new SetMap();
const catop = new SetMap();
export const mo = (edge) => (from) => (to = Symbol()) => {
    cat.add(from, [edge, to]);
    catop.add(to, [edge, from]);
};
export const push = (start) => {
    const visitedNodes = new Set();
    const queue = [start];
    while (true) {
        const currentNode = queue.shift();
        visitedNodes.add(currentNode);
        for (const [edge, to] of cat.get(currentNode) ?? []) {
            if (visitedNodes.has(to))
                continue;
            edge(currentNode, to);
            // only propagate once all froms are visited, to ensure
            // products are fully valuated before propagation
            const froms = catop.get(to);
            const allFromsAreVisited = [...(froms ?? [])].every(([_, from]) => visitedNodes.has(from));
            if (allFromsAreVisited)
                queue.push(to);
        }
        if (queue.length === 0)
            break;
    }
};
// pull
