import { YInterval } from "../caret/caret";
import { withIndex } from "../structure/Iterable.js";
import { DrawTree, getBounds } from "./draw4.js";

export const drawBoundRight = (ctx: CanvasRenderingContext2D, t: DrawTree) => {
  const { top, bottom, left, right } = getBounds(t);
  ctx.save();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "green";
  ctx.beginPath();
  ctx.moveTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.restore();
};

export const drawLineBetweenBoundRights = (
  ctx: CanvasRenderingContext2D,
  t1: DrawTree,
  t2: DrawTree,
  color: string
) => {
  ctx.beginPath();
  ctx.strokeStyle = color;
  const curB = getBounds(t1);
  const aboveB = getBounds(t2);
  ctx.moveTo(curB.right, curB.top);
  ctx.lineTo(aboveB.right, aboveB.bottom);
  ctx.stroke();
};
