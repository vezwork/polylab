/**
 * Returns all possible ways of merging objects from each array in childrenMatches.
 * e.g.
 * ```
 * objectCombos([[{a:1}, {b:2}], [{c:3}]]) === [{a:1, c:3}, {b:2, c:3}]
 * ```
 *
 * @param {Object[][]} childrenMatches
 * @param {Object} match
 * @returns Object[]
 */
export const allWaysToMergeOneFromEach = (arrays) =>
  [...allWaysToPickOneFromEach(arrays)].map(objFromObjs);

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
  objs.reduce((prev, cur) => ({ ...prev, ...cur }));
