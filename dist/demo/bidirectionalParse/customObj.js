import { _, _headTail, alpha, any, call, cases, char, flatStrings, i_, ichar, ior, istar, istr, iw, map, num, star, tryUnwrap, until, unwrap, } from "../../lib/parse/bidirectional1.js";
import { isObject } from "../../lib/structure/Object.js";
import { test } from "./testrunner.js";
const firstCharOfJsId = ior(alpha, char("$"), char("_"));
const jsId = _headTail(firstCharOfJsId, unwrap(istar(ior(firstCharOfJsId, num))));
const OBJECT_START = "{";
const OBJECT_END = "}";
const KEY_END = ":";
const VALUE_END = ",";
const customObjEntry = _(iw, jsId, iw, istr(KEY_END), iw, tryUnwrap(flatStrings(until(char(VALUE_END))(cases([isObject, call(() => customObj)], [() => true, any])))), ichar(VALUE_END));
const customObj = map({
    forward: Object.fromEntries,
    backward: Object.entries,
})(i_(ichar(OBJECT_START), star(customObjEntry), iw, ichar(OBJECT_END)));
test(tryUnwrap(istar(any)), "customObject")("doggies");
test(customObj, "customObject")("{ abc: { dog : 3, cat : r{}e, },  beep :123,   }");
test(istar(cases([isObject, customObj], [(_) => true, any])), "customObject")(`const a = { abc: { dog : 3, cat : r{}e, },  beep :123,   };
let b = a.abc`);
