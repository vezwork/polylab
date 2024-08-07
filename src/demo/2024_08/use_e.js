import {
  node,
  vari,
  merge,
  printEClasses,
  runRules,
  e,
  checkEq,
  unhash,
} from "./e_graph2.js";
import { setFromId, find } from "./union_find.js";

// const rules = [
//   {
//     from: [node("a")],
//     to: ({}, ec) => merge(ec, e("b")),
//   },
//   {
//     from: [node("b")],
//     to: ({}, ec) => merge(ec, e("a")),
//   },
// ];

// e("+", e("a"));
// e("+", e("b"));

// printEClasses();

// runRules(rules);

// printEClasses();

// console.log(
//   "CHECK",
//   checkEq(node("a"), node("+", node("-", node("b"), node("c")), node(0)))
// );

const rules = [
  {
    from: [node("+", vari("a"), vari("b")), vari("c")],
    to: ({ a, b, c }) => merge(a, e("-", c, b)),
  },
  {
    from: [node("-", vari("a"), vari("b")), vari("c")],
    to: ({ a, b, c }) => merge(a, e("+", c, b)),
  },
  {
    from: [node("+", vari("a"), vari("b"))],
    to: ({ a, b }, eClass) => merge(eClass, e("+", b, a)),
  },
  {
    from: [node("*", vari("a"), vari("b")), vari("c")],
    to: ({ a, b, c }) => merge(a, e("/", c, b)),
  },
  {
    from: [node("/", vari("a"), vari("b")), vari("c")],
    to: ({ a, b, c }) => merge(a, e("*", c, b)),
  },
  {
    from: [node("*", vari("a"), vari("b"))],
    to: ({ a, b }, eClass) => merge(eClass, e("*", b, a)),
  },

  // {
  //   from: [node("+", node("+", vari("a"), vari("b")), vari("c"))],
  //   to: ({ a, b, c }, eClass) => merge(eClass, e("+", a, e("+", b, c))),
  // },

  // {
  //   from: [vari("a")],
  //   to: ({ a }) => merge(a, e("+", a, e(0))),
  // },
];

e("l");
e("r");
merge(e("w"), e("-", e("r"), e("l")));
merge(e("c"), e("+", e("l"), e("/", e("w"), e(2))));

printEClasses();

runRules(rules);
runRules(rules);
runRules(rules);
runRules(rules);
runRules(rules);

printEClasses();

const values = new Map();
const setValue = (key, value) => values.set(find(e(key)), value);
setValue(2, 2);
setValue("w", 4);
setValue("r", 5);

const todo = [find(e("w")), find(e("r"))];

const evalC = (clas) => {
  const parentValues = [...clas.parents]
    .filter(([n, c]) => values.get(find(c)) === undefined)
    .map(([n, c]) => ({
      c,
      op: unhash(n).value,
      vs: unhash(n).children.map((c) => values.get(c)),
    }))
    .filter(({ vs }) => !vs.some((v) => v === undefined));
  if (parentValues.length > 0) {
    const { c, op, vs } = parentValues[0];
    values.set(
      find(c),
      {
        "-": vs[0] - vs[1],
        "+": vs[0] + vs[1],
        "*": vs[0] * vs[1],
        "/": vs[0] / vs[1],
      }[op]
    );
    console.log(op, vs, values.get(find(c)));
    todo.push(find(c));
  }
};

while (todo.length > 0) {
  const next = [...todo];
  todo.length = 0;
  for (const nex of next) {
    evalC(nex);
  }
}

console.log([...values].map(([k, v]) => k.id + " : " + v).join("\n"));

// console.log("CHECK", checkEq(node("r"), node("+", node("w"), node("l"))));
