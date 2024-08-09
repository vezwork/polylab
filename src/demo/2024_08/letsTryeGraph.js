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
  setFromId,
  sets,
  hashcons,
  rebuild,
} = makeeGraph();

const processToRule = (v, lookup) =>
  v.var
    ? find(hashcons.get(lookup[v.var]))
    : addENode(v.value, ...v.children.map((c) => processToRule(c, lookup)));

const makeRule = ({ from, to }) => {
  const fromfrom = Array.isArray(from) ? from : [from];
  const toto = to.equations
    ? (lookup) =>
        to.equations.forEach((equation) =>
          equation.forEach((otherEquation) =>
            merge(
              processToRule(equation[0], lookup),
              processToRule(otherEquation, lookup)
            )
          )
        )
    : Array.isArray(to)
    ? (lookup) =>
        to.forEach((otherTo) =>
          merge(processToRule(to[0], lookup), processToRule(otherTo, lookup))
        )
    : (lookup, eClass) => merge(eClass, processToRule(to, lookup));
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
  //printEClasses();
  runRules(sets, rules);
  rebuild();
  runRules(sets, rules);
  rebuild();
  runRules(sets, rules);
  rebuild();
  runRules(sets, rules);
  rebuild();
  runRules(sets, rules);
  rebuild();
  runRules(sets, rules);
  rebuild();
  runRules(sets, rules);
  rebuild();

  const newValues = new Map();
  for (const [k, v] of values) {
    newValues.set(find(k), v);
  }
  values = newValues;
  //printEClasses();
};

const evalC = (clas) => {
  const parentValues = [...find(clas).parents]
    .filter(([n, c]) => values.get(find(c)) === undefined)
    .map(([n, c]) => ({
      c,
      op: n.value,
      vs: n.children.map((c) => values.get(c)),
    }))
    .filter(({ vs }) => !vs.some((v) => v === undefined));
  if (parentValues.length > 0) {
    const { c, op, vs } = parentValues[0];
    values.set(find(c), definitions[op](...vs));
    console.log(find(c).id, op, vs, values.get(find(c)));
    todo.push(find(c));
  }
};

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
// define(":", (el, list) => [el, ...list]);
// define("(-:)", ([a, ...rest]) => a);
define("at", (index, array) => array[index]);
addRule({
  from: nodeEq(pvar("arr"), pnode("[]", pvar("arr[0]"), pvar("arr[1]"))),
  to: nodeAnd(
    nodeEq(pvar("arr[0]"), pnode("at", pnode(0), pvar("arr"))),
    nodeEq(pvar("arr[1]"), pnode("at", pnode(1), pvar("arr")))
  ), // todo: deal with arbitrary number of args
});

eq(v`width`, op("-", v`right`, v`left`));
eq(v`center`, op("+", v`left`, op("/", v`width`, 2)));
eq(v`width`, 4);
eq(v`left`, 10);
eq(v`other`, op("[]", v`center`, v`width`));
eq(op("[]", v`other2`, v`o3`), v`other`);

build();
evaluate();

console.log("left = ", valueOf(v`left`));
console.log("width = ", valueOf(v`width`));
console.log("center = ", valueOf(v`center`));
console.log("right = ", valueOf(v`right`));
console.log("other2 = ", valueOf(v`other2`));
console.log("o3 = ", valueOf(v`o3`));

// printEClasses();
// console.log([...values].map(([k, v]) => k.id + " : " + v).join("\n"));

// console.log("CHECK", checkEq(node("r"), node("+", node("w"), node("l"))));
