import { l, t } from "../../lib/draw/draw5.js";
import { scale, translation, _, } from "../../lib/math/CtxTransform.js";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
//-----------
//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
// Get the DPR and size of the canvas
const dpr = window.devicePixelRatio;
const brect = c.getBoundingClientRect();
// Set the "actual" size of the canvas
c.width = brect.width * dpr;
c.height = brect.height * dpr;
// Scale the context to ensure correct drawing operations
ctx.scale(dpr, dpr);
// Set the "drawn" size of the canvas
c.style.width = `${brect.width}px`;
c.style.height = `${brect.height}px`;
//----------
const rect = l([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
]);
const tr = _(scale([20, 20]))(translation([20, 20]));
function anim() {
    ctx.clearRect(0, 0, c.width, c.height);
    t(tr)(rect)(ctx);
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
