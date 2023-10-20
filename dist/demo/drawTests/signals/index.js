import { _, apply, id, inv, rotation, translation, } from "../../../lib/math/CtxTransform.js";
import { add, v } from "../../../lib/math/Vec2.js";
import { sig, sigFun, 
// sigFilter,
sigs, VAL, SET, sigMorphism, sigIapMorphism, } from "./sig.js";
const sAdd = sigFun(([a, b]) => a + b);
const sLog = sigFun(console.log);
const s1 = sig(1);
//setInterval(() => s1.value++, 100);
const s2 = sig(5);
const plus = sAdd(sigs([s1, s2]));
//plus.on(s1, s2);
// const congruent = sigFilter<number>((num) => num % 3 === 0)(plus);
// sLog(congruent);
const linkCtxTransform = (data) => sigIapMorphism({
    data,
    invAp: _,
    ap: _,
    inv,
});
const linkVec2 = (data) => sigIapMorphism({
    data,
    invAp: apply,
    ap: apply,
    inv,
});
const v1 = sig([1, 2]);
const v2 = sig([1, 2]);
linkVec2(translation(v(10)))(v1)(v2);
console.log(v1[VAL](), v2[VAL]());
setInterval(() => {
    const [val, set] = v1;
    set(add(val(), v(1)));
}, 100);
const SIZE = 10;
const c = document.getElementById("c");
const ctx = c.getContext("2d");
const fillRectOn = sigFun((v, prevVal) => {
    ctx.clearRect(...prevVal, SIZE, SIZE);
    ctx.fillRect(...v, SIZE, SIZE);
});
//fillRectOn(v1);
//fillRectOn(v2);
const thing = () => {
    const dims = sig(v(10));
    const t = sig(id);
    const s = sigs([dims, t]);
    const fillRectOn = sigFun(([[w, h], t], [[ow, oh], ot]) => {
        ctx.save();
        ctx.setTransform(...ot);
        ctx.clearRect(0, 0, ow, oh);
        ctx.restore();
        // bug: when the transform is not an integer translation, this leaves a ghost outline
        ctx.save();
        ctx.setTransform(...t);
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    });
    fillRectOn(s);
    return { s, dims, t };
};
const t1 = thing();
const t2 = thing();
const t3 = thing();
// bug: t1 and t2 overlap on first frame; since part of drawing is clearing your
// previous position this results in t1 being cleared.
const m12 = sigMorphism(([[v1, t1], [v2, t2]]) => _(translation(v1))(t1))(sigs([t1.s, t2.s]))(t2.t, () => [m21, m12]);
const m21 = sigMorphism(([[v2, t2], [v1, t1]]) => _(inv(translation(v1)))(t2))(sigs([t2.s, t1.s]))(t1.t, () => [m12, m21]);
// bug: m12 and m21 have the bug described in the next note below m13 and m31
const m13 = sigMorphism(([v1, t1]) => {
    console.log("1 -> 3");
    const v3 = t3.dims[VAL]();
    return _(translation([-v3[0], v1[1]]))(t1);
})(t1.s)(t3.t, () => [m31, m13]);
const m31 = sigMorphism(([v3, t3]) => {
    console.log("3 -> 1");
    const v1 = t1.dims[VAL]();
    return _(inv(translation([-v3[0], v1[1]])))(t3);
})(t3.s)(t1.t, () => [m13, m31]);
// note: had to fix a bug where, since both m13 and m31 depend on all things,
// m13 ALWAYS runs before m31. What should happen? If a t3 property change, we
// should run m31; if a t1 property changes, we should run m13.
// follow up note: The code has been adjusted to work this way. What does that look like? The
// morphism is only on `t3.s` despite the fact that it uses t1.dims.
// out there note: matrices are really just sigMorphisms. We can do dependency analysis on everything...
t2.dims[SET](v(10, 20));
t1.dims[SET](v(50, 3));
console.log("setting t3 t");
t3.t[SET](translation(v(150)));
t1.t[SET](rotation(0.1));
console.log(t1.s[VAL](), t2.s[VAL](), t3.s[VAL]());
setInterval(() => {
    const [val, set] = t1.dims;
    set(add(val(), v(1)));
    t3.t[SET](translation(v(150)));
    // note: we can set `t3.t` after setting `t1.dims` to fix t3 and make t1 grow up instead of down.
    // Could there be a way to more declaratively say this? Like say how we want to use the morphisms when setting?
    // Instead of doing two instructions one after another.
}, 100);
// what do I want now?
// - want to make a binary tree where the root node depends on the existence of two other nodes
//   and so on until some depth accumulates. Also want arrows that depend on a pair of nodes that
//   are in a parent-child relationship.
//   BINARY TREE NODE
//    - SELF LOOP: offset to the bottom left
//    - SELF LOOP: offset to the bottom right
//   ARROW
//    - DEPENDS ON BINARY TREE NODE n: starting point
//    - DEPENDS ON BINARY TREE NODE morph(n): ending point
//
//   note: this "DEPENDS / SELF LOOP" concept seems to be an "existence morphism" between signals?
