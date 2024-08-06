import { map, first, skip, withIndex } from "../../lib/structure/Iterable.js";

let idCounter = 0;
const eClasses = new Set();
const eNodes = new Map();

const union = (eClass1, eClass2) => {
  if (eClass1 === eClass2) return eClass1;
  eClasses.delete(eClass2);
  eClass2.childENodes.forEach((en) => {
    en.eClass = eClass1;
  });
  for (const en of eClass2.parents) {
    en.childEClasses = en.childEClasses.map((ec) =>
      ec === eClass2 ? eClass1 : ec
    );
    const hash = en.value + en.childEClasses.map((c) => ":" + c.id).join("");
    if (eNodes.has(hash)) eClass2.parents.delete(en);
  }
  eClass1.childENodes = eClass1.childENodes.union(eClass2.childENodes);
  eClass1.parents = eClass1.parents.union(eClass2.parents);
  return eClass1;
};

const makeEClass = (...childENodes) => {
  const id = idCounter++;
  const newEClass = {
    isEClass: true,
    childENodes: new Set(childENodes),
    parents: new Set(),
    id,
  };
  //newEClass.toString = () => id;
  newEClass.toString = () =>
    id +
    " : {" +
    [...newEClass.childENodes].map((n) => n.toString()).join(",") +
    "}";
  eClasses.add(newEClass);
  return newEClass;
};
// TODO: eClass gets ignores if eNodes has has, BUT it should merge eClasses!
const makeENode = (value, childEClasses = []) => {
  const hash = value + childEClasses.map((c) => ":" + c.id).join("");
  if (eNodes.has(hash)) return eNodes.get(hash);
  const eClass = makeEClass();
  const newENode = {
    isENode: true,
    value,
    eClass,
    childEClasses,
    hash,
  };
  newENode.toString = () =>
    value +
    (newENode.childEClasses.length
      ? "(" + newENode.childEClasses.map((c) => ":" + c.id).join(",") + ")"
      : "");
  eNodes.set(hash, newENode);
  eClass.childENodes.add(newENode);
  for (const child of childEClasses) child.parents.add(newENode);
  return newENode;
};
const e = (value, ...childEClasses) => makeENode(value, childEClasses).eClass;

const eClassMatches = (patternNode, eClass) => {
  if (eClass === undefined) return [];
  return [...eClass.childENodes].flatMap((en) => eNodeMatches(patternNode, en));
};
const eNodeMatches = (patternNode, eNode) => {
  if (patternNode.var === undefined && eNode.value !== patternNode.value)
    return [];
  else if (
    patternNode.var === undefined &&
    patternNode.children.length !== eNode.childEClasses.length
  )
    return [];
  else {
    const childrenMatches = patternNode.children.map((p, i) =>
      eClassMatches(p, eNode.childEClasses[i])
    );
    return [
      ...objectCombos(
        childrenMatches,
        patternNode.var ? { [patternNode.var]: eNode.eClass } : {}
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

// TODO: make matches with the same var require the same value

const node = (value, ...children) => ({
  value,
  children,
});
const vari = (v, ...children) => ({
  var: v,
  children,
});

union(e("b"), e("+", e("a"), e("c")));

console.log("eNodes\n", [...eNodes.values()].join("\n"));
console.log("eClasses\n", [...eClasses].join("\n"));

const rules = [
  {
    from: [node("+", vari("a"), vari("b")), vari("c")],
    to: ({ a, b, c }) => union(a, e("-", c, b)),
  },
  {
    from: [node("+", vari("a"), vari("b"))],
    to: ({ a, b }, eClass) => union(eClass, e("+", b, a)),
  },
  {
    from: [node("+", node("+", vari("a"), vari("b")), vari("c"))],
    to: ({ a, b, c }, eClass) => union(eClass, e("+", a, e("+", b, c))),
  },
  {
    from: [node("-", vari("a"), vari("b")), vari("c")],
    to: ({ a, b, c }) => union(a, e("+", c, b)),
  },
  {
    from: [vari("a")],
    to: ({ a }) => union(a, e("+", a, e(0))),
  },
];

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

const runRules = () =>
  rules.forEach(({ from, to }) =>
    [...eClasses]
      .map((c) => ({
        c,
        matches: from.map((pattern) => eClassMatches(pattern, c)),
      }))
      .map(({ c, matches }) => ({ c, matchCombos: oneFromEach(matches) }))
      .map(({ c, matchCombos }) => [
        ...map(map(matchCombos, objFromObjs), (o) => to(o, c)),
      ])
  );

const checkEq = (...patterns) =>
  [...eClasses]
    .map((c) => patterns.map((pattern) => eClassMatches(pattern, c)))
    .some((matches) => matches.every((match) => match.length > 0));

runRules();
runRules();
runRules();
runRules();
runRules();
runRules();
runRules();
runRules();
runRules();
// its saturated!!! (how should I detect that?)

console.log("eNodes\n", [...eNodes.values()].join("\n"));
console.log("eClasses\n", [...eClasses].join("\n"));

console.log(
  "CHECK",
  checkEq(node("a"), node("+", node("-", node("b"), node("c")), node(0)))
);
