import { SetMap } from "../../../lib/structure/data.js";
import { edge } from "./lib.js";
const cat = new SetMap();
const catop = new SetMap();
// want { data } -> [edge, { data }]
// we will use object equality for now
export const edgey = (f) => (from, to) => {
    edge(from, to);
    // on create: cat.add(from, [f, to]);
    // on create: catop.add(to, [f, from]);
};
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
    //while (queue.length !== 0) {}
};
