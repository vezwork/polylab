import {
  lerp,
  angleOf,
  sub,
  fromPolar,
  add,
  distance,
} from "../../../lib/math/Vec2.js";
import { least } from "../../../lib/structure/Arrays.js";

const ps = [];

const center = [c.width / 2, c.height / 2];

for (let i = 0; i < 2 * Math.PI; i += Math.PI / 110) {
  const v1 = fromPolar(200, i);
  for (let i2 = 0; i2 < 2 * Math.PI; i2 += Math.PI / 110) {
    const v2 = fromPolar(100, i2);
    const p = add(add(v1, center), v2);
    p.v1 = v1;
    p.v2 = v2;
    ps.push(p);
    ctx.fillRect(...p, 2, 2);
  }
}

document.body.addEventListener("mousemove", (e) => {
  const m = [e.offsetX, e.offsetY];
  ctx.fillStyle = "red";
  const p = least(ps, (p) => distance(p, m));
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillRect(...p, 3, 3);

  ctx.strokeStyle = "blue";
  ctx.beginPath();
  ctx.moveTo(...center);
  ctx.lineTo(...add(center, p.v1));
  ctx.lineTo(...add(center, add(p.v1, p.v2)));
  ctx.stroke();
});
