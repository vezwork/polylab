import { getBounds } from "./geom.js";
export const drawSelectedCaretHost = (ctx, color) => (c) => {
    ctx.save();
    const { top, right, bottom, left } = getBounds(c);
    ctx.fillStyle = color;
    ctx.fillRect(left, top, right - left, bottom - top);
    ctx.restore();
};
const drawCaretHost = (ctx) => (c) => {
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
const drawCaret = (ctx) => (c) => {
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
export const drawScene = (ctx) => (cs, chs) => {
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    chs.map(drawCaretHost(ctx));
    cs.map(drawCaret(ctx));
};
