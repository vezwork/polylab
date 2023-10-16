import { _, __, _headTail, alpha, any, call, char, flatStrings, i_, ichar, ior, istar, istr, iw, map, namedOr, num, or, plus, star, until, unwrap, } from "../../lib/parse/bidirectional2.js";
import { test } from "./testrunner2.js";
const firstCharOfJsId = ior(alpha, char("$"), char("_"));
const jsId = _headTail(firstCharOfJsId, unwrap(istar(ior(firstCharOfJsId, num))));
const customStr = _(ichar(`'`), flatStrings(until(char(`'`))(any)), ichar(`'`));
const customVar = flatStrings(until(or(char(" "), char("("), char(")")))(any));
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
    id: customVar,
    num: customNum,
    //str: customStr,
    fn: call(() => customFnCall),
}));
const customFnCall = map({
    forward: (ar) => {
        const res = { args: [...ar[0]], parent: ar.parent }; // flatten array to obj
        for (const thing of ar[0]) {
            // change parent of things in array to reflect flattening
            thing.parent = res;
        }
        return res;
    },
    backward: ({ args, parent }) => [args],
})(_(ichar("("), iw, star(__(customVarOrLiteral, iw)), ichar(")")));
const customConst = _(istr("const"), iw, customFnCall, iw, istr("="), iw, customFnCall);
const customLine = star(i_(namedOr({
    customFnCall,
    customConst,
}), ichar("\n")));
/*******
 * TESTS
 *******/
test(customConst, "customConst")(`const (a + 2) = (10)`);
