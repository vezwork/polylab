import { textD, transformD, boxD, } from "../../lib/draw/draw4computedBounds.js";
import { setupFullscreenCanvas } from "../../lib/draw/setupFullscreenCanvas.js";
import { id, scale } from "../../lib/math/CtxTransform.js";
import { v } from "../../lib/math/Vec2.js";
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
const ntD = (text, size = 40) => textD(...measureWidth(text, size));
// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
// https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
const measureWidth = (text, size) => {
    ctx.textBaseline = "alphabetic";
    ctx.font = `${size}px monospace`;
    const measure = ctx.measureText(text);
    return [text, size, measure.width + 4, measure.fontBoundingBoxAscent];
};
const selfBoxT = transformD(scale(v(0.7)), v(20))(ntD("1"));
const selfBox = boxD(selfBoxT);
selfBoxT.drawable = selfBox;
selfBox.parents.push(selfBoxT);
const pre = selfBox.preDraw(id, null).children[0].children[0].children[0]
    .children[0].children[0].children[0];
const reversePre = selfBox.reversePreDraw(id, pre);
console.log(pre, reversePre);
pre.draw(ctx);
reversePre.draw(ctx);
// const selfBoxT = transformD(scale(v(0.7)), v(20))(ntD("1"));
// const selfBox = boxD(selfBoxT);
// selfBoxT.drawable = drawables(selfBox, selfBox);
// const pre = selfBox.preDraw([0.7, 0, 0, 0.7, 20, 20], null);
// console.log(pre);
// pre.draw(ctx);
let t = 1;
function anim() {
    //ctx.clearRect(0, 0, c.width, c.height);
    // const main = drawables(
    //   boxD(transformD(scale(v(t)), v(5))(ntD("1"))),
    //   ntD("+"),
    //   ntD("1"),
    //   ntD("=")
    // );
    // main.preDraw(id, null).draw(ctx);
    //selfBox.preDraw(id, null).draw(ctx);
    t += 0.01;
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
