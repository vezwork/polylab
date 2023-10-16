import {
  _,
  __,
  _headTail,
  alpha,
  any,
  call,
  cases,
  char,
  flatStrings,
  i_,
  i__,
  ichar,
  ior,
  istar,
  istr,
  iw,
  map,
  namedOr,
  not,
  num,
  or,
  plus,
  star,
  str,
  tryUnwrap,
  until,
  unwrap,
  w,
} from "../../lib/parse/bidirectional2.js";
import { isObject } from "../../lib/structure/Object.js";
import { makeTreeFunctions } from "../../lib/structure/tree.js";
import { test } from "./testrunner2.js";

const singlesPlus = (p) =>
  map({
    forward: ([fst, rest]) => [fst, ...rest].join(""),
    backward: (str) => [str[0], str.slice(1).split("")],
  })(plus(p));

const id = singlesPlus(
  i_(
    not(char(" ")),
    not(char("(")),
    not(char(")")),
    not(char(",")),
    not(char("=")),
    any
  )
);
// const firstCharOfJsId = ior(alpha, char("$"), char("_"));
// const jsId = _headTail(
//   firstCharOfJsId,
//   unwrap(istar(ior(firstCharOfJsId, num)))
// );

const customStr = _(ichar(`'`), flatStrings(until(char(`'`))(any)), ichar(`'`));

const customNum = singlesPlus(num);

const idMap = new Map();

const customVarOrLiteral = map({
  forward: (res) => {
    if (res.name === "id") {
      if (idMap.has(res.out)) return idMap.get(res.out);
      else {
        const node = { ...res };
        idMap.set(res.out, node);
        return node;
      }
    } else return res;
  },
  backward: (_) => _,
})(
  namedOr({
    str: customStr,
    num: customNum,
    fn: call(() => customFnCall),
    id,
  })
);
const customFnCall = map({
  forward: (ar) => {
    delete ar[1].parent;
    const res = { fnId: ar[0], args: ar[1], parent: ar.parent }; // flatten array to obj
    let i = 0;
    for (const thing of ar[1]) {
      // change parent of things in array to reflect flattening
      thing.parent = { key: ["args", i], node: res };
      i++;
    }
    return res;
  },
  backward: ({ fnId, args, parent }) => [fnId, args],
})(
  _(
    id,
    ichar("("),
    iw,
    star(i__(customVarOrLiteral, ichar(","), iw)),
    ichar(")")
  )
);
const customConst = _(
  istr("const"),
  iw,
  customVarOrLiteral,
  iw,
  istr("="),
  iw,
  customVarOrLiteral
);

const customLine = star(i_(customConst, ichar("\n")));

/*******
 * TESTS
 *******/

const applyPath = (obj) => (path) => {
  let cur = obj;
  for (const pathPart of path) cur = cur[pathPart];
  return cur;
};

const ARG0 = ["args", 0];
const ARG1 = ["args", 1];
const PARENT = ["parent", "node"];

