import { take } from "../../../lib/structure/Iterable.js";
import {
  Edge,
  applyPath,
  create,
  edge,
  edgeData,
  edgeMap,
  inv,
  reverseEdgeMap,
} from "./lib.js";

export const splits = new Map<Edge, Edge[]>();
export const splitEdge =
  (...froms) =>
  (to) => {
    // add all edges
    const edges = froms.map((from) => edge(from, to));
    // mark each edge as split
    edges.forEach((edge) => splits.set(edge, edges));

    return edges;
  };

type Thing = {
  symbol: symbol;
  to: Map<Edge, { get: () => Thing }>;
  from: Map<Edge, { get: () => Thing }>;
};

export const splitSources = (s: Thing) =>
  [...s.from.entries()]
    .filter(([e]) => splits.has(e))
    .map(([e, { get }]) => get());

//export function* walk(start: Thing) {}

export function* walkSpec(start: Thing) {
  const visitedSymbols = new Set<Symbol>([start.symbol]);
  const visitedThings = new Set<Thing>();

  const toVisit: Thing[] = [start];
  const toVisitOutside: Thing[] = [];

  while (toVisit.length > 0) {
    const cur = toVisit.shift()!;
    visitedThings.add(cur);

    yield cur;

    for (const [e, { get }] of cur.to.entries()) {
      const to = get();
      const split = splits.get(e);

      if (split) {
        const areSplitSourcesVisited = splitSources(to).every((t) =>
          visitedThings.has(t)
        );
        if (areSplitSourcesVisited) {
          if (visitedSymbols.has(to.symbol)) {
            if (!visitedThings.has(to)) toVisitOutside.push(to);
          } else toVisit.push(to);
          visitedSymbols.add(to.symbol);
        }
      } else {
        if (visitedSymbols.has(to.symbol)) {
          if (!visitedThings.has(to)) toVisitOutside.push(to);
        } else {
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
  return toVisitOutside;
}

export function* walkSpec2(start: Thing) {
  const edgeVisits = new Map();
  const nodeEdgeVisits = new Map();
  const visitedThings = new Set<Thing>([start]);

  const toVisit: Thing[] = [start];

  while (toVisit.length > 0) {
    const cur = toVisit.shift()!;
    visitedThings.add(cur);

    for (const [e, { get }] of cur.to.entries()) {
      // visit every abstract edge twice
      const newVisitCount = (edgeVisits.get(e) ?? 0) + 1;
      edgeVisits.set(e, newVisitCount);
      if (newVisitCount > 2) continue;

      const to = get();

      if (visitedThings.has(to)) continue; // no re-visits

      const split = splits.get(e);

      // keep track of all visited concrete edges
      const nodeEdgeVisitSet = nodeEdgeVisits.get(to) ?? new Set();
      nodeEdgeVisitSet.add(e);
      nodeEdgeVisits.set(to, nodeEdgeVisitSet);

      if (split) {
        const splitSaturation = split.map((se) =>
          nodeEdgeVisits.get(to)?.has(se)
        );
        console.log(
          `${e.from.description}-s>${e.to.description}`,
          splitSaturation.every((v) => v)
        );
        if (splitSaturation.every((v) => v)) {
          yield `${e.from.description}-s>${e.to.description}`;
          toVisit.push(to);
        }
      } else {
        yield `${e.from.description}->${e.to.description}`;
        console.log(`${e.from.description}->${e.to.description}`);
        toVisit.push(to);
      }
    }
    for (const [e, { get }] of cur.from.entries()) {
      // visit every edge twice
      const newVisitCount = (edgeVisits.get(e) ?? 0) + 1;
      edgeVisits.set(e, newVisitCount);
      if (newVisitCount > 1) continue;

      const from = get();
      const split = splits.get(e);
      // ignore inverse split edges
      if (split) {
        yield `${e.from.description}<s-${e.to.description}`;
        console.log(`${e.from.description}<s-${e.to.description}`);
        toVisit.push(from);
      } else {
        yield `${e.from.description}<-${e.to.description}`;
        console.log(`${e.from.description}<-${e.to.description}`);
        toVisit.push(from);
      }
    }
  }
}

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
edge(R, O); // uh oh this reveals that I have a bug :(
// I think I need to treat backward edges differently so this doesn't happen
// I don't think I can just not use backward edges though?
// Maybe I have to avoid backward self edges?
// EDIT: FIXED WITH walkSpec2!!!!!

const s = create(SS);

const l = applyPath(s, [inv(el)]);
const o = applyPath(l, [elo]);
const r = applyPath(s, [inv(er)]);

const walk = walkSpec2(o);
console.log("test2", [...take(50, walk)]); // success!

function spreadAndReturn<T>(iterable: Iterable<T>) {
  const iterator = iterable[Symbol.iterator]();
  let acc: T[] = [];
  while (true) {
    const { value, done } = iterator.next();
    if (done) {
      return { acc, value };
    } else acc.push(value);
  }
}
