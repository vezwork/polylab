import {
  CtxTransform,
  _,
  apply,
  id,
  inv,
  rotation,
  translation,
} from "../../../lib/math/CtxTransform.js";
import { Vec2, add, v } from "../../../lib/math/Vec2.js";
import { objectLift } from "../../../lib/structure/Object.js";
import {
  sig,
  sigFun,
  // sigFilter,
  sigs,
  VAL,
  ONCHANGE,
  SET,
  sigMorphism,
  sigBimorphism,
  sigIapMorphism,
  Sig,
  sigOpmorphism,
} from "./sig.js";

const sAdd = sigFun<[number, number], number>(([a, b]) => a + b);
const sLog = sigFun(console.log);

const s1 = sig(1);
//setInterval(() => s1.value++, 100);
const s2 = sig(5);
const plus = sAdd(sigs([s1, s2]));
//plus.on(s1, s2);
// const congruent = sigFilter<number>((num) => num % 3 === 0)(plus);
// sLog(congruent);

const linkCtxTransform = (data: CtxTransform) =>
  sigIapMorphism({
    data,
    invAp: _,
    ap: _,
    inv,
  });
const linkVec2 = (data: CtxTransform) =>
  sigIapMorphism({
    data,
    invAp: apply,
    ap: apply,
    inv,
  });

const v1 = sig<Vec2>([1, 2]);
const v2 = sig<Vec2>([1, 2]);
linkVec2(translation(v(10)))(v1)(v2);
console.log(v1[VAL](), v2[VAL]());

setInterval(() => {
  const [val, set] = v1;
  set(add(val(), v(1)));
}, 100);

const SIZE = 10;
const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d")!;

const fillRectOn = sigFun<Vec2, any>((v, prevVal) => {
  ctx.clearRect(...prevVal, SIZE, SIZE);
  ctx.fillRect(...v, SIZE, SIZE);
});
//fillRectOn(v1);
//fillRectOn(v2);

