import { makeeGraph, makeENode } from "./eGraph.js";
import { runRules, pnode, pvar } from "./matchEGraph.js";
import { find } from "./unionFind.js";

const {
  merge,
  printEClasses,
  addENode,
  checkEq,
  unhash,
  eClassMatches,
  eClassFromId,
  eClasses,
  eClassFromENode,
  rebuild,
} = makeeGraph();

const eNodesFromPatternLookup = (v, lookup) =>
  v.var
    ? find(eClassFromENode.get(lookup[v.var]))
    : addENode(
        v.value,
        ...v.children.map((c) => eNodesFromPatternLookup(c, lookup))
      );

const makeRule = ({ from, to }) => {
  const fromfrom = Array.isArray(from) ? from : [from];
  const toto = to.equations
    ? (lookup) =>
        to.equations.forEach((equation) =>
          equation.forEach((otherEquation) =>
            merge(
              eNodesFromPatternLookup(equation[0], lookup),
              eNodesFromPatternLookup(otherEquation, lookup)
            )
          )
        )
    : Array.isArray(to)
    ? (lookup) =>
        to.forEach((otherTo) =>
          merge(
            eNodesFromPatternLookup(to[0], lookup),
            eNodesFromPatternLookup(otherTo, lookup)
          )
        )
    : (lookup, eClass) => merge(eClass, eNodesFromPatternLookup(to, lookup));
  return {
    from: fromfrom,
    to: toto,
  };
};
const nodeAnd = (...equations) => ({ equations });
const nodeEq = (...c) => c;
const addRule = (r) => rules.push(makeRule(r));

const rules = [];

const definitions = {};
const define = (key, f) => {
  definitions[key] = f;
};

const isCommutative = (op) =>
  addRule({
    from: pnode(op, pvar("a"), pvar("b")),
    to: pnode(op, pvar("b"), pvar("a")),
  });
const isInverse = (op1, op2) => {
  addRule({
    from: nodeEq(pvar("a"), pnode(op1, pvar("b"), pvar("c"))),
    to: nodeEq(pvar("b"), pnode(op2, pvar("a"), pvar("c"))),
  });
  addRule({
    from: nodeEq(pvar("a"), pnode(op2, pvar("b"), pvar("c"))),
    to: nodeEq(pvar("b"), pnode(op1, pvar("a"), pvar("c"))),
  });
};

const todo = [];
let values = new Map();
const setValue = (key, value) => values.set(find(addENode(key)), value);
const valueOf = (eClass) => values.get(find(eClass));

const eq = (...args) =>
  merge(
    ...args.map((arg) => {
      if (!arg.isEClass) {
        setValue(arg, arg);
        todo.push(find(addENode(arg)));
        return addENode(arg);
      }
      return arg;
    })
  );
const op = (value, ...children) =>
  addENode(
    value,
    ...children.map((arg) => {
      if (!arg.isEClass) {
        setValue(arg, arg);
        todo.push(find(addENode(arg)));
        return addENode(arg);
      }
      return arg;
    })
  );
const v = ([name]) => addENode(name);

const build = () => {
  printEClasses();
  runRules(eClasses, rules);
  rebuild();
  runRules(eClasses, rules);
  rebuild();
  runRules(eClasses, rules);
  rebuild();
  runRules(eClasses, rules);
  rebuild();
  runRules(eClasses, rules);
  rebuild();
  runRules(eClasses, rules);
  rebuild();
  runRules(eClasses, rules);
  rebuild();

  const newValues = new Map();
  for (const [k, v] of values) {
    newValues.set(find(k), v);
  }
  values = newValues;
  printEClasses();
};

const evalC = (clas) =>
  [...find(clas).parents]
    .filter(([n, c]) => values.get(find(c)) === undefined)
    .map(([n, c]) => ({
      c,
      op: n.value,
      vs: n.children.map((c) => values.get(c)),
    }))
    .filter(({ vs }) => !vs.some((v) => v === undefined))
    .forEach(({ c, op, vs }) => {
      console.debug(find(c).id, op, vs, values.get(find(c)));
      values.set(find(c), definitions[op](...vs));
      todo.push(find(c));
    });

const evaluate = () => {
  while (todo.length > 0) {
    const next = [...todo];
    todo.length = 0;
    for (const nex of next) {
      evalC(nex);
    }
  }
};

define("+", (a, b) => a + b);
isCommutative("+");
define("-", (a, b) => a - b);
isInverse("+", "-");

define("*", (a, b) => a * b);
isCommutative("*");
define("/", (a, b) => a / b);
isInverse("*", "/");

define("[]", (...args) => args);
define("at", (index, array) => array[index]);
rules.push({
  from: [pvar("arr").withValue("[]")],
  to: (lookup, eClass) =>
    lookup.arr.children
      .map(find)
      .forEach((itemEClass, i) => merge(itemEClass, op("at", i, eClass))),
});

define("log", (...args) => (console.log(...args), true)); // return true so that value propagation doesn't call this more than once.

const logValue = (varName) => op("log", varName + " =", v([varName]));

logValue("left");
logValue("right");
logValue("arr1");
logValue("arr2");

eq(v`width`, op("-", v`right`, v`left`));
eq(v`center`, op("+", v`left`, op("/", v`width`, 2)));
eq(v`width`, 4);
eq(v`left`, 10);
eq(v`myArray`, op("[]", v`center`, v`width`));
eq(op("[]", v`arr0`, v`arr1`, v`arr2`), v`myArray`);
eq(v`arr2`, 13);
eq(v`arr2`, 99);

build();
evaluate();

console.log(valueOf(v`arr1log`));

// printEClasses();
// console.log([...values].map(([k, v]) => k.id + " : " + v).join("\n"));

// console.log("CHECK", checkEq(node("r"), node("+", node("w"), node("l"))));
