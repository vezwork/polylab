import { SetMap } from "../../lib/structure/data.js";
const cat = new SetMap();
// want { data } -> [edge, { data }]
// we will use object equality for now
export const mo = (edge) => (...froms) => (to = Symbol()) => froms.forEach((from) => cat.add(from, [froms, edge, to]));
export const push = (start) => {
    const visitedNodes = new Set([start]);
    const queue = [start];
    function inner() {
        for (let i = 0; i < 40; i++) {
            const currentVertex = queue.shift();
            for (const [froms, edge, to] of cat.get(currentVertex) ?? []) {
                if (!visitedNodes.has(to)) {
                    edge(...froms, to);
                    visitedNodes.add(to);
                    queue.push(to);
                }
            }
            if (queue.length === 0)
                break;
        }
        if (queue.length !== 0)
            requestAnimationFrame(inner);
    }
    inner();
};