const thing = () => {
  const dims = sig<Vec2>(v(10));
  const t = sig<CtxTransform>(id);
  const s = sigs([dims, t]);

  const fillRectOn = sigFun<[Vec2, CtxTransform], any>(
    ([[w, h], t], [[ow, oh], ot]) => {
      ctx.save();
      ctx.setTransform(...ot);
      ctx.clearRect(-1, -1, ow + 2, oh + 2); // `-1`, `+2` is a hack to avoid ghost bug
      ctx.restore();
      // bug: when the transform is not an integer translation, this leaves a ghost outline

      ctx.save();
      ctx.setTransform(...t);
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  );
  fillRectOn(s);

  return { s, dims, t };
};
const t1 = thing();
const t2 = thing();
const t3 = thing();
// bug: t1 and t2 overlap on first frame; since part of drawing is clearing your
// previous position this results in t1 being cleared.
const m12 = sigMorphism<
  [[Vec2, CtxTransform], [Vec2, CtxTransform]],
  CtxTransform
>(([[v1, t1], [v2, t2]]) => _(translation(v1))(t1))(sigs([t1.s, t2.s]))(
  t2.t,
  () => [m21, m12]
);
const m21 = sigMorphism<
  [[Vec2, CtxTransform], [Vec2, CtxTransform]],
  CtxTransform
>(([[v2, t2], [v1, t1]]) => _(inv(translation(v1)))(t2))(sigs([t2.s, t1.s]))(
  t1.t,
  () => [m12, m21]
);
// bug: m12 and m21 have the bug described in the next note below m13 and m31

const m13 = sigMorphism<[Vec2, CtxTransform], CtxTransform>(([v1, t1]) => {
  console.log("1 -> 3");
  const v3 = t3.dims[VAL]();
  return _(translation([-v3[0], v1[1]]))(t1);
})(t1.s)(t3.t, () => [m31, m13]);

const m31 = sigMorphism<[Vec2, CtxTransform], CtxTransform>(([v3, t3]) => {
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
}, 333);

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

const ZthingyRel = {
  rfrom: () => Zthingy,
  rto: () => Zthingy,
  iso: {
    to: {
      morphism: (me, to) =>
        sigMorphism<[Vec2, CtxTransform], CtxTransform>(([dims, t]) =>
          _(translation([dims[0], 0] as Vec2))(t)
        ),
      mfrom: ({ dims, t }) => sigs([dims, t]), // onchanges to these
      mto: ({ t }) => t, // affect these
    },
    from: {
      morphism: (from, me) =>
        sigMorphism<CtxTransform, CtxTransform>((t) =>
          _(inv(translation([me.dims[VAL]()[0], 0])))(t)
        ),
      mfrom: ({ t }) => t, // onchanges to these
      mto: ({ t }) => t, // affect these (i.e. don't include dims even tho its part of the morphism calculation for affecting t)
    },
  },
};
const Zthingy = {
  data: () => {
    const dims = sig<Vec2>(v(10));
    const t = sig<CtxTransform>(id);

    const fillRectOn = sigFun<[Vec2, CtxTransform], any>(
      ([[w, h], t], [[ow, oh], ot]) => {
        ctx.save();
        ctx.setTransform(...ot);
        ctx.clearRect(-1, -1, ow + 2, oh + 2); // `-1`, `+2` is a hack to avoid ghost bug
        ctx.restore();
        // bug: when the transform is not an integer translation, this leaves a ghost outline

        ctx.save();
        ctx.setTransform(...t);
        ctx.fillRect(1, 1, w - 3, h - 3);
        ctx.restore();
      }
    );
    fillRectOn(sigs([dims, t]));

    return { dims, t };
  },
  inRels: [ZthingyRel],
  outRels: [ZthingyRel],
};

let count = 0;
const go = (
  thingy: { data: any; inRels: any[]; outRels: any[] },
  ignoreOutRels = false, // hack to make this work, but only for traversal of path/cycle graphs
  ignoreInRels = false, // hack to make this work, but only for  traversal of path/cycle graphs
  depth = 0
): any => {
  if (depth > 100) return; // prevent infinite traversal
  const me = thingy.data();
  console.log("go", me, depth, count++);

  if (!ignoreOutRels) {
    for (const { rto, iso } of thingy.outRels) {
      const { to, from } = iso;

      const otherThingy = go(rto(), false, true, depth + 1);
      if (!otherThingy) break;

      const imto = to.morphism(me, otherThingy)(to.mfrom(me))(
        to.mto(otherThingy),
        () => [imfrom, imto]
      );
      const imfrom = from.morphism(otherThingy, me)(from.mfrom(otherThingy))(
        from.mfrom(me),
        () => [imto, imfrom]
      );
    }
  }
  if (!ignoreInRels) {
    for (const { rfrom, iso } of thingy.inRels) {
      const { to, from } = iso;

      const otherThingy = go(rfrom(), true, false, depth + 1);
      if (!otherThingy) break;

      const imto = to.morphism(otherThingy, me)(to.mfrom(otherThingy))(
        to.mto(me),
        () => [imfrom]
      );
      const imfrom = from.morphism(me, otherThingy)(from.mfrom(me))(
        from.mfrom(otherThingy),
        () => [imto]
      );
    }
  }

  return me;
};

const infiniteBoxes = go(Zthingy);

let i = 100;
//setInterval(() => gg.dims[SET]([Math.random() * 30, 10]), 310);
setInterval(() => infiniteBoxes.t[SET](translation(v(i++))), 100);
// bug: ggs to the right of center have a larger gap than things to the left because
// of the order of instantiation leading to order of drawing and clearing. ggs move to
// overlap with others, then when the overlapping gg moves they clear part of both ggs.
// could be fixed by grouping things into clear steps and draw steps but right now there
// is no concept of steps, things just happen as things change. I don't think the renderer
// really likes the lack of batched steps of drawing lol, theres a lot of flashing.

// note: it is theoretically possible to narrow change notifications depending on the representation of your thing
// e.g. `vec2(1,1) * 2` triggers x and y change notifications.
// e.g. `polar(pi/4, sqrt(2)) * 2` triggers only length change notification.

// what now?
// - actual graph traversal not just linear traversal (e.g. binary tree)
// - follow in the footsteps of Lu's "Screenpond"
// - follow in the footsteps of Toby's "Recursive Drawing"
//   - transforms between all shapes in fractal layer must be the same. When you change
//     the position of one shape it needs to recompute its transform relative to its sibling
//     and update that relationship for everyone. Same for screenpond.
// - start adapting for Polytope

// I kind of want to redo this all but where I construct categories with edges equipped with data (formally
// an edge equippred with data is a functor to a category of transformations like Vect) instead of functions that call eachother.
// - edges between A and B would be defined as On change to A state (A state, B state) => B state
//   - hmmm this makes it an update function
// - this is nice because graph traversal is easier to reason about than recursive function calls.
// - this is nice because it is (more) independent of evaluation model
//   - edges as a function (() => [] instead of just []) as a covering space / loop space of a group?
// - this would be a lot of work tho. What are some reasons why I should continue my current approach?
//   - it works and is a cool signal-based model of evaluation that could work well for Polytope
// - is all this category theory formalism useful? Am I going abstraction crazy?.. I think it will be useful,
//   but we'll see.

// now I feel like I need to take a step back and ask myself: what I am trying to achieve?
// I started working on this because I wanted to use signals to build components for Polytope.
// In particular, I was fixing bugs in Polytope v1 code and I felt like a lot of the code complexity
// comes from not having proper framework for dealing with changes. At this point though, this
// exploration has gotten into some deeper topics of interest, like:
// - understanding my PUSH IN, PUSH OUT; PULL OUT, PULL IN; MULTIPLE table.
// - expressing things using isomorphisms (and morphisms) instead of functions.
// - relationship / categorical composition of components instead of hierarchy.
// - fractal drawing using something like graph de-looping.

// I posted a video on twitter and Prathyush brought up making it differentiable. That is such
// a good thing to consider right now. It is very relevant to following in the footsteps of Lu
// and Toby.
