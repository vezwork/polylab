import { getBounds } from "./geom.js";
import { Caret } from "./manager.js";
import { CaretHost } from "./state.js";

export const drawSelectedCaretHost =
  (ctx: CanvasRenderingContext2D) => (c: CaretHost) => {
    ctx.save();
    const { top, right, bottom, left } = getBounds(c);
    ctx.fillStyle = "yellow";
    ctx.fillRect(left, top, right - left, bottom - top);
    ctx.restore();
  };
const drawCaretHost = (ctx: CanvasRenderingContext2D) => (c: CaretHost) => {
  const { top, right, bottom, left } = getBounds(c);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  ctx.font = "20px sans-serif";
  ctx.fillText(c.char, left + 10, top + 20);
  ctx.restore();
};
const drawCaret = (ctx: CanvasRenderingContext2D) => (c: Caret) => {
  const { top, right, bottom, left } = getBounds(c.at);
  ctx.save();
  ctx.strokeStyle = c.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  ctx.restore();
};

export const drawScene =
  (ctx: CanvasRenderingContext2D) =>
  (cs: readonly Caret[], chs: readonly CaretHost[]) => {
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    chs.map(drawCaretHost(ctx));
    cs.map(drawCaret(ctx));
  };
