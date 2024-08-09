import { makeHashcons, hash } from "./hashcons.js";
import { makeUnionFind, items, parents, find } from "./unionFind.js";

// I built this while heavily referencing the following paper:
//
// Max Willsey, Chandrakana Nandi, Yisu Remy Wang, Oliver Flatt, Zachary Tatlock, and Pavel Panchekha.
// 2021. egg: Fast and Extensible Equality Saturation.
// Proc. ACM Program. Lang. 5, POPL, Article 23 (January 2021), 29 pages.
// https://doi.org/10.1145/3434304

export const makeENode = (value, ...children) => ({
  value,
  children,
});

export const makeeGraph = () => {
  const {
    union,
    makeEClass,
    eClasses,
    eClassFromId,
    eClassFromENode,
    addNode,
    deleteNode,
  } = makeUnionFind();

  const worklist = [];

  const merge = (id1, id2) => {
    if (find(id1) === find(id2)) return find(id1);
    const newId = union(id1, id2);

    worklist.push(newId);

    return newId;
  };

  const canonicalize = (eNode) =>
    makeENode(eNode.value, ...eNode.children.map(find));

  const add = (eNode) => {
    eNode = canonicalize(eNode);
    if (eClassFromENode.has(eNode)) return eClassFromENode.get(eNode);

    return makeEClass(eNode);
  };

  const addENode = (value, ...children) => add(makeENode(value, ...children));

  const rebuild = () => {
    while (worklist.length > 0) {
      const todo = worklist.map(find);
      worklist.length = 0;
      for (const eClass of todo) repair(eClass);
    }
  };
  const repair = (eClass) => {
    for (let [peNode, peClass] of parents(eClass)) {
      deleteNode(peClass, peNode);
      addNode(peClass, canonicalize(peNode));
    }

    const newParents = makeHashcons([], eClassFromId);
    for (let [peNode, peClass] of parents(eClass)) {
      peNode = canonicalize(peNode); // is this redundant? its in the paper
      if (newParents.has(peNode)) merge(peClass, newParents.get(peNode));
      newParents.set(peNode, find(peClass));
    }
    find(eClass).parents = newParents;
  };

  const printEClassId = (eClass) => find(eClass).id + ":";
  const printEClass = (eClass) =>
    printEClassId(eClass) + "{" + [...items(eClass)].map(hash).join(", ") + "}";

  const printEClasses = () =>
    console.log([...eClasses].map(printEClass).join("\n"));

  return {
    merge,
    addENode,
    rebuild,

    printEClasses,

    eClassFromId,
    eClasses,
    eClassFromENode,
  };
};
