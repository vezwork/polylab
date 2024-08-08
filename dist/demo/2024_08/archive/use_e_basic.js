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

const rules = [
  {
    from: [node("a")],
    to: ({}, ec) => merge(ec, e("b")),
  },
  {
    from: [node("b")],
    to: ({}, ec) => merge(ec, e("a")),
  },
];

e("+", e("a"));
e("+", e("b"));

printEClasses();

runRules(rules);

printEClasses();

console.log(
  "CHECK",
  checkEq(node("a"), node("+", node("-", node("b"), node("c")), node(0)))
);
