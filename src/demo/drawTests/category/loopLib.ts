import { take } from "../../../lib/structure/Iterable.js";
import { SetMap } from "../../../lib/structure/data.js";

const cat = new SetMap<Object, [Object[], Function, Object]>();
const catop = new SetMap<Object, [Object[], Function, Object]>();
const op = new Map<
  [Object[], Function, Object],
  [Object[], Function, Object]
>();

// deloop a looped graph
// with a base piece of info
//

export const loopMo =
  (forwardEdge: Function, backwardEdge: Function) =>
  (...froms) =>
  (to: any = Symbol()) => {
    for (const from of froms) {
      const a = [froms, forwardEdge, to] as [Object[], Function, Object];
      const b = [froms, backwardEdge, from] as [Object[], Function, Object];
      cat.add(from, a);
      catop.add(to, b);
      op.set(a, b);
      op.set(b, a);
    }
  };

export const loopWalkForward = function* (inVertex, init) {
  const queue = [
    [init, [[], () => {}, inVertex]] as [any, [Object[], Function, Object]],
  ];

  while (queue.length !== 0) {
    const next = queue.shift()!;
    const [result, currentEdge] = next;

    const [_, __, currentVertex] = currentEdge;
    for (const forward of cat.get(currentVertex) ?? []) {
      if (op.get(forward) !== currentEdge) {
        const nextResult = forward[1](result);
        yield nextResult;
        queue.push([nextResult, forward]);
      }
    }
  }
};
export const loopWalk = function* (inVertex, init) {
  const queue = [
    [init, [[], () => {}, inVertex]] as [any, [Object[], Function, Object]],
  ];

  while (queue.length !== 0) {
    const next = queue.shift()!;
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

loopMo(
  (p) => p + "f01",
  (p) => p + "b01"
)(0)(1);
loopMo(
  (p) => p + "f10",
  (p) => p + "b10"
)(1)(0);
console.log("hewllo", ...take(10, loopWalk(0, "")));
