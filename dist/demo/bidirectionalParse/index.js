import { _, _headTail, alpha, any, call, cases, char, flatStrings, i_, ichar, ior, istar, istr, iw, map, num, star, tryUnwrap, until, unwrap, } from "../../lib/parse/bidirectional1.js";
import { isObject } from "../../lib/structure/Object.js";
const firstCharOfJsId = ior(alpha, char("$"), char("_"));
const jsId = _headTail(firstCharOfJsId, unwrap(istar(ior(firstCharOfJsId, num))));
const customObjEntry = _(iw, jsId, iw, istr("::"), iw, tryUnwrap(flatStrings(until(char("."))(cases([isObject, call(() => customObj)], [(_) => true, any])))), ichar("."));
const customObj = map({
    forward: Object.fromEntries,
    backward: Object.entries,
})(i_(ichar(">"), star(customObjEntry), iw, ichar("<")));
const test = (p, inp) => {
    console.group("bidirectional parse test");
    try {
        console.log(inp, "\n----->");
        const result = p.forward(inp).result;
        console.log(result);
        console.log("----->\n");
        console.log(p.backward(result).str);
    }
    finally {
        console.groupEnd();
    }
};
console.log("%cNEW TEST RUNS", "font-size:25px");
test(tryUnwrap(istar(any)), "doggies");
test(istar(cases([isObject, customObj], [(_) => true, any])), "yo my dog is a > good :: boy and > dog::.<. <.");
test(customObj, "> abc:: > dog :: 3. cat :: r><e. < .  beep ::123.    <");
