import { map, first, skip, withIndex } from "../../lib/structure/Iterable.js";
import { hash, makeHashcons } from "./hashcons.js";
import {
  find,
  items,
  union,
  makeSet,
  sets,
  parents,
  setFromId,
} from "./union_find.js";

const worklist = [];

export const merge = (id1, id2) => {
  if (find(id1) === find(id2)) return find(id1);
  const newId = union(id1, id2);

  worklist.push(newId);

  return newId;
};

const canonicalize = (eNode) =>
  makeENode(eNode.value, ...eNode.children.map(find));
const hashcons = makeHashcons();
const makeENode = (value, ...children) => ({
  value,
  children,
});
const add = (eNode) => {
  eNode = canonicalize(eNode);
  if (hashcons.has(eNode)) return hashcons.get(eNode);

  const eClassId = makeSet(eNode);

  for (const child of eNode.children) parents(child).set(eNode, eClassId);

  hashcons.set(eNode, eClassId);
  return eClassId;
};

export const e = (value, ...children) => add(makeENode(value, ...children));

export const unhash = (str) => {
  const [value, ...classIds] = str.split(":");
  return makeENode(
    value,
    ...classIds.map(Number).map((id) => setFromId.get(id))
  );
};

const rebuild = () => {
  while (worklist.length > 0) {
    const todo = worklist.map(find);
    worklist.length = 0;
    for (const eClass of todo) repair(eClass);
  }
};
const repair = (eClass) => {
  for (let [peNode, peClass] of parents(eClass)) {
    peNode = unhash(peNode);
    hashcons.remove(peNode);
    find(peClass).items.delete(hash(peNode));
    peNode = canonicalize(peNode);
    find(peClass).items.add(hash(peNode));
    hashcons.set(peNode, find(peClass));
  }

  const newParents = makeHashcons();
  for (let [peNode, peClass] of parents(eClass)) {
    peNode = unhash(peNode);
    peNode = canonicalize(peNode);
    if (newParents.has(peNode)) merge(peClass, newParents.get(peNode));
    newParents.set(peNode, find(peClass));
  }
  find(eClass).parents = newParents;
};

const printENode = ({ value, children }) =>
  value +
  (children.length === 0 ? "" : "(" + children.map(printEClassId) + ")");
const printEClassId = (eClass) => find(eClass).id + ":";
const printEClass = (eClass) =>
  printEClassId(eClass) + "{" + [...items(eClass)].join(", ") + "}";

export const printEClasses = () =>
  console.log([...sets].map(printEClass).join("\n"));

const eClassMatches = (patternNode, eClass) => {
  if (eClass === undefined) return [];
  return [...items(eClass)]
    .map(unhash)
    .flatMap((en) => eNodeMatches(patternNode, en));
};
const eNodeMatches = (patternNode, eNode) => {
  if (patternNode.var === undefined && eNode.value !== patternNode.value)
    return [];
  else if (
    patternNode.var === undefined &&
    patternNode.children.length !== eNode.children.length
  )
    return [];
  else {
    const childrenMatches = patternNode.children.map((p, i) =>
      eClassMatches(p, eNode.children[i])
    );
    return [
      ...objectCombos(
        childrenMatches,
        patternNode.var ? { [patternNode.var]: find(hashcons.get(eNode)) } : {}
      ),
    ];
  }
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

export const node = (value, ...children) => ({
  value,
  children,
});
export const vari = (v, ...children) => ({
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

const readRule = ({ from, to }) =>
  [...sets]
    .map((c) => ({
      c,
      matches: from.map((pattern) => eClassMatches(pattern, c)),
    }))
    .map(({ c, matches }) => ({ c, to, matchCombos: oneFromEach(matches) }));
const enactRule = (r) =>
  r.map(({ c, to, matchCombos }) => [
    ...map(map(matchCombos, objFromObjs), (o) => to(o, c)),
  ]);
// const runRule = ({ from, to }) =>
//   [...sets]
//     .map((c) => ({
//       c,
//       matches: from.map((pattern) => eClassMatches(pattern, c)),
//     }))
//     .map(({ c, matches }) => ({ c, matchCombos: oneFromEach(matches) }))
//     .map(({ c, matchCombos }) => [
//       ...map(map(matchCombos, objFromObjs), (o) => to(o, c)),
//     ]);
export const runRules = (rules) => {
  rules.map(readRule).map(enactRule);
  rebuild();
};

export const checkEq = (...patterns) =>
  [...sets]
    .map((c) => patterns.map((pattern) => eClassMatches(pattern, c)))
    .some((matches) => matches.every((match) => match.length > 0));
