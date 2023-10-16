import { box, draw, } from "../../lib/draw/drawDirectedGraph.js";
import { setupFullscreenCanvas } from "../../lib/draw/setupFullscreenCanvas.js";
import { scale, translation, _ } from "../../lib/math/CtxTransform.js";
import { v } from "../../lib/math/Vec2.js";
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
const nestedBox = box(() => nestedBox);
let t = 1;
function anim() {
    ctx.clearRect(0, 0, c.width, c.height);
    const tr = _(translation(v(t)))(scale(v(t / 100)));
    draw(nestedBox, { ctx, tr });
    t += 0.1;
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
