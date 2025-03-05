import {
  add,
  fromPolar,
  angleBetween,
  angleOf,
} from "../../../lib/math/Vec2.js";

const center = [c.width / 2, c.height / 2];

const B = (x) => Math.cos(2 * x) / Math.sqrt(Math.PI);

let mouse = [0, 0];
c.addEventListener("mousemove", (e) => {
  mouse = [e.offsetX, e.offsetY];
});

// TODO:needs to use complex numbers

let t = 0;
anim();
function anim() {
  requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);
  for (let i = 0; i < Math.PI * 2; i += 0.01) {
    // why do I multiply by 110 to make it look good?
    const p = add(center, fromPolar(60 + B(i) * Math.sqrt(Math.PI) * 60, i));
    ctx.fillRect(...p, 1, 1);
  }
  const ma = angleBetween(center, mouse);
  const mb = B(ma) * Math.sqrt(Math.PI);
  ctx.fillText(
    mb,
    ...add([c.width / 2, c.height / 2], fromPolar(60 + mb * 60, ma))
  );
  t++;
}
