import { mod } from "../../../lib/math/Number.js";
import { fromPolar, angleBetween, angleOf } from "../../../lib/math/Vec2.js";

const add = (a1, a2) =>
  a1.map((vs, x) => vs.map((v, y) => a1[x][y] + a2[x][y]));
const neg = (a) => a.map((vs) => vs.map((v) => -v));
const sub = (a1, a2) => add(a1, neg(a2));
const sum = (a) =>
  a.reduce((ac, vs) => ac + vs.reduce((acc, v) => acc + v, 0), 0);

const center = [c.width / 2, c.height / 2];

const s = 1;
const l = Math.floor(c.width / s);

const H = 3;
const S = 200;
let u = Array(S)
  .fill(0)
  .map((x) => Array(S).fill(0));
let v = Array(S)
  .fill(0)
  .map((x) => Array(S).fill(0));

// this works locally, but not globally
// also want a "how many times did it reflect?" function
const reflect = (i, m) => {
  if (i >= m) return m - (i - m + 1);
  if (i <= 0) return 0 - i;
  return i;
};
const at = (a, i) => a[reflect(i, a.length)];

const P = (u) => {
  const nu = u.map((vs) => vs.map((v) => v));
  for (let x = 0; x < u.length; x++) {
    for (let y = 0; y < u.length; y++) {
      nu[x][y] =
        (1 / 4) *
        (at(at(u, x), y - 1) +
          at(at(u, x), y + 1) +
          at(at(u, x - 1), y) +
          at(at(u, x + 1), y));
    }
  }
  return nu;
};
const waveItUp = () => {
  const Pu = P(u);
  const nv = sub(P(v), sub(u, P(Pu)));
  const nu = add(Pu, v);
  v = nv;
  u = nu;
};

let my = 0;
c.addEventListener("mousemove", (e) => {
  my += e.movementY / 100;
});
let mmx;
let mmy;
c.addEventListener("mousedown", (e) => {
  mmx = Math.floor((e.offsetX - 100) / 2);
  mmy = Math.floor((e.offsetY - 100) / 2);
  my = 0;
});
c.addEventListener("mouseup", (e) => {
  mmx = undefined;
  mmy = undefined;
});

let t = 0;
function anim() {
  requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillRect(...center, 1, 1);
  for (let x = 0; x < u.length; x++) {
    for (let y = 0; y < u.length; y++) {
      ctx.fillRect(100 + x * 2, 100 + y * 2 + u[x][y] * 80, s, s);
    }
  }

  // terrytao.wordpress.com/2014/11/05/discretised-wave-equations
  // equation (3)
  // u(t+1) = Pu(t) + v(t)
  // v(t+1) = Pv(t) - (1-P^2)u(t)

  // how do you add boundary conditions?

  if (mmx && mmy) u[mmx][mmy] = my;
  //u[Math.floor(S/2)][0] = Math.sin(4*t)
  t += (Math.PI * 2) / S; // why 19?
  waveItUp();
}
anim();
