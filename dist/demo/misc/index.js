import { setupFullscreenCanvas } from "../../lib/draw/setupFullscreenCanvas.js";
import { apply, inv, scale, translation, zeroTranslate, _, } from "../../lib/math/CtxTransform.js";
import { add, v, x, y, length } from "../../lib/math/Vec2.js";
import * as Iter from "../../lib/structure/Iterable.js";
const b_i = (i) => ({
    base: Iter.first(i) ?? null,
    all: () => i,
});
export const mapOneWaySpec = (mapFrom, mapFromR, mapTo // TODO: what is the condition on mapFrom and mapTo?
) => (next) => (t2) => {
    const { base: unmappedBase, all: unmappedAll } = next(mapFrom(t2));
    const base = unmappedBase === null ? null : mapTo(t2)(unmappedBase);
    const all = (input) => Iter.map(unmappedAll(mapFromR(input)), mapTo(t2));
    return { base, all };
};
export const mapOKAY = (mapFrom, mapFromR, mapTo // TODO: what is the condition on mapFrom and mapTo?
) => ({ to, from }) => ({
    to: mapOneWaySpec(mapFrom, mapFromR, mapTo)(to),
    from: mapOneWaySpec(mapFrom, mapFromR, mapTo)(from),
});
const ZERO = [
    [0, 0],
    [0, 0],
];
const tWithInv = (t) => ({
    v: t,
    inv,
});
const baOkay = {
    to: (thing) => thing.to,
    from: (thing) => thing.from,
};
const newThing = () => ({
    ...{
        to: b_i([]),
        from: b_i([]),
        drawLocalSelf: () => null,
        localBounds: () => v(0),
    },
});
const objX = newThing();
const objBox = newThing();
const SIZE = 120;
Object.assign(objX, {
    name: "x",
    to: b_i([]),
    from: b_i([]),
    drawLocalSelf(ctx, t, childTransformedBounds) {
        ctx.beginPath();
        ctx.moveTo(...apply(t)(v(0, 0)));
        ctx.lineTo(...apply(t)(v(SIZE, SIZE)));
        ctx.moveTo(...apply(t)(v(SIZE, 0)));
        ctx.lineTo(...apply(t)(v(0, SIZE)));
        console.log("draw X", t, apply(t)(v(0, 0)), apply(t)(v(SIZE, SIZE)));
        ctx.stroke();
    },
    localBounds: (childTransformedBounds) => v(SIZE),
});
const PAD = 10;
const boxLocalBounds = (childTransformedBounds) => add(v(PAD), Iter.reduce(childTransformedBounds, ([bx, by], [x, y]) => [Math.max(bx, x), Math.max(by, y)], v(0)));
const BOX_INNER_T = _(scale(v(0.9)))(translation(v(PAD)));
console.log("BOX_INNER_T", BOX_INNER_T);
Object.assign(objBox, {
    name: "box",
    to: b_i([]),
    from: b_i([
        [tWithInv(BOX_INNER_T), objBox],
    ]),
    drawLocalSelf(ctx, t, childTransformedBounds) {
        const topLeft = apply(t)(v(0)); // good :)
        const bottomRight = boxLocalBounds(childTransformedBounds); // almost good but missing a single layer of CtxTransform
        // incorrect, this should be drawn around the children
        ctx.beginPath();
        ctx.moveTo(...topLeft);
        ctx.lineTo(...v(x(topLeft), y(bottomRight)));
        ctx.lineTo(...bottomRight);
        ctx.lineTo(...v(x(bottomRight), y(topLeft)));
        console.log("draw BOX", t, topLeft, bottomRight);
        ctx.closePath();
        ctx.stroke();
    },
    localBounds: boxLocalBounds,
});
const nextba = (i) => {
    if (i === null)
        return null;
    const { base, all } = baOkay.from(i);
    return base === null ? null : [...all(base)][0][1];
};
console.assert(nextba(objBox)?.name === "x", objBox, nextba(objBox));
const invNull = {
    v: null,
    inv: () => null,
};
const example = mapOKAY(({ t, ba }) => ba, ([_, { t, ba }]) => [tWithInv(t), ba], ({ t, ba }) => ([{ v: relT, inv }, ba]) => [invNull, { t: _(relT)(t), ba }])(baOkay);
const nextabs = (o) => {
    const { base, all } = example.from(o);
    return base === null ? [] : Iter.map(all(base), ([_, ab]) => ab);
};
// traverse down the BA, compute bounds of leaves, propogate bounds back up
const transformedBounds = (ab) => {
    const scaleFactor = length(apply(zeroTranslate(ab.t))([1, 1]));
    if (scaleFactor < 0.1)
        return {
            ab,
            bound: v(0),
            children: [],
        };
    const children = [...Iter.map(nextabs(ab), (ab) => transformedBounds(ab))];
    const bottomRight = ab.ba.localBounds(Iter.map(children, ({ bound }) => bound));
    console.log("transform", ab.ba.name, ab.t, "applied to", bottomRight, "gives you", apply(ab.t)(bottomRight));
    return {
        ab,
        bound: apply(ab.t)(bottomRight),
        children,
    };
};
const draw = (boundedAb, ctx) => {
    boundedAb.ab.ba.drawLocalSelf(ctx, boundedAb.ab.t, boundedAb.children.map(({ bound }) => bound));
    for (const child of boundedAb.children)
        draw(child, ctx);
};
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
console.log(transformedBounds({ t: translation(v(20)), ba: objBox }));
draw(transformedBounds({ t: translation(v(20)), ba: objBox }), ctx);
/****
 * EXAMPLE 0
 */
