import { getBounds } from "./draw4.js";
export const drawBoundRight = (ctx, t) => {
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
export const drawLineBetweenBoundRights = (ctx, t1, t2, color) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    const curB = getBounds(t1);
    const aboveB = getBounds(t2);
    ctx.moveTo(curB.right, curB.top);
    ctx.lineTo(aboveB.right, aboveB.bottom);
    ctx.stroke();
};
