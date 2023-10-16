import { YInterval } from "../caret/caretNav.js";
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

export function drawNestedCaretLines(
  ctx: CanvasRenderingContext2D,
  lines: (t: DrawTree) => YInterval<DrawTree>[][],
  hasChildren: (t: DrawTree) => boolean,
  focus: DrawTree,
  depth = 3
) {
  if (depth === 0) return;
  ctx.save();
  ctx.strokeStyle = "blue";
  for (const line of lines(focus)) {
    for (const [
      {
        n,
        interval: [top, bottom],
        data,
      },
      i,
    ] of withIndex(line)) {
      ctx.beginPath();

      if (i === 0) {
        ctx.moveTo(n, top);
        ctx.lineTo(n, bottom);
      }
      if (i === line.length - 1) {
        ctx.moveTo(n, top);
        ctx.lineTo(n, bottom);
      } else {
        const next = line[i + 1];
        //if (i % 2 === 1) {
        //ctx.moveTo(n, bottom);
        //ctx.lineTo(n, top);
        // } else {
        ctx.moveTo(n, top);
        //}

        ctx.lineTo(next.n, next.interval[0]);
        ctx.moveTo(n, bottom);
        ctx.lineTo(next.n, next.interval[1]);
      }
      ctx.stroke();
      if (data && hasChildren(data)) {
        const { width, height, x, y } = getBounds(data);
        ctx.globalAlpha = 0.01;
        ctx.fillStyle = "blue";
        ctx.fillRect(x, y, width, height);
        ctx.globalAlpha = 1;
        drawNestedCaretLines(ctx, lines, hasChildren, data, depth - 1);
      }
    }
  }
  ctx.restore();
}