// type IT = "A" | "B";
// type I = Spec<IT, CtxTransform>;
// type OT = {
//   name: "a" | "b";
//   t: CtxTransform;
// };
// type O = Spec<OT, null>;
// type MapFrom = (o: OT) => IT;
// type MapTo = (
//   o: OT
// ) => (r: [EndoInvertible<CtxTransform>, IT]) => [EndoInvertible<null>, OT];
// type SpecOneWayData = { [key in IT]?: [EndoInvertible<CtxTransform>, IT][] };
// type SpecData = { to: SpecOneWayData; from: SpecOneWayData };
// const EMPTY_SPEC: SpecData = {
//   to: {},
//   from: {},
// };
// const addToRelData =
//   (prev: SpecOneWayData) => (from: IT, t: CtxTransform, to: IT) => {
//     const updated = { ...prev };
//     (updated[from] ??= []).push([tWithInv(t), to]);
//     return updated;
//   };
// const addTo =
//   (from: IT, t: CtxTransform, to: IT) =>
//   (spec: SpecData): SpecData => ({
//     to: addToRelData(spec.to)(to, inv(t), from),
//     from: addToRelData(spec.from)(from, t, to),
//   });
// const specDataToSpec = (spec: SpecData): I => ({
//   to: (i) => b_i(spec.to[i] ?? []),
//   from: (i) => b_i(spec.from[i] ?? []),
// });
// const addAtoB = addTo("A", scale(v(2)), "B");
// const addBtoA = addTo("B", translation(v(2)), "A");
// const mSpec = addBtoA(addAtoB(EMPTY_SPEC));
// const m: I = specDataToSpec(mSpec);
// const from: MapFrom = ({ name }) => ({ a: "A" as IT, b: "B" as IT }[name]);
// const invNull: EndoInvertible<null> = {
//   v: null,
//   inv: () => null,
// };
// const to: MapTo =
//   (
//     { name: prevName, t: tacc } // update prevBound
//   ) =>
//   ([{ v }, it]) =>
//     [invNull, { name: it === "A" ? "a" : "b", t: _(tacc)(v) }];
// const example: O = mapOKAY<IT, CtxTransform, OT, null>(
//   from,
//   ([_, ot]) => [tWithInv(ot.t), from(ot)], // unfortunately this limits upgradability
//   to
// )(m);
// const nextit = (i: IT | null): IT | null => {
//   if (i === null) return null;
//   const { base, all } = m.from(i);
//   return base === null ? null : [...all(base)][0][1];
// };
// const nextot = (o: OT | null): OT | null => {
//   if (o === null) return null;
//   const { base, all } = example.from(o);
//   return base === null ? null : [...all(base)][0][1];
// };
// //const fromot = (o: OT): OT => [...example.from(o)][0][1];
// // console.log(addAtoB(EMPTY_SPEC));
// // console.log(m.to("A"));
// console.log(mSpec);
// console.log(nextot(nextot({ name: "a", t: id })));
/**
 * EXAMPLE 1
 */
// type R = ">" | "+" | "<" | "-";
// type IT = "A" | "B";
// type I = EndoInvertibleMultiRel<IT, R>;
// type OT = ["a" | "b", string];
// type O = EndoInvertibleMultiRel<OT, null>;
// type MapFrom = (o: OT) => IT;
// type MapTo = (
//   o: OT
// ) => (r: [EndoInvertible<R>, IT]) => [EndoInvertible<null>, OT];
// const rInv = (r: R) =>
//   ({ ">": "<" as R, "<": ">" as R, "+": "-" as R, "-": "+" as R }[r]);
// const invR = (r: R): EndoInvertible<R> => ({
//   v: r,
//   inv: rInv,
// });
// const m: I = {
//   to: (i) =>
//     ({
//       A: [[invR(">"), "B"]] as [EndoInvertible<R>, IT][],
//       B: [[invR("+"), "A"]] as [EndoInvertible<R>, IT][],
//     }[i]),
//   from: (i) =>
//     ({
//       B: [[invR(rInv(">")), "A"]] as [EndoInvertible<R>, IT][],
//       A: [[invR(rInv("+")), "B"]] as [EndoInvertible<R>, IT][],
//     }[i]),
// };
// const from: MapFrom = ([o, _]) => ({ a: "A" as IT, b: "B" as IT }[o]);
// const invNull: EndoInvertible<null> = {
//   v: null,
//   inv: () => null,
// };
// const to: MapTo =
//   ([_, rs]) =>
//   ([{ v }, t]) =>
//     [invNull, [t === "A" ? "a" : "b", rs + v]];
// const example: O = mapIMR(from, to)(m);
// const nextot = (o: OT): OT => [...example.to(o)][0][1];
// const fromot = (o: OT): OT => [...example.from(o)][0][1];
// console.log(nextot(fromot(nextot(nextot(["a", ""])))));
/**
 * EXAMPLE 2
 */
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
