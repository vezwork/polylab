//interactive harmonic numbers recursive formula
//inspired by:
//https://www.youtube.com/watch?v=9p_U_o1pMKo
import { distance, assign, mul } from "../../../lib/math/Vec2.js";

const R = 8;
const S = 50;

function drawCircle(p, r) {
  ctx.beginPath();
  ctx.ellipse(p[0] * S, p[1] * S, r, r, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();
}

let p = [2, 2];

const hup = ([x, y]) => [x + 1, y + 1 / (y + 1)];
const hdn = ([x, y]) => [x - 1, y - 1 / y];

let m = [0, 0];
let grabbing = false;
c.addEventListener("mousemove", (e) => {
  m = mul(1 / S, [e.offsetX, e.offsetY]);
  if (grabbing) assign(grabbing)(m);
});
c.addEventListener("mousedown", (e) => {
  if (distance(m, p) < R) {
    grabbing = p;
  }
});
c.addEventListener("mouseup", (e) => {
  grabbing = false;
});

draw();
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = "violet";
  ctx.strokeStyle = "black";
  drawCircle(p, R);

  ctx.strokeStyle = "transparent";
  ctx.fillStyle = "cornflowerblue";
  let cur = p;
  while (cur[0] < c.width) {
    cur = hup(cur);
    drawCircle(cur, 5);
  }
  cur = p;
  while (cur[0] > 0) {
    cur = hdn(cur);
    drawCircle(cur, 5);
  }
}
