import { Ob, rel, upRel } from "./algae3_topo.js";

export { set, Ob, delRel, delOb, rel } from "./algae3_topo.js";

// want:
// - lines
// - padding
// - outline/background
// - boxes
// - arrows (between arbitrary points on shapes)
// - text
// - images
// - circle
// - stack?

// demos:
// - bluefish demos
// - tree
// - dag

// future (dont do now):
// - logical relations (e.g. tree that can get mapped to multiple layouts)
// - limits of multiRels?
// - non-isomorphism rels

export const bidirPlusConst = (w) => ({ to: (v) => v + w, from: (v) => v - w });
const bidirEq = { to: (v) => v, from: (v) => v };

// 1-DIM OBJECTS

export const Interval = () => ({ l: Ob(0), r: Ob(0) });

const DEFAULT_WIDTH = 15;
export const WidthInterval = (w = DEFAULT_WIDTH) => {
  const box = Interval();
  rel(box.l, box.r, bidirPlusConst(w));
  return box;
};

// 2-DIM OBJECTS

const Pad = (interval, pad = 10) => ({
  l: rel(Ob(0), interval.l, bidirPlusConst(pad)).ob1,
  r: rel(interval.r, Ob(0), bidirPlusConst(pad)).ob2,
});
export const Pad2 = (interval2, pad) => ({
  x: Pad(interval2.x, pad),
  y: Pad(interval2.y, pad),
});

export const Point = () => [Ob(0), Ob(0)];

export const Interval2 = () => ({
  x: Interval(),
  y: Interval(),
});

export const WidthInterval2 = (w, h) => ({
  x: WidthInterval(w),
  y: WidthInterval(h),
});

const Min = upRel(Math.min, (a, d, b) => a + d);
const Max = upRel(Math.max, (a, d, b) => a + d);
// const Min = upRel(Math.min, (a, d, b) => (a < b ? b : a), true);
// const Max = upRel(Math.max, (a, d, b) => (a > b ? b : a), true);

// assumes boxes always have l < r
export const Group = (...intervals) => ({
  l: Min(...intervals.map((i) => i.l)),
  r: Max(...intervals.map((i) => i.r)),
});
export const Group2 = (...interval2s) => ({
  x: Group(...interval2s.map((i2) => i2.x)),
  y: Group(...interval2s.map((i2) => i2.y)),
});

// 2D ACCESSORS

export const centerCenter = (ob) => [centerX(ob), centerY(ob)];
export const leftCenter = (ob) => [left(ob), centerY(ob)];
export const rightCenter = (ob) => [right(ob), centerY(ob)];
export const centerTop = (ob) => [centerX(ob), top(ob)];
export const centerBottom = (ob) => [centerX(ob), bottom(ob)];
export const leftTop = (ob) => [left(ob), top(ob)];
export const rightTop = (ob) => [right(ob), top(ob)];
export const leftBottom = (ob) => [left(ob), bottom(ob)];
export const rightBottom = (ob) => [right(ob), bottom(ob)];

// 1D ACCESSORS

export const x = (interval2) => interval.x;
export const y = (interval2) => interval.y;
export const top = (interval2) => interval2.y.l;
export const bottom = (interval2) => interval2.y.r;
export const left = (interval2) => interval2.x.l;
export const right = (interval2) => interval2.x.r;

const lerp = (i) => (l, r) => (1 - i) * l + i * r;

const p = (i) => (interval) =>
  upRel(lerp(i), (a, d) => a + d)(interval.l, interval.r);
const center = p(0.5);
export const centerX = (interval2) => p(0.5)(interval2.x);
export const centerY = (interval2) => p(0.5)(interval2.y);
// note that `center` behaves differently than previous version of algae
//   setting center will move `l` and `r`.
//   if I wanted to use center to set the width, I would have to look into that.

// 1-DIM RELATIONS

export const eq = (a, b) => rel(a, b, bidirEq);
export const eq2 = ([a1, a2], [b1, b2]) => [
  rel(a1, b1, bidirEq),
  rel(a2, b2, bidirEq),
];

// 2-DIM RELATIONS

const relateComponentsOrdered =
  (relation) =>
  (curAccessor, nextAccessor) =>
  (...interval2s) => {
    for (let i = 0; i < interval2s.length - 1; i++)
      relation(curAccessor(interval2s[i]), nextAccessor(interval2s[i + 1]));
    return Group2(...interval2s);
  };
const eqComponentsOrdered = relateComponentsOrdered(eq);
const eqComponents = (accessor) => eqComponentsOrdered(accessor, accessor);

export const eqTop = eqComponents(top);
export const eqBottom = eqComponents(bottom);
export const eqLeft = eqComponents(left);
export const eqRight = eqComponents(right);
export const eqCenterX = eqComponents(centerX);
export const eqCenterY = eqComponents(centerY);

export const besideX = eqComponentsOrdered(right, left);
export const besideY = eqComponentsOrdered(bottom, top);

export const spaceX = (spacing = 10) =>
  relateComponentsOrdered((a, b) => rel(a, b, bidirPlusConst(spacing)))(
    right,
    left
  );
export const spaceY = (spacing = 10) =>
  relateComponentsOrdered((a, b) => rel(a, b, bidirPlusConst(spacing)))(
    bottom,
    top
  );
