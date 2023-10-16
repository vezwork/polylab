import {
  CtxTransform,
  _,
  apply,
  translation,
  scale,
  zeroTranslate,
  id,
  inv,
} from "../math/CtxTransform.js";
import { Vec2, length, add, x, y, sub, v } from "../math/Vec2.js";

/**
 * relationships are directional and reversible
 *
 * e.g. recursiveBox draws { target: recursiveBox, rel: "if getScale(this) > 1 then wrap(target)" }
 *
 * e.g. Sigma draws { target: SigmaTop, rel: "xCenter . yTranslate(10)" }
 *
 * rel computes a context for the target in draws
 *
 * e.g. Denom draws NumeratorWithLineBelow
 * e.g. NumeratorWithLineBelow draws Numerator
 */

/**
 *
 */

// drawSelf(context, drawInfo of draws),
// rels

// size(drawable) = size of drawSelf(drawable) overlap size of drawSelf(d of draws)

type Rel = { rel: CtxTransform; target: DrawBoy };

type Context = {
  ctx: CanvasRenderingContext2D;
  tr: CtxTransform;
};
type DrawInfo = {
  bound: Vec2;
};
type DrawBoy = {
  draws: Rel[];
  drawnBy: Rel | null;
  drawSelf: (input: Context, infos: DrawInfo[]) => DrawInfo;
};

// add slot to box
export const box = (slot: () => DrawBoy) => {
  const draws = slot();
  const newBox = {
    draws: [
      {
        rel: _(scale(v(0.9)))(translation(v(10))),
        target: draws,
      },
    ],
    drawnBy: null,
    drawSelf: ({ ctx, tr }: Context, infos: DrawInfo[]): DrawInfo => {
      const dep = infos[0];

      const v1 = apply(tr)(v(0));
      const worldSpaceDepV2 = add(v1, dep.bound);
      const worldSpacePad = apply(zeroTranslate(tr))(v(20));
      const v2 = add(worldSpacePad, worldSpaceDepV2);

      ctx.beginPath();
      ctx.lineTo(x(v1), y(v1));
      ctx.lineTo(x(v1), y(v2));
      ctx.lineTo(x(v2), y(v2));
      ctx.lineTo(x(v2), y(v1));
      ctx.closePath();
      ctx.stroke();

      return {
        bound: sub(v2, v1),
      };
    },
  };
  draws.drawnBy = {
    rel: _(scale(v(0.9)))(translation(v(10))),
    target: newBox,
  };
  return newBox;
};

const scaleFactor = (tr: CtxTransform) =>
  length(apply(zeroTranslate(tr))(v(1)));

export const drawDown = (drawBoy: DrawBoy, c: Context): DrawInfo => {
  if (scaleFactor(c.tr) < 0.1) return { bound: [0, 0] };

  return drawBoy.drawSelf(c, drawBoy.draws.map(relToDrawDown(c)));
};
const relToDrawDown =
  ({ ctx, tr }: Context) =>
  ({ rel, target }: Rel) =>
    drawDown(target, { ctx, tr: _(rel)(tr) });

export const drawUp = (
  drawBoy: DrawBoy,
  { ctx, tr }: Context,
  info: DrawInfo
): void => {
  if (scaleFactor(tr) > 100) return;

  if (drawBoy.drawnBy === null) return;

  const { rel, target } = drawBoy.drawnBy;
  const newTr = _(inv(rel))(tr);
  const newContext = { ctx, tr: newTr };
  drawUp(target, newContext, target.drawSelf(newContext, [info]));
};

export const draw = (drawBoy: DrawBoy, c: Context) =>
  drawUp(drawBoy, c, drawDown(drawBoy, c));

// - drawBoys can only have one "drawnBy" otherwise there is a disjunction of possible things to drawUp
// - this can express everything draw4 can and more (draw4 is tree, this is a thin-groupoid / setoid)
//   - with the exception that height and width are not static (part of the input context). This will make centering hard for example.
//     - a DrawBoy subtype of static height and width could be used?
// -