export const run = (str, backward = false) => {
  if (backward)
    str = str
      .split("const")
      .filter((s) => s !== "")
      .map((s) => "const" + s)
      .reverse()
      .join(" \n");

  idMap.clear();
  const assignedIdsMap = new Map();

  const solveMap = new Map();
  const solvingSet = new Set();

  const getLink = (n1, n2) => {
    return solveMap.get(n1)?.get(n2) ?? solveMap.get(n2)?.get(n1);
  };
  const setLink = (n1, n2) => (v) => {
    if (solveMap.get(n1)?.has(n2)) solveMap.get(n1).set(n2, v);
    else if (solveMap.get(n2)?.has(n1)) solveMap.get(n2).set(n1, v);
    else {
      if (!solveMap.has(n1)) solveMap.set(n1, new Map());
      solveMap.get(n1).set(n2, v);
    }
  };
  const fill =
    (node) =>
    (filledPaths, ...unfilledPathsAndFns) => {
      const values = filledPaths.map((path) =>
        getLink(node, applyPath(node)(path))
      );
      if (values.every((v) => v !== undefined)) {
        unfilledPathsAndFns.map(([path, fn]) =>
          setLink(node, applyPath(node)(path))(fn(...values))
        );
      }
    };

  let toParse = str;
  while (toParse.length > 0) {
    const res = customConst.forward(null, toParse);
    if (toParse === res.str) break;
    toParse = res.str.trim();

    for (const [name, node] of idMap) {
      solve(node);
      assignedIdsMap.set(name, getLink(node, node.parent.node));
      solvingSet.clear();
    }

    idMap.clear();
    solveMap.clear();
  }

  // store values on links between nodes (unordered pairs of nodes)

  function solve(node) {
    if (solvingSet.has(node)) return;
    solvingSet.add(node);

    if (node.name === "id") {
      if (
        assignedIdsMap.has(node.out) &&
        assignedIdsMap.get(node.out) !== undefined
      ) {
        setLink(node, node.parent.node)(assignedIdsMap.get(node.out));
      } else {
        solve(node.parent.node);
      }
    }

    if (node.name === "fn") {
      solve(node.out);
      solve(node.parent.node);

      fill(node)([["out"]], [PARENT, (a) => a]);
      fill(node)([PARENT], [["out"], (a) => a]);
    }

    if (node.name === "num")
      setLink(node, node.parent.node)(parseFloat(node.out));
    if (node.name === "str") setLink(node, node.parent.node)(node.out);

    if (Array.isArray(node)) {
      solve(node[0]);
      solve(node[1]);
      fill(node)([[0]], [[1], (a) => a]);
      fill(node)([[1]], [[0], (a) => a]);
    }

    if ("fnId" in node) {
      const args = node.args;
      args.map(solve);
      solve(node.parent.node);

      // hack for plus
      if (node.fnId === "+") {
        fill(node)([ARG0, ARG1], [PARENT, (a, b) => a + b]);
        fill(node)([ARG0, PARENT], [ARG1, (a, b) => b - a]);
        fill(node)([ARG1, PARENT], [ARG0, (a, b) => b - a]);
      }
      if (node.fnId === "*") {
        fill(node)([ARG0, ARG1], [PARENT, (a, b) => a * b]);
        fill(node)([ARG0, PARENT], [ARG1, (a, b) => b / a]);
        fill(node)([ARG1, PARENT], [ARG0, (a, b) => b / a]);
      }
      if (node.fnId === "**") {
        fill(node)([ARG0, ARG1], [PARENT, (a, b) => a ** b]);
        fill(node)([ARG0, PARENT], [ARG1, (a, b) => Math.log(b) / Math.log(a)]);
        fill(node)([ARG1, PARENT], [ARG0, (a, b) => b ** (1 / a)]);
      }
      if (node.fnId === "array") {
        if (getLink(node, node.parent.node)) {
          let i = 0;
          for (const arg of args) {
            if (!getLink(node, arg))
              setLink(node, arg)(getLink(node, node.parent.node)[i]);
            i++;
          }
        } else
          setLink(
            node,
            node.parent.node
          )(args.map((arg) => getLink(node, arg)));
      }
      if (node.fnId === "log") {
        solve(node.args[0]);
        solve(node.parent.node);

        if (getLink(node, node.args[0])) {
          setLink(node, node.parent.node)(getLink(node, node.args[0]));
        }
        if (getLink(node, node.parent.node)) {
          setLink(node, node.args[0])(getLink(node, node.parent.node));
        }
      }
    }
  }

  return assignedIdsMap;
};

//assignedIdsMap.set("b", 5);
// test(
//   customConst,
//   "customConst"
// )(`const array(+( *(10,a), 50),b) = array(100, 2)`);
// console.log(run(`const array(+( *(10,a), 50),b) = array(100, 2)`));
