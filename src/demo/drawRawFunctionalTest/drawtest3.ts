import { ds, line, trans } from "../../lib/draw/draw5.js";
import { setupFullscreenCanvas } from "../../lib/draw/setupFullscreenCanvas.js";
import { id, scale, translation, _ } from "../../lib/math/CtxTransform.js";

const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;

const rect = line([
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
]);

const tr = _(scale([20, 20]))(translation([20, 20]));
const tr2 = _(scale([20, 20]))(translation([40, 40]));

function anim() {
  ctx.clearRect(0, 0, c.width, c.height);

  console.log(trans(tr)(rect)({ draw: ctx, t: id }));
  // logging `trans(tr)(rect)({ draw: ctx, t: id })` Gives all the info about the rendered thing. Nice.
  // logging `trans(tr)(rect)` DOES NOT give any info. The function is opaque. It would be good if I could extract `tr` and `rect` from it.

  requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
