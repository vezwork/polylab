import { take } from "../../../lib/structure/Iterable.js";
import { SetMap } from "../../../lib/structure/data.js";
const cat = new SetMap();
const catop = new SetMap();
const op = new Map();
// deloop a looped graph
// with a base piece of info
//
export const loopMo = (forwardEdge, backwardEdge) => (...froms) => (to = Symbol()) => {
    for (const from of froms) {
        const a = [froms, forwardEdge, to];
        const b = [froms, backwardEdge, from];
        cat.add(from, a);
        catop.add(to, b);
        op.set(a, b);
        op.set(b, a);
    }
};
export const loopWalkForward = function* (inVertex, init) {
    const queue = [
        [init, [[], () => { }, inVertex]],
    ];
    while (queue.length !== 0) {
        const next = queue.shift();
        const [result, currentEdge] = next;
        const [_, __, currentVertex] = currentEdge;
        for (const forward of cat.get(currentVertex) ?? []) {
            if (op.get(forward) !== currentEdge) {
                const nextResult = forward[1](result);
                yield nextResult;
                queue.push([nextResult, forward]);
            }
        }
        // same as `loopWalk` but without the backward loop here
    }
};
export const loopWalk = function* (inVertex, init) {
    const queue = [
        [init, [[], () => { }, inVertex]],
    ];
    while (queue.length !== 0) {
        const next = queue.shift();
        const [result, currentEdge] = next;
        const [_, __, currentVertex] = currentEdge;
        for (const forward of cat.get(currentVertex) ?? []) {
            if (op.get(forward) !== currentEdge) {
                const nextResult = forward[1](result);
                yield nextResult;
                queue.push([nextResult, forward]);
            }
        }
        for (const backward of catop.get(currentVertex) ?? []) {
            if (op.get(backward) !== currentEdge) {
                const nextResult = backward[1](result);
                yield nextResult;
                queue.push([nextResult, backward]);
            }
        }
    }
};
loopMo((p) => p + "f01", (p) => p + "b01")(0)(1);
loopMo((p) => p + "f10", (p) => p + "b10")(1)(0);
console.log("hewllo", ...take(10, loopWalk(0, "")));
