import { _, _headTail, alpha, any, call, char, flatStrings, i_, ichar, ior, istar, istr, iw, map, namedOr, num, plus, star, until, unwrap, } from "../../lib/parse/bidirectional2.js";
import { test } from "./testrunner2.js";
const firstCharOfJsId = ior(alpha, char("$"), char("_"));
const jsId = _headTail(firstCharOfJsId, unwrap(istar(ior(firstCharOfJsId, num))));
const customStr = _(ichar(`'`), flatStrings(until(char(`'`))(any)), ichar(`'`));
const customNum = map({
    forward: ([fst, rest]) => [fst, ...rest].join(""),
    backward: (str) => [str[0], str.slice(1).split("")],
})(plus(num));
const idMap = new Map();
const customVarOrLiteral = map({
    forward: (res) => {
        if (res.name === "id") {
            if (idMap.has(res.out))
                return idMap.get(res.out);
            else {
                const node = { ...res };
                idMap.set(res.out, node);
                return node;
            }
        }
        else
            return res;
    },
    backward: (_) => _,
})(namedOr({
    id: jsId,
    num: customNum,
    //str: customStr,
    fn: call(() => customFnCall),
}));
const customFnCall = map({
    forward: (ar) => {
        const res = { fnId: ar[1], args: [...ar[0]], parent: ar.parent }; // flatten array to obj
        for (const thing of ar[0]) {
            // change parent of things in array to reflect flattening
            thing.parent = res;
        }
        return res;
    },
    backward: ({ fnId, args, parent }) => [args, fnId],
})(_(ichar("("), iw, star(i_(customVarOrLiteral, ichar(","), iw)), ichar(")"), jsId));
const customConst = _(istr("const"), iw, customFnCall, iw, istr("=<"), iw, customVarOrLiteral);
const customLine = star(i_(namedOr({
    customFnCall,
    customConst,
}), ichar("\n")));
/*******
 * TESTS
 *******/
test(customConst, "customConst")("const (a, 2, )plus =< 10");
// const idTable = new Map();
// class Node {
//   outs: any = [];
//   ins: any = [];
//   constructor(public id: string, val: (from: Node) => any) {}
//   into(b: Node) {
//     const i = this.outs.length;
//     const o = b.ins.length;
//     this.outs[i] = [b, o];
//     b.ins[o] = [this, i];
//   }
// }
// const setupNum = (num) => {
//   return new Node(num, () => Number(num));
// };
// const setupId = (id): Node => {
//   if (idTable.has(id)) return idTable.get(id);
//   else {
//     const node = new Node(id, (from) => node.ins);
//     idTable.set(id, node);
//     return node;
//   }
// };
// const setupFn = ([args, id]): Node => {
//   const fnNode = new Node(id);
//   for (const node of args.map(setupVarOrLiteral)) {
//     node.into(fnNode);
//   }
//   return fnNode;
// };
// const setupVarOrLiteral = ({ out, name }): Node => {
//   if (name === "fn") return setupFn(out);
//   if (name === "id") return setupId(out);
//   if (name === "num") return setupNum(out);
// };
// const setupConst = ([fnCall, lit]) => {
//   return [setupFn(fnCall), setupVarOrLiteral(lit)];
// };
// console.log(
//   result.map(({ name, out }) => {
//     if (name === "customFnCall") return setupFn(out);
//     if (name === "customConst") return setupConst(out);
//   })
// );
// const [[a, b], id] = fn;
// const {
//   out: { out },
// } = FnOrVL;
// console.log(a, b, id, out);
// const res = {
//   id,
//   in1: a,
//   in2: b,
// };
