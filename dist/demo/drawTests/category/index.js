import { mo, push } from "./lib.js";
const d1 = { num: 1 };
const d2 = { num: 13 };
const d3 = { num: 1, hello: "world" };
const d4 = { num: 1, hello: "nerd" };
// determined by vs influenced by
// - determinded by: init by and influenced by and no outside setting
mo(({ num }, o) => (o.num = num + 3))(d1)(d2);
mo(({ num }, o) => (o.num = num - 3))(d2)(d1);
mo((a, b, o) => (o.num = a.num + b.num))(
// this is a categorical product, but under a "depends on" interpretation of morphisms
d1, d2)(d3);
mo(({ num }, o) => (o.num = num * 3))(d3)(d4);
mo((...all) => console.log("yo!", ...all))(d1, d2, d3, d4)(undefined);
push(d2);
console.log("test 1", d1, d2, d3, d4);
d3.num = 7;
push(d3);
console.log("test 2", d1, d2, d3, d4);
d1.num = 7;
d1.num = 4;
// pull(d4);
console.log("test 3", d1, d2, d3, d4);
// unrelated note I just want to get down: CtxTransform <=> BottomRight in context of dims in localspace
//    can also be formulated in terms of the (derivative?) difference between box and next box
