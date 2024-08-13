import { pnode, pvar } from "./lib/matchEGraph.js";
import { find as myFind } from "./lib/unionFind.js";
import { makeAPI } from "./lib/api.js";

/**
 * Lisp Parser
 *
 * This JavaScript defines some unfancy parser combinators for Lisp values and Lisp arrays
 * and composes them to define a Lisp parser. The Lisp values can be any sequence of characters
 * as long as they aren't parens, space, or newline.
 *
 * I (Elliot) wrote this on Aug 8th for the Recurse Center's pairing interview programming task.
 * Here's some types that hopefully help make the code easier to read and follow.
 *
 * A lisp parse tree represented as nested string arrays.
 * @typedef {LispAST[]} LispASTList
 * @typedef {string | LispASTList} LispAST
 *
 * A function that tries to parse part of the given string `str`. If it succeeds
 * in parsing some of the string then `parse` will not be the empty string and
 * the `str` in the result object should be the input string with the parsed part removed.
 * @typedef {(str: string) => { parse: any, str: string }} ParserCombinator
 */

/**
 * Parses Lisp values. Lisp values can be any sequence of characters
 * as long as they aren't parens, spaces, or newlines.
 *
 * @type {ParserCombinator}
 * @param {string} str parse this string if it starts with a "value" string
 * @returns {{ parse: string, str: string }}
 */
const pValue = (str) => {
  let parse = "";
  for (const char of str) {
    if (char === " " || char === "\n" || char === "(" || char === ")") break;
    parse += char;
  }
  return { parse, str: str.slice(parse.length) };
};

/**
 * @type {ParserCombinator}
 * @param {string} str parse this string if it starts with a valid value
 * @returns {{ parse: LispAST[], str: string }}
 */
const pList = (initStr) => {
  const op = pValue(initStr);
  initStr = op.str;
  if (initStr.at(0) !== "(") return { parse: "", str: initStr };
  let str = initStr.slice(1);

  if (op.parse === "JS") {
    let balance = 1;
    let newStr = "";
    while (true) {
      if (str[0] === "(") balance++;
      if (str[0] === ")") {
        balance--;
      }
      newStr += str[0];
      str = str.slice(1);
      if (balance === 0)
        return { parse: { op: op.parse, js: newStr.slice(0, -1) }, str };
    }
  }

  const parse = { op: op.parse, args: [] };
  while (true) {
    // pLisp is defined below in terms of pList, to make this recursive definition work we wrap the call to pListOrVal in an arrow function.
    const res = ((str) => pLisp(str))(str.trim());
    if (res.parse === "") {
      str = str.trim();
      if (str.at(0) !== ")") return { parse: "", str: initStr };
      return { parse, str: str.slice(1) };
    }
    str = res.str;
    parse.args.push(res.parse);
  }
};

/**
 * @type {ParserCombinator}
 * @param {ParserCombinator} p1 this parser gets ran on the string, if it doesn't parse anything, then ignore the result and use `p2`.
 * @param {ParserCombinator} p2
 * @returns
 */
const pOr = (p1) => (p2) => (str) => {
  const res = p1(str);
  if (res.parse !== "") return res;
  return p2(str);
};

/**
 * The Lisp parser!
 *
 * @type {(str: string) => { parse: LispAST, str: string }}
 */
const pLisp = pOr(pList)(pValue);

const hackyParse = (myStr) => {
  const res = [];
  while (true) {
    const p = pLisp(myStr.trim());
    if (myStr === p.str) {
      console.error("PARSE FAIL @", p);
      break; // parse fail
    }
    myStr = p.str;
    res.push(p.parse);
    if (myStr.length === 0) break;
  }

  while (true) {
    const i = res.findIndex((v) => v === "=");
    if (i === -1) break;
    const spliced = res.splice(i - 1, 3);
    res.splice(i - 1, 0, { op: "EQUAL", args: [spliced[0], spliced[2]] });
  }

  while (true) {
    const i = res.findIndex((v) => v === "define");
    if (i === -1) break;
    const spliced = res.splice(i, 4);
    res.splice(i, 0, { op: "DEFINE", args: [spliced[1], spliced[3]] });
  }

  while (true) {
    const i = res.findIndex((v) => v === "rule");
    if (i === -1) break;
    const spliced = res.splice(i, 4);
    const op = spliced[2] === "==>" ? "RULE" : "BIRULE";
    res.splice(i, 0, { op, args: [spliced[1], spliced[3]] });
  }
  return res;
};

const makeInterpreter = () => {
  const { addRule, nodeEq, define, op, v, eGraph, eq, build, evaluate, rules } =
    makeAPI();
  const find = myFind; // have to do this so `eval` has access to it
  const run = (n) => {
    build(n);
    evaluate();
  };

  const interp = (arg) => {
    // these top two take advantage of the fact that passing a non-eclass (string or num) to
    // the api evaluate function sets the value of the eclass
    if (!isNaN(Number(arg))) return Number(arg);
    if (typeof arg === "string" && arg.at(0) === `"` && arg.at(-1) === `"`)
      return arg.slice(1, -1);
    if (arg.op) return interpOp(arg);
    return v([arg]);
  };
  const interpDefine = ({ args: [opName, { js }] }) => define(opName, eval(js));
  const interpOp = (arg) => {
    if (arg.op === "DEFINE") return interpDefine(arg);
    if (arg.op === "JS") return eval(arg.js);
    if (arg.op === "EQUAL") return eq(...arg.args.map(interp));
    if (arg.op === "RULE") return interpRule(arg);
    if (arg.op === "BIRULE") return interpBirule(arg);
    return op(arg.op, ...arg.args.map(interp));
  };

  const interpInRule = (arg) => {
    if (arg.op) return interpOpInRule(arg);
    return pvar(arg);
  };
  const interpOpInRule = (arg) => {
    if (arg.op === "EQUAL") return nodeEq(...arg.args.map(interpInRule));
    return pnode(arg.op, ...arg.args.map(interpInRule));
  };
  const interpRule = ({ args: [from, to] }) =>
    addRule({ from: interpInRule(from), to: interpInRule(to) });
  const interpBirule = ({ args: [from, to] }) => {
    addRule({ from: interpInRule(from), to: interpInRule(to) });
    addRule({ from: interpInRule(to), to: interpInRule(from) });
  };
  return { interp, build, evaluate };
};

const interpretBuildEval = (code) => {
  const { interp, build, evaluate } = makeInterpreter();
  hackyParse(code).forEach(interp);
};

const BUILTINS_PREFIX = `
define + as JS((a,b)=>a+b)
define - as JS((a,b)=>a-b)
rule +(a b) ==> +(b a)
rule a = +(b c) <==> b = -(a c)

define * as JS((a,b)=>a*b)
define / as JS((a,b)=>a/b)
rule *(a b) ==> *(b a)
rule a = *(b c) <==> b = /(a c)

define log as JS(console.log)

define Array as JS((...args)=>args)
define at as JS((i, arr) => arr.at(i))
JS(
    rules.push({
        from: [pvar("arr").withValue("Array")],
        to: (lookup, eClass) =>
            lookup.arr.children
            .map(find)
            .forEach((itemEClass, i) =>
                eGraph.merge(itemEClass, op("at", i, eClass))
        ),
    });  
)`;
for (const script of document.querySelectorAll('script[type="text/el0"]')) {
  if (script.src)
    fetch(script.src)
      .then((v) => v.text())
      .then((code) => interpretBuildEval(BUILTINS_PREFIX + code));
  else interpretBuildEval(BUILTINS_PREFIX + script.textContent);
}
