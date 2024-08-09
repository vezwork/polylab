import { items } from "./unionFind.js";
import { allWaysToMergeOneFromEach } from "./matchHelpers.js";

const eClassMatches = (patternNode, eClass) =>
  [...items(eClass)].flatMap(eNodeMatches(patternNode));

const eNodeMatches = (patternNode) => (eNode) => {
  if (patternNode.var) {
    if (patternNode.value && eNode.value !== patternNode.value) return [];
    return successeNodeMatch(patternNode, eNode);
  } else if (patternNode.value) {
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
  return allWaysToMergeOneFromEach([
    ...childrenMatches,
    [patternNode.var ? { [patternNode.var]: eNode } : {}],
  ]);
};
// // TODO: make matches with the same var require the same value

export const pnode = (value, ...children) => ({
  value,
  children,
});
export const pvar = (v, ...children) => ({
  var: v,
  children,
  withValue: (value) => ({ var: v, children, value }),
});

// TODO: this can lookup the root of the pattern, it doesn't have to iterate over all sets.

const matchRule =
  ({ from, to }) =>
  (eClass) => {
    const matches = from.map((pattern) => eClassMatches(pattern, eClass));
    return {
      c: eClass,
      to,
      matchCombos: allWaysToMergeOneFromEach(matches),
    };
  };
const matchRuleOnAll = (eClasses) => (rule) =>
  [...eClasses].map(matchRule(rule));
const enactRuleOnMatches = (matches) =>
  matches.map(({ c, to, matchCombos }) => matchCombos.map((o) => to(o, c)));
export const runRules = (eClasses, rules) =>
  rules.map(matchRuleOnAll(eClasses)).map(enactRuleOnMatches);

// TODO: this can lookup the root of the pattern, it doesn't have to iterate over all sets.

export const checkEq = (eClasses, ...patterns) =>
  [...eClasses]
    .map((c) => patterns.map((pattern) => eClassMatches(pattern, c)))
    .some((matches) => matches.every((match) => match.length > 0));
