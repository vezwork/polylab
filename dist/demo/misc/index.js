import { mapIMR, } from "../../lib/structure/labelledEdgeGraph.js";
const rInv = (r) => ({ ">": "<", "<": ">", "+": "-", "-": "+" }[r]);
const invR = (r) => ({
    v: r,
    inv: rInv,
});
const m = {
    to: (i) => ({
        A: [[invR(">"), "B"]],
        B: [[invR("+"), "A"]],
    }[i]),
    from: (i) => ({
        B: [[invR(rInv(">")), "A"]],
        A: [[invR(rInv("+")), "B"]],
    }[i]),
};
const from = ([o, _]) => ({ a: "A", b: "B" }[o]);
const invNull = {
    v: null,
    inv: () => null,
};
const to = ([_, rs]) => ([{ v }, t]) => [invNull, [t === "A" ? "a" : "b", rs + v]];
const example = mapIMR(from, to)(m);
const nextot = (o) => [...example.to(o)][0][1];
const fromot = (o) => [...example.from(o)][0][1];
console.log(nextot(fromot(nextot(nextot(["a", ""])))));
// const m2: O = ([l, _]) => [
//   { a: [null, ["a", ""]] as [null, OT], b: [null, ["b", ""]] as [null, OT] }[l],
// ];
// const from2 = (l: IT): OT => ({ A: ["a", ""] as OT, B: ["b", ""] as OT }[l]);
// const to2 =
//   (il: IT) =>
//   ([_, [ol, rs]]: [null, OT]): [R, IT] =>
//     [rs.at(-1) as R, ol === "a" ? "A" : "B"];
// const exampleInv = mapMR(from2, to2)(example);
// const nextinv = (o: IT) => [...exampleInv(o)][0][1];
// console.log(12309, nextinv(nextinv("A")));
