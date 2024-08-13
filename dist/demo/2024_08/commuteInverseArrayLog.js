import { pnode, pvar } from "./lib/matchEGraph.js";
import { find } from "./lib/unionFind.js";
import { makeAPI } from "./lib/api.js";

const { addRule, nodeEq, define, op, v, eGraph, eq, build, evaluate, rules } =
  makeAPI();

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
      .forEach((itemEClass, i) =>
        eGraph.merge(itemEClass, op("at", i, eClass))
      ),
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

// printEClasses();
// console.log([...values].map(([k, v]) => k.id + " : " + v).join("\n"));

// console.log("CHECK", checkEq(node("r"), node("+", node("w"), node("l"))));
