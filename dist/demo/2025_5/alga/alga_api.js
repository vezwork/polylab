import { Ob, rel, upRel, set } from "./alga_core.js";

export { set, Ob, delRel, delOb, rel } from "./alga_core.js";

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

const Pad = (interval, pad = 10) => ({
  l: rel(Ob(0), interval.l, bidirPlusConst(pad)).ob1,
  r: rel(interval.r, Ob(0), bidirPlusConst(pad)).ob2,
});

// 2-DIM OBJECTS
const addInterval2Sugar = (interval2) => {
  return {
    ...interval2,
    // 1D getters
    get top() {
      return top(interval2);
    },
    get left() {
      return left(interval2);
    },
    get right() {
      return right(interval2);
    },
    get bottom() {
      return bottom(interval2);
    },
    // 1D setters
    set top(v) {
      if (v.hasOwnProperty("v")) eq(top(interval2), v);
      else set(top(interval2), v);
    },
    set left(v) {
      if (v.hasOwnProperty("v")) eq(left(interval2), v);
      else set(left(interval2), v);
    },
    set right(v) {
      if (v.hasOwnProperty("v")) eq(right(interval2), v);
      else set(right(interval2), v);
    },
    set bottom(v) {
      if (v.hasOwnProperty("v")) eq(bottom(interval2), v);
      else set(bottom(interval2), v);
    },
    // 2D getters
    get leftTop() {
      return leftTop(interval2);
    },
    get leftCenter() {
      return leftCenter(interval2);
    },
    get leftBottom() {
      return leftBottom(interval2);
    },
    get centerTop() {
      return centerTop(interval2);
    },
    get centerCenter() {
      return centerCenter(interval2);
    },
    get centerBottom() {
      return centerBottom(interval2);
    },
    get rightTop() {
      return rightTop(interval2);
    },
    get rightCenter() {
      return rightCenter(interval2);
    },
    get rightBottom() {
      return rightBottom(interval2);
    },
  };
};

export const Pad2 = (interval2, pad) =>
  addInterval2Sugar({
    x: Pad(interval2.x, pad),
    y: Pad(interval2.y, pad),
  });

export const Point = (v1 = 0, v2 = 0) => [Ob(v1), Ob(v2)];

export const Interval2 = () =>
  addInterval2Sugar({
    x: Interval(),
    y: Interval(),
  });

export const WidthInterval2 = (w, h) =>
  addInterval2Sugar({
    x: WidthInterval(w),
    y: WidthInterval(h),
  });

const Min = upRel(Math.min, (a, d, b) => a + d);
const Max = upRel(Math.max, (a, d, b) => a + d);

// assumes boxes always have l < r
export const Group = (...intervals) => {
  const group = {
    l: Min(...intervals.map((i) => i.l)),
    r: Max(...intervals.map((i) => i.r)),
  };
  group.add = (i) => {
    group.l.addOb(i.l);
    group.r.addOb(i.r);
  };
  group.del = (i) => {
    group.l.delOb(i.l);
    group.r.delOb(i.r);
  };
  return group;
};
export const Group2 = (...interval2s) => {
  const group2 = {
    x: Group(...interval2s.map((i2) => i2.x)),
    y: Group(...interval2s.map((i2) => i2.y)),
  };
  group2.add = (i2) => {
    group2.x.add(i2.x);
    group2.y.add(i2.y);
  };
  group2.del = (i2) => {
    group2.x.del(i2.x);
    group2.y.del(i2.y);
  };
  return addInterval2Sugar(group2);
};

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
export const eqOffset = (a, b, w) => rel(a, b, bidirPlusConst(w));
export const eq2 = ([a1, a2], [b1, b2]) => [
  rel(a1, b1, bidirEq),
  rel(a2, b2, bidirEq),
];
export const set2 = ([ob1, ob2], [v1, v2]) => [set(ob1, v1), set(ob2, v2)];

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

export const stackX = (a, b, spacing = 10) => {
  let g = spaceX(spacing)(a, b);
  eq(centerY(a), centerY(b));
  return g;
};
export const stackXTop = (a, b, spacing = 10) => {
  let g = spaceX(spacing)(a, b);
  eq(top(a), top(b));
  return g;
};
export const stackY = (a, b, spacing = 10) => {
  let g = spaceY(spacing)(a, b);
  eq(centerX(a), centerX(b));
  return g;
};
