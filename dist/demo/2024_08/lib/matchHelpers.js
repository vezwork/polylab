import { hash } from "./hashcons.js";

/**
 * Returns all possible ways of merging objects from each array in childrenMatches.
 * e.g.
 * ```
 * allWaysToMergeOneFromEach([[{a:1}, {b:2}], [{c:3}]]) === [{a:1, c:3}, {b:2, c:3}]
 * ```
 *
 * @param {Object[][]} childrenMatches
 * @param {Object} match
 * @returns Object[]
 */
export const allWaysToMergeOneFromEach = (arrays) =>
  [...allWaysToPickOneFromEach(arrays)].map(objFromObjs);
/**
 * Returns all possible ways of merging objects from each array in childrenMatches
 * such that no variables are reassigned different values.
 * e.g.
 * ```
 * allWaysToMergeOneFromEachNoConflicts([[{a:3}],[{a:2},{a:3,c:4}]]) === [{a: 3, c: 4}]
 * ```
 */
export const allWaysToMergeOneFromEachNoConflicts = (arrays) =>
  [...allWaysToPickOneFromEach(arrays)]
    .map(objFromObjsNoConflicts)
    .filter((a) => a);

export const allWaysToPickOneFromEach = function* (arrays) {
  if (arrays.length === 0) {
    yield [];
    return;
  }
  for (const item of arrays[0]) {
    for (const array of allWaysToPickOneFromEach(arrays.slice(1))) {
      yield [item, ...array];
    }
  }
};
export const objFromObjs = (objs) =>
  objs.reduce((prev, cur) => ({ ...prev, ...cur }), {});
export const objFromObjsNoConflicts = (objs) =>
  objs.reduce(
    (acc, ob) =>
      acc === false || haveDifferentValuesAtSameKey(acc, ob)
        ? false
        : { ...acc, ...ob },
    {}
  );

const overlappingKeys = (ob1, ob2) =>
  new Set([
    ...Object.keys(ob1).filter((k) => ob2[k] !== undefined),
    ...Object.keys(ob2).filter((k) => ob1[k] !== undefined),
  ]);
/**
 * e.g. `haveDifferentValuesAtSameKey({a:1}, {a:2}) === true`
 */
const haveDifferentValuesAtSameKey = (ob1, ob2) => {
  for (const k of overlappingKeys(ob1, ob2))
    if (hash(ob1[k]) !== hash(ob2[k])) return true;
  return false;
};
