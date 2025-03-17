import { mod } from "../../../lib/math/Number.js";
import { fromPolar, angleBetween, angleOf } from "../../../lib/math/Vec2.js";

const add = (a1, a2) => a1.map((v, i) => a1[i] + a2[i]);
const neg = (a) => a.map((v) => -v);
const sub = (a1, a2) => add(a1, neg(a2));
const sum = (a) => a.reduce((acc, v) => acc + v, 0);

const center = [c.width / 2, c.height / 2];

const s = 0.5;
const l = Math.floor(c.width / s);
console.log(l);

const H = 3;
let u = Array(l)
  .fill(0)
  .map((v, i) => Math.sin(H * ((2 * Math.PI * i) / l)));
let v = Array(l).fill(0);

const at = (a, i) => a[mod(i, a.length)];
const P = (u) => {
  const nu = [...u];
  for (let i = 0; i < u.length; i++) {
    nu[i] = (1 / 2) * at(u, i - 1) + (1 / 2) * at(u, i + 1);
  }
  return nu;
};

function anim() {
  requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);

  for (let i = 0; i < u.length; i++) {
    //    ctx.fillRect(s*i,center[1],s,u[i]*100)
    const p = add(center, fromPolar(100 + u[i] * 100, (2 * Math.PI * i) / l));
    ctx.fillRect(...p, 1, 1);
  }

  // terrytao.wordpress.com/2014/11/05/discretised-wave-equations
  // equation (3)
  // u(t+1) = Pu(t) + v(t)
  // v(t+1) = Pv(t) - (1-P^2)u(t)

  // how do you add boundary conditions?

  const nv = sub(P(v), sub(u, P(P(u))));
  const nu = add(P(u), v);
  v = nv;
  u = nu;
}
anim();
