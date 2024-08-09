import { items } from "./unionFind.js";

const eClassMatches = (patternNode, eClass) =>
  [...items(eClass)].flatMap(eNodeMatches(patternNode));

const eNodeMatches = (patternNode) => (eNode) => {
  if (patternNode.var) return successeNodeMatch(patternNode, eNode);
  else if (patternNode.value) {
    if (
      eNode.value !== patternNode.value ||
      patternNode.children.length !== eNode.children.length
    )
      return [];
    else return successeNodeMatch(patternNode, eNode);
  }
};
const successeNodeMatch = (patternNode, eNode) => {
  const childrenMatches = patternNode.children.map((p, i) =>
    eClassMatches(p, eNode.children[i])
  );
  return [
    ...objectCombos(
      childrenMatches,
      patternNode.var ? { [patternNode.var]: eNode } : {}
    ),
  ];
};

const objectCombos = function* (childrenMatches, match) {
  if (childrenMatches.length === 0) {
    yield { ...match };
    return;
  }
  for (const matches1 of childrenMatches[0]) {
    for (const matches2 of objectCombos(childrenMatches.slice(1))) {
      yield { ...match, ...matches1, ...matches2 };
    }
  }
};

// // TODO: make matches with the same var require the same value

export const pnode = (value, ...children) => ({
  value,
  children,
});
export const pvar = (v, ...children) => ({
  var: v,
  children,
});

const oneFromEach = function* (arrays) {
  if (arrays.length === 0) {
    yield [];
    return;
  }
  for (const item of arrays[0]) {
    for (const array of oneFromEach(arrays.slice(1))) {
      yield [item, ...array];
    }
  }
};
const objFromObjs = (objs) => objs.reduce((prev, cur) => ({ ...prev, ...cur }));

// TODO: this can lookup the root of the pattern, it doesn't have to iterate over all sets.

const matchRule =
  ({ from, to }) =>
  (eClass) => {
    const matches = from.map((pattern) => eClassMatches(pattern, eClass));
    return {
      c: eClass,
      to,
      matchCombos: [...oneFromEach(matches)],
    };
  };
const matchRuleOnAll = (sets) => (rule) => [...sets].map(matchRule(rule));
const enactRuleOnMatches = (matches) =>
  matches.map(({ c, to, matchCombos }) =>
    matchCombos.map(objFromObjs).map((o) => to(o, c))
  );
export const runRules = (sets, rules) =>
  rules.map(matchRuleOnAll(sets)).map(enactRuleOnMatches);

// TODO: this can lookup the root of the pattern, it doesn't have to iterate over all sets.

export const checkEq = (sets, ...patterns) =>
  [...sets]
    .map((c) => patterns.map((pattern) => eClassMatches(pattern, c)))
    .some((matches) => matches.every((match) => match.length > 0));
