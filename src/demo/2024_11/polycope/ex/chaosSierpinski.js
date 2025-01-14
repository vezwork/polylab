import { mul, add } from "../../../lib/math/Vec2.js";
import { lerp } from "../../../lib/math/Line2.js";

const tri = [
  [0, 0],
  [1, 0],
  [1 / 2, 1],
];

function draw(d) {
  let cur = [Math.random(), Math.random()];
  ctx.clearRect(0, 0, c.width, c.height);
  for (let i = 0; i < 60000; i++) {
    ctx.fillRect(...add([20, 20], mul(660, cur)), 0.4, 0.4);
    const roll = Math.random();
    const choice = tri[Math.floor(Math.random() * tri.length)];
    cur = lerp([cur, choice])(d);
  }
}
let t = 10;
function anim() {
  requestAnimationFrame(anim);
  draw(Math.abs(Math.sin(t / 100) / 2));
  t++;
}
anim();
