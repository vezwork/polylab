import { SetMap } from "../../../lib/structure/data.js";

const cat = new SetMap<Object, [Object[], Function, Object]>();
const catop = new SetMap<Object, [Object[], Function, Object]>();
// want { data } -> [edge, { data }]
// we will use object equality for now

export const mo =
  (edge: Function) =>
  (...froms) =>
  (to: any = Symbol()) => {
    for (const from of froms) {
      cat.add(from, [froms, edge, to]);
      catop.add(to, [froms, edge, from]);
    }
  };

export const push = (start) => {
  const visitedNodes = new Set([start]);
  const queue = [start];

  function inner() {
    for (let i = 0; i < 1000; i++) {
      const currentVertex = queue.shift();

      for (const [froms, edge, to] of cat.get(currentVertex) ?? []) {
        if (!visitedNodes.has(to)) {
          edge(...froms, to);
          visitedNodes.add(to);
          queue.push(to);
        }
      }
      if (queue.length === 0) break;
    }
    if (queue.length !== 0) requestAnimationFrame(inner);
  }

  inner();

  //while (queue.length !== 0) {}
};
// contrasting thought: in hest values can go in loops

// export const pull = (end, pulled = new Set([end])) => {
//   for (const [froms, edge] of catop.get(end) ?? []) {
//     for (const from of froms) {
//       if (pulled.has(from)) break;
//       pulled.add(from);
//       pull(from, pulled);
//     }
//     if (end) edge(...froms, end);
//   }
// };
