import { take } from "../../../lib/structure/Iterable.js";
import {
  Edge,
  REdge,
  applyPath,
  create,
  edge,
  edgeData,
  edgeMap,
  inv,
  invPath,
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
        // console.log(
        //   `${e.from.description}-s>${e.to.description}`,
        //   splitSaturation.every((v) => v)
        // );
        if (splitSaturation.every((v) => v)) {
          yield split;
          toVisit.push(to);
        }
      } else {
        yield e;
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
        yield split;
        toVisit.push(from);
      } else {
        yield inv(e);
        toVisit.push(from);
      }
    }
  }
}

// - now need spec-reachability check
// - and need to modify propagate to not execute split edges until
//   1. all the edges in the split are visited
//   2. all unvisited edges in the split are spec-unreachable

/*
const L = Symbol("L");
const R = Symbol("R");
const O = Symbol("O");
const T = Symbol("T");
const OL = Symbol("OL");

const [el, er] = splitEdge(L, R)(T);
const [eo1, eo2] = splitEdge(L, O)(OL);

const elo = edge(L, O, () => [eo1, inv(eo2)]);
edge(OL, R, () => [inv(eo1), el, inv(er)]);
//edge(R, O); // uh oh this reveals that I have a bug :(
// I think I need to treat backward edges differently so this doesn't happen
// I don't think I can just not use backward edges though?
// Maybe I have to avoid backward self edges?
// EDIT: FIXED WITH walkSpec2!!!!!

const s = create(T);

const l = applyPath(s, [inv(el)]);
const o = applyPath(l, [elo]);
const r = applyPath(s, [inv(er)]);

const walk = walkSpec2(o);
console.log("test2", [...take(50, walk)]); // success!
*/

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

const repeat = (arr, n) => Array(n).fill(arr).flat();

const A = Symbol("A");
const B = Symbol("B");
const C = Symbol("C");

const [el, er] = splitEdge(A, A)(B);
edge(A, A, () => [el, inv(er)]);
// manually make split
const ebc1 = edge(B, C);
const ebc2 = edge(B, C, () => [...repeat([inv(er), el], 4), ebc1]);
const ebcSplitSet = [ebc1, ebc2];
splits.set(ebc1, ebcSplitSet);
splits.set(ebc2, ebcSplitSet);

const b = create(B);

// const l = applyPath(s, [inv(el)]);
// const o = applyPath(l, [elo]);
// const r = applyPath(s, [inv(er)]);

const walk = walkSpec2(b);

const reachableEdges = [...walk].flat();
const splitOuts = [...applyPath(b, [ebc1]).from.entries()].map(([e]) =>
  (e.path() ? e.path().slice(0, -1) : [e]).map(edgeData)
);
const splitSourcesReachability = splitOuts.map((es) =>
  es.every((e) => reachableEdges.includes(e))
);

console.log("test2", reachableEdges, splitOuts, splitSourcesReachability); // success!

// need to propogate
// when we get to a split source we have to wait until all !reachable! split sources are visited
// before crossing the split

const reachableSplitSources = (cur: Thing, s: Edge[]) => {
  const walk = walkSpec2(cur);
  const reachableEdges = [...walk].flat();
  const splitOuts = [...applyPath(b, [ebc1]).from.entries()].map(([e]) =>
    (e.path() ? e.path().slice(0, -1) : [e]).map(edgeData)
  );
  const splitSourcesReachability = splitOuts.map((es) =>
    es.every((e) => reachableEdges.includes(e))
  );
  return splitSourcesReachability;
};

console.log("test2 duplicate", reachableSplitSources(b, splits.get(ebc1)!)); // success!

export function* walk2(start: Thing) {
  const workingSplits = new Map<Thing, Map<Edge, Map<Edge, boolean>>>();
  const visitedThings = new Set<Thing>();

  const toVisit: [Thing, REdge | null][] = [[start, null]];

  while (toVisit.length > 0) {
    const [cur, visitEdge] = toVisit.shift()!;

    if (visitedThings.has(cur)) continue;
    visitedThings.add(cur);

    yield visitEdge;

    for (const [e, { get }] of cur.to.entries()) {
      // don't travel back along the edge you came from
      if (
        visitEdge !== null &&
        "isReverse" in visitEdge &&
        visitEdge.data === e
      )
        continue;

      const to = get();

      const split = splits.get(e);

      if (split) {
        const wsp = workingSplits.get(to);
        const ws = wsp?.get(e);
        console.log("check ws", to, wsp, ws, e);
        if (ws !== undefined) {
          ws.set(e, true);
          const values = [...ws.values()];
          const allWorkingSplitSourcesVisited = values.every((v) => v);
          console.log("allWorkingSplitSourcesVisited", to, ...ws.values());
          if (allWorkingSplitSourcesVisited) {
            toVisit.push([to, e]);
            // clean up memory of working split
            for (const [rsse] of ws) workingSplits.get(to)?.delete(rsse);
            if (workingSplits.get(to)?.size === 0) workingSplits.delete(to);
          }
        } else {
          // create working split by calculating reachable split sources
          const rssFlags = reachableSplitSources(cur, splits.get(e)!);
          const rss: Edge[] = split.filter((v, i) => rssFlags[i]);

          console.log(
            "check working split",
            splits.get(e),
            reachableSplitSources(cur, splits.get(e)!)
          );

          if (rss.length === 0) {
            console.log("0");
            // no reachable split sources, walk to it immediately
            toVisit.push([to, e]);
          } else {
            console.log("1");
            const rssVisits = new Map(rss.map((v) => [v, false]));
            if (wsp === undefined) workingSplits.set(to, new Map());
            const myWsp = workingSplits.get(to)!;
            for (const rsse of rss) {
              myWsp.set(rsse, rssVisits);
            }
            console.log("workingSplit created", myWsp);
          }
        }
      } else {
        toVisit.push([to, e]);
      }
    }
    for (const [e, { get }] of cur.from.entries()) {
      // don't travel back along the edge you came from
      if (visitEdge === e) continue;

      const from = get();
      const split = splits.get(e);
      // ignore inverse split edges
      console.log("from");
      if (split) {
        toVisit.push([from, inv(e)]);
      } else {
        toVisit.push([from, inv(e)]);
      }
    }
  }
}

const prettyPrintEdge = (e: REdge | null) => {
  if (e === null) return "null";
  const data = edgeData(e);
  const split = splits.get(edgeData(e));
  if ("isReverse" in e) {
    if (split) return `${data.from.description}<s-${data.to.description}`;
    else return `${data.from.description}<-${data.to.description}`;
  } else {
    if (split) return `${data.from.description}-s>${data.to.description}`;
    else return `${data.from.description}->${data.to.description}`;
  }
};

const b2 = create(B);

console.log("big test", [...take(33, walk2(b2))].map(prettyPrintEdge));
