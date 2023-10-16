import {
  CtxTransform,
  id,
  _,
  apply,
  translation,
  scale,
  zeroTranslate,
} from "../math/CtxTransform.js";
import { height, width } from "../math/Line2.js";
import { max } from "../math/Number.js";
import { Vec2, length, x, y } from "../math/Vec2.js";

type Context = {
  draw: CanvasRenderingContext2D;
  t: CtxTransform;
};
type DrawInfo = {
  caretable?: true;
  d: Drawable;
  bound: Vec2;
  children: DrawInfo[];
  t: CtxTransform;
} | null;
type Drawable = (ctx: Context) => DrawInfo;

export const line = (line: Vec2[]): Drawable => {
  const d = ({ draw, t }: Context): DrawInfo => {
    draw.beginPath();
    if (line[0]) draw.moveTo(...apply(t)(line[0]));
    for (const p of line) draw.lineTo(...apply(t)(p));
    draw.stroke();
    draw.closePath();
    return {
      d,
      bound: [max(line.map(x)), max(line.map(y))],
      children: [],
      t,
    };
  };
  return d;
};
export const trans =
  (myT: CtxTransform) =>
  (drawable: Drawable): Drawable => {
    const d = (c: Context): DrawInfo => {
      const { draw, t: parentT } = c;
      const t = _(myT)(parentT);
      const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
      if (scaleFactor < 0.02) return null; // dont render small stuff
      const dInfo = drawable({ draw, t });
      if (dInfo === null) return null; // dont render if child doesn't render
      return {
        d,
        bound: apply(t)(dInfo.bound),
        children: [dInfo],
        t,
      };
    };
    return d;
  };
export const ds = (...drawables: Drawable[]): Drawable => {
  const d = (c: Context): DrawInfo => {
    const children = drawables.map((d) => d(c));
    const w = children.reduce(
      (prev, cur) => Math.max(cur?.bound[0] ?? 0, prev),
      0
    );
    const h = children.reduce(
      (prev, cur) => Math.max(cur?.bound[1] ?? 0, prev),
      0
    );
    return {
      d,
      bound: [w, h],
      children,
      t: c.t,
    };
  };
  return d;
};
