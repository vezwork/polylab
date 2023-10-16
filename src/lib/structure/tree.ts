/**
 * motivation: Dec 20 2022: editor.ts currently implements a lot of
 * tree functionality that could be abstracted away for more expressiveness when adding new things
 * and to make editor.ts easier to read. Also, it would be nice to decouple the data
 * (editors) from how it is processed (tree functions). The method for decoupling
 * these is to input a `parent` and `children` function to output the tree functions
 * so that no matter what data structure is used, you can use these tree functions.
 * The challenge with this is that data structure and processing are implicitly coupled
 * by performance. I won't worry about that for now, expressiveness is #1 for now!
 *
 */

import * as Fn from "./Functions.js";
import * as Iter from "./Iterable.js";

export type TreeFunctions<T> = ReturnType<typeof makeTreeFunctions<T>>;

export function makeTreeFunctions<T>({
  parent,
  children,
}: {
  parent: (t: T) => T | null;
  children: (t: T) => Iterable<T>;
}) {
  const descendentsDepthFirst = function* (t: T): Generator<T> {
    yield* Iter.flatMap(children(t), descendentsDepthFirst);
    yield t;
  };
  const descendentsBreadthFirst = function* (t: T): Generator<T> {
    yield t;
    yield* Iter.flatMap(children(t), descendentsBreadthFirst);
  };
  const siblings = (t: T): Iterable<T> | null => {
    const par = parent(t);
    if (par === null) return null;
    return Iter.filter(children(par), Fn.neq(t));
  };

  const ancestors = (t: T) => Iter.recurseUntil(parent, t, Fn.eq(null));
  const nodeAndAncestors = (t: T) => Iter.concat([t], ancestors(t));
  const root = (t: T) => Iter.last(nodeAndAncestors(t));

  // This works assuming these trees have deterministic order children Iterables, but wouldn't work for trees with children Sets.
  // There needs to be some structure to the collection of children to help represent the path.
  const rootIndexPath = (t: T) =>
    Iter.map(
      Iter.skip(1, Iter.historyArray(nodeAndAncestors(t), 2)),
      ([cur, prev]) => Iter.indexOf(children(cur), Fn.eq(prev))
    );
  /**
   * i.e. `applyRootIndexPath(root)(rootIndexPath(t2)) === t2`
   */
  const applyRootIndexPath = (root: T) => (path: Iterable<number | null>) =>
    Iter.reduce(
      [...path].reverse(),
      (t, i) => (t && i !== null ? Iter.at<T>(i)(children(t)) : undefined),
      root as T | undefined
    );

  const hasParent = (t: T) => parent(t) !== null;
  const hasChildren = (t: T) => !Iter.isEmpty(children(t));
  const isRoot = (t: T) => !hasParent(t);
  const isLeaf = (t: T) => !hasChildren(t);

  // order: _G_, _GEQ_, _EQ_, _LEQ_, _L_
  // extra: _NEQ_, _NO_
  type PARTIAL_ORDER = ">" | "=" | "<" | "!";

  const compareAncestry = (t1: T, t2: T): PARTIAL_ORDER => {
    if (t1 === t2) return "=";
    if (Iter.some(ancestors(t2), Fn.eq(t1))) return ">";
    if (Iter.some(ancestors(t1), Fn.eq(t2))) return "<";
    return "!";
  };

  const lowestCommonAncestor = (
    t1: T,
    t2: T
  ): { common: T; path1: T[]; path2: T[] } | null => {
    for (const [a1, path1] of Iter.withHistory(nodeAndAncestors(t1)))
      for (const [a2, path2] of Iter.withHistory(nodeAndAncestors(t2)))
        if (a1 === a2) return { common: a1, path1, path2 };
    return null;
  };

  const compareOrder = (t1: T, t2: T): PARTIAL_ORDER => {
    if (t1 === t2) return "=";
    const { common, path1, path2 } = lowestCommonAncestor(t1, t2) ?? {};
    if (!common) return "!";
    for (const child of children(common)) {
      if (child === path1?.at(-1)) return ">"; // t1 rep comes first
      if (child === path2?.at(-1)) return "<"; // t2 rep comes first
    }
    console.error("tree.ts: compareOrder: bad code path");
    return "!"; // should be impossible code path
  };

  const superParent =
    (filter: (t: T) => boolean) =>
    (t: T): T | null =>
      Iter.find(ancestors(t), filter);
  const superChildrenHelper = (filter: (t: T) => boolean) =>
    function* (t: T): Generator<T> {
      if (filter(t)) {
        yield t;
      } else {
        yield* Iter.flatMap(children(t), superChildrenHelper(filter));
      }
    };
  const superChildren = (filter: (t: T) => boolean) =>
    function* (t: T): Generator<T> {
      yield* Iter.flatMap(children(t), superChildrenHelper(filter));
    };

  const filteredTree = (filter: (t: T) => boolean) =>
    makeTreeFunctions<T>({
      parent: superParent(filter),
      children: superChildren(filter),
    });

  return {
    parent,
    children,
    descendentsDepthFirst,
    descendentsBreadthFirst,
    siblings,
    ancestors,
    nodeAndAncestors,
    rootIndexPath,
    applyRootIndexPath,
    root,
    hasParent,
    hasChildren,
    isRoot,
    isLeaf,
    compareAncestry,
    lowestCommonAncestor,
    compareOrder,
    superParent,
    superChildren,
    filteredTree,
  };

  // future work: helpers... NO, JUST USE ITERABLE HELPERS
  //const every = 0;
  //const some = 0;
  //const find = 0;

  // future work?: mutations
  //const map = 0;
  //const filter = 0;
  //const insert = 0;
  //const remove = 0;
}
