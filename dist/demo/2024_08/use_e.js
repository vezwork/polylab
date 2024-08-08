import {
  node,
  vari,
  merge,
  printEClasses,
  runRules,
  e,
  checkEq,
  unhash,
  eClassMatches,
} from "./e_graph.js";
import { setFromId, find } from "./union_find.js";

const processToRule = (v, lookup) =>
  v.var
    ? lookup[v.var]
    : e(v.value, ...v.children.map((c) => processToRule(c, lookup)));

const makeRule = ({ from, to }) => {
  const fromfrom = Array.isArray(from) ? from : [from];
  const toto = Array.isArray(to)
    ? (lookup) =>
        merge(processToRule(to[0], lookup), processToRule(to[1], lookup))
    : (lookup, eClass) => merge(eClass, processToRule(to, lookup));
  return {
    from: fromfrom,
    to: toto,
  };
};
const nodeEq = (...c) => c;
const addRule = (r) => rules.push(makeRule(r));

const rules = [];

const definitions = {};
const define = (key, f) => {
  definitions[key] = f;
};

const isCommutative = (op) =>
  addRule({
    from: node(op, vari("a"), vari("b")),
    to: node(op, vari("b"), vari("a")),
  });
const isInverse = (op1, op2) => {
  addRule({
    from: nodeEq(vari("a"), node(op1, vari("b"), vari("c"))),
    to: nodeEq(vari("b"), node(op2, vari("a"), vari("c"))),
  });
  addRule({
    from: nodeEq(vari("a"), node(op2, vari("b"), vari("c"))),
    to: nodeEq(vari("b"), node(op1, vari("a"), vari("c"))),
  });
};

const todo = [];
let values = new Map();
const setValue = (key, value) => values.set(find(e(key)), value);
const printValue = (key) =>
  console.log("printValue: " + key + " = " + values.get(find(e(key))));

const eq = (...args) =>
  merge(
    ...args.map((arg) => {
      if (typeof arg === "number") {
        setValue(arg, arg);
        todo.push(find(e(arg)));
      }
      return ["string", "number"].includes(typeof arg) ? e(arg) : arg;
    })
  );
const op = (value, ...children) =>
  e(
    value,
    ...children.map((arg) => {
      if (typeof arg === "number") {
        setValue(arg, arg);
        todo.push(find(e(arg)));
      }
      return ["string", "number"].includes(typeof arg) ? e(arg) : arg;
    })
  );

const build = () => {
  //printEClasses();
  runRules(rules);
  runRules(rules);
  runRules(rules);
  runRules(rules);
  runRules(rules);
  runRules(rules);
  runRules(rules);

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
      op: unhash(n).value,
      vs: unhash(n).children.map((c) => values.get(c)),
    }))
    .filter(({ vs }) => !vs.some((v) => v === undefined));
  if (parentValues.length > 0) {
    const { c, op, vs } = parentValues[0];
    values.set(find(c), definitions[op](...vs));
    //console.log(find(c).id, op, vs, values.get(find(c)));
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

eq("width", op("-", "right", "left"));
eq("center", op("+", "left", op("/", "width", 2)));
eq("width", 4);
eq("left", 10);

build();
evaluate();

printValue("left");
printValue("width");
printValue("center");
printValue("right");

// printEClasses();
// console.log([...values].map(([k, v]) => k.id + " : " + v).join("\n"));

// console.log("CHECK", checkEq(node("r"), node("+", node("w"), node("l"))));
