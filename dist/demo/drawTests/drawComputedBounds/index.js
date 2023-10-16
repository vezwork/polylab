import { textD, transformD, drawables, boxD, } from "../../../lib/draw/draw4computedBounds.js";
import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { scale, translation } from "../../../lib/math/CtxTransform.js";
import { v } from "../../../lib/math/Vec2.js";
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
const selfBoxes = drawables();
const selfBoxT = transformD(scale(v(0.6)), v(10))(selfBoxes);
const selfBox = boxD(selfBoxT);
selfBoxes.drawables.push(selfBox, selfBox, selfBox);
selfBox.parents.push(selfBoxT);
const pre = selfBox.preDraw(translation(v(100)), null);
console.log(pre);
const reversePre = selfBox.reversePreDraw(translation(v(100)), pre);
//console.log(pre, reversePre);
pre.draw(ctx);
reversePre.draw(ctx); // doesn't behave correctly, which I think is why I started draw5 and then drawDirectedGraph
// const selfBoxT = transformD(scale(v(0.7)), v(20))(ntD("1"));
// const selfBox = boxD(selfBoxT);
// selfBoxT.drawable = drawables(selfBox, selfBox);
// const pre = selfBox.preDraw([0.7, 0, 0, 0.7, 20, 20], null);
// console.log(pre);
// pre.draw(ctx);
// const tree = drawables(
//   translateD(v(0, 40))(boxD(ntD("1"))),
//   boxD(ntD("+")),
//   translateD(v(0, 40))(boxD(drawables(boxD(ntD("hello")))))
// );
// tree.preDraw(id, null).draw(ctx);
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
