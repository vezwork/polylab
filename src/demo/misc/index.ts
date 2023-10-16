import {
  EpiInvertible,
  EpiInvertibleMultiRel,
  EpiMultiRel,
  mapIMR,
  mapMR,
} from "../../lib/structure/labelledEdgeGraph.js";

type R = ">" | "+" | "<" | "-";
type IT = "A" | "B";
type I = EpiInvertibleMultiRel<IT, R>;
type OT = ["a" | "b", string];
type O = EpiInvertibleMultiRel<OT, null>;

type MapFrom = (o: OT) => IT;
type MapTo = (
  o: OT
) => (r: [EpiInvertible<R>, IT]) => [EpiInvertible<null>, OT];

const rInv = (r: R) =>
  ({ ">": "<" as R, "<": ">" as R, "+": "-" as R, "-": "+" as R }[r]);
const invR = (r: R): EpiInvertible<R> => ({
  v: r,
  inv: rInv,
});

const m: I = {
  to: (i) =>
    ({
      A: [[invR(">"), "B"]] as [EpiInvertible<R>, IT][],
      B: [[invR("+"), "A"]] as [EpiInvertible<R>, IT][],
    }[i]),
  from: (i) =>
    ({
      B: [[invR(rInv(">")), "A"]] as [EpiInvertible<R>, IT][],
      A: [[invR(rInv("+")), "B"]] as [EpiInvertible<R>, IT][],
    }[i]),
};
const from: MapFrom = ([o, _]) => ({ a: "A" as IT, b: "B" as IT }[o]);
const invNull: EpiInvertible<null> = {
  v: null,
  inv: () => null,
};
const to: MapTo =
  ([_, rs]) =>
  ([{ v }, t]) =>
    [invNull, [t === "A" ? "a" : "b", rs + v]];

const example: O = mapIMR(from, to)(m);

const nextot = (o: OT): OT => [...example.to(o)][0][1];
const fromot = (o: OT): OT => [...example.from(o)][0][1];

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
