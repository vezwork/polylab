import { angleOf, length, sub } from "../../../lib/math/Vec2.js";

const clamp = (min, max) => (value) => Math.min(Math.max(value, min), max);

function roundTo(number, n) {
  return Math.round(number / n) * n;
}

const mul = ([r1, i1], [r2, i2]) => [r1 * r2 - i1 * i2, r1 * i2 + r2 * i1];
const add = ([r1, i1], [r2, i2]) => [r1 + r2, i1 + i2];

const f = (a) => (z) => add(mul(z, z), a);

const PIXEL_SIZE = 3;

const mid = [c.width / 2 + 165, c.height / 2];

const ps = [];
for (let x = 0; x < c.width; x += PIXEL_SIZE) {
  ps[x] = [];
  for (let y = 0; y < c.height; y += PIXEL_SIZE) {
    ps[x][y] = sub([x, y], mid).map((a) => a / 300);
  }
}

draw();
function draw() {
  requestAnimationFrame(draw);
  for (let x = 0; x < c.width; x += PIXEL_SIZE) {
    for (let y = 0; y < c.height; y += PIXEL_SIZE) {
      const angle = angleOf(ps[x][y]);
      const l = length(ps[x][y]);
      ctx.fillStyle = `lch(${70 - l} ${130 - l} ${angle}rad`;
      ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
      const z0 = sub([x, y], mid).map((a) => a / 300);
      ps[x][y] = f(z0)(ps[x][y]).map(clamp(-1000, 1000));
    }
  }
}

addEventListener("mousemove", (e) => {
  const [x, y] = [
    roundTo(e.offsetX, PIXEL_SIZE),
    roundTo(e.offsetY, PIXEL_SIZE),
  ];
  console.log(ps[x][y]);
});
