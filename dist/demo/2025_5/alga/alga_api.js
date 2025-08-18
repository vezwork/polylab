import { Ob, rel, delRel, upRel, set } from "./alga_core.js";

export { set, Ob, delRel, delOb, rel, explore } from "./alga_core.js";

import { addInterval2Sugar, addPointSugar } from "./alga_api_sugar.js";

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

const DEFAULT_WIDTH = 10;
export const WidthInterval = (w = DEFAULT_WIDTH) => {
  const box = Interval();
  let r = rel(box.l, box.r, bidirPlusConst(w));
  box.set = (newW) => {
    delRel(r);
    r = rel(box.l, box.r, bidirPlusConst(newW));
  };
  return box;
};

const Pad = (interval, pad = 10) => ({
  l: rel(interval.l, Ob(0), bidirPlusConst(-pad)).ob2,
  r: rel(interval.r, Ob(0), bidirPlusConst(pad)).ob2,
});

// 2-DIM OBJECTS

// TODO: make it take a list of drawables
export const Pad2 = (interval2, pad) =>
  addInterval2Sugar({
    x: Pad(interval2.x, pad),
    y: Pad(interval2.y, pad),
  });

export const Point = (v1 = 0, v2 = 0) => addPointSugar([Ob(v1), Ob(v2)]);

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

const Min = upRel(
  (...args) => (args.length === 0 ? 0 : Math.min(...args)),
  (a, d, b) => a + d
);
const Max = upRel(
  (...args) => (args.length === 0 ? 0 : Math.max(...args)),
  (a, d, b) => a + d
);

// assumes boxes always have l < r
export const Group1 = (...intervals) => {
  const group = {
    l: Min(...intervals.map((i) => ("v" in i ? i : i.l))),
    r: Max(...intervals.map((i) => ("v" in i ? i : i.r))),
  };
  group.add = (i) => {
    group.l.addOb("v" in i ? i : i.l);
    group.r.addOb("v" in i ? i : i.r);
  };
  group.del = (i) => {
    group.l.delOb("v" in i ? i : i.l);
    group.r.delOb("v" in i ? i : i.r);
  };
  return group;
};
export const Group = (...interval2s) => {
  const group2 = {
    x: Group1(...interval2s.map((i2) => (Array.isArray(i2) ? i2[0] : i2.x))),
    y: Group1(...interval2s.map((i2) => (Array.isArray(i2) ? i2[1] : i2.y))),
  };
  group2.add = (i2) => {
    group2.x.add(Array.isArray(i2) ? i2[0] : i2.x);
    group2.y.add(Array.isArray(i2) ? i2[1] : i2.y);
  };
  group2.del = (i2) => {
    group2.x.del(Array.isArray(i2) ? i2[0] : i2.x);
    group2.y.del(Array.isArray(i2) ? i2[1] : i2.y);
  };
  return addInterval2Sugar(group2);
};

// 2D ACCESSORS

export const centerCenter = (ob) => addPointSugar([centerX(ob), centerY(ob)]);
export const leftCenter = (ob) => addPointSugar([left(ob), centerY(ob)]);
export const rightCenter = (ob) => addPointSugar([right(ob), centerY(ob)]);
export const centerTop = (ob) => addPointSugar([centerX(ob), top(ob)]);
export const centerBottom = (ob) => addPointSugar([centerX(ob), bottom(ob)]);
export const leftTop = (ob) => addPointSugar([left(ob), top(ob)]);
export const rightTop = (ob) => addPointSugar([right(ob), top(ob)]);
export const leftBottom = (ob) => addPointSugar([left(ob), bottom(ob)]);
export const rightBottom = (ob) => addPointSugar([right(ob), bottom(ob)]);

export const x = (interval2) => interval2.x;
export const y = (interval2) => interval2.y;
export const top = (interval2) => interval2.y.l;
export const bottom = (interval2) => interval2.y.r;
export const left = (interval2) => interval2.x.l;
export const right = (interval2) => interval2.x.r;

const lerp = (i) => (l, r) => (1 - i) * l + i * r;
const p = (i) => (interval) => {
  const u = upRel(lerp(i), (a, d) => a + d)(interval.l, interval.r);
  u.interval2 = interval.l?.interval2;
  return u;
};
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
export const lessThan = (a, b) =>
  rel(a, b, {
    to: (v, cur = -Infinity) => Math.max(cur, v),
    from: (v, cur = Infinity) => Math.min(cur, v),
  });
export const set2 = ([ob1, ob2], [v1, v2]) => [set(ob1, v1), set(ob2, v2)];

// 2-DIM RELATIONS

const relateComponentsOrdered =
  (relation) =>
  (curAccessor, nextAccessor) =>
  (...interval2s) => {
    for (let i = 0; i < interval2s.length - 1; i++)
      relation(curAccessor(interval2s[i]), nextAccessor(interval2s[i + 1]));
    return Group(...interval2s);
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

export const stackX =
  (spacing = 10, alignment = 0.5) =>
  (...is) => {
    for (const i of is.slice(1)) eq(p(alignment)(is[0].y), p(alignment)(i.y));
    return spaceX(spacing)(...is);
  };

export const stackY =
  (spacing = 10, alignment = 0.5) =>
  (...is) => {
    for (const i of is.slice(1)) eq(p(alignment)(is[0].x), p(alignment)(i.x));
    return spaceY(spacing)(...is);
  };
