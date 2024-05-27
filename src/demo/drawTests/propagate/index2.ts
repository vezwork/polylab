// I am getting really stuck on the complexity of category6finite, I keep
// introducing order of event bugs.
// lets try to make a super simple propagation system
// using JSON serialization diffing.
// inspired by @dennizor's tldraw propagator editor

import { SetMap } from "../../../lib/structure/data.js";

type Datum = [any];

const datum = (value?: any): Datum => [value];
const getValue = ([value]: Datum) => value;
const setValue = (d: Datum, value?: any): Datum => ((d[0] = value), d);

type Edge = [Function, Datum];

const graph = new SetMap<Datum, Edge>();
const f =
  (func: Function) =>
  (from: Datum, to = datum()) => {
    graph.add(from, [func, to]);
    return to;
  };
const fs =
  (func: Function, to = datum()) =>
  (...froms: Datum[]) => {
    const args = datum(Array(froms.length).fill(undefined));

    for (let i = 0; i < froms.length; i++) {
      const from = froms[i];
      graph.add(from, [
        (fromValue, toValue) => toValue.with(i, fromValue),
        args,
      ]);
    }
    graph.add(args, [(as) => func(...as), to]);

    return to;
  };

const get = <A, B>(map: Map<A, Iterable<B>>, key: A): B[] => [
  ...(map.get(key) ?? []),
];
const deepEqual = (a: any, b: any): Boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const dontVisitTwice = new Set();

function push(queue: Datum[]) {
  const visited = new Map([...dontVisitTwice].map((dat) => [dat, false]));
  for (const dat of queue) if (visited.has(dat)) visited.set(dat, true);

  while (queue.length > 0) {
    const from = queue.shift()!;

    for (const [f, to] of get(graph, from)) {
      const fromValue = getValue(from);
      const toValue = getValue(to);

      if (
        Array.isArray(fromValue)
          ? fromValue.some((v) => v === undefined)
          : fromValue === undefined
      )
        continue;

      const newToValue = f(getValue(from), getValue(to));
      if (visited.get(to) !== true && !deepEqual(newToValue, toValue)) {
        if (visited.has(to)) visited.set(to, true);
        setValue(to, newToValue);
        queue.push(to);
      }
    }
  }
}

const a = datum(7);
const b = datum(13);
const c = fs((a, b) => a + b)(a, b);
fs((a, c) => c - a, b)(a, c);
fs((b, c) => c - b, a)(b, c);
dontVisitTwice.add(a);
dontVisitTwice.add(b);
dontVisitTwice.add(c); // still broken! Still a single source glitch!

// fs(console.log)(a);
// fs(console.log)(b);
fs(console.log)(a, b, c);

console.log("push a");
push([a]);
console.log("push b");
push([b]);

console.log("push c");
setValue(c, 55); // this causes an issue because of a single-source glitch
push([c]);
