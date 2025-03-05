const i = [0, 1];
const e = [Math.E, 0];
const zero = [0, 0];
const z = (r, i = 0) => [r, i];
const conj = ([r, i]) => [r, -i];
const add = ([r1, i1], [r2, i2]) => [r1 + r2, i1 + i2];
const sub = ([r1, i1], [r2, i2]) => [r1 - r2, i1 - i2];
const neg = ([r, i]) => [-r, -i];
const mul = ([r1, i1], [r2, i2]) => [r1 * r2 - i1 * i2, r1 * i2 + r2 * i1];
const div = ([r1, i1], [r2, i2]) => {
  const denom = r2 * r2 + i2 * i2;
  return [(r1 * r2 + i1 * i2) / denom, (i1 * r2 - r1 * i2) / denom];
};
const arg = ([r, i]) => Math.atan2(i, r);
const abs = ([r, i]) => Math.sqrt(r * r + i * i);
const pow = ([r1, i1], [r2, i2]) => {
  const a = r1 * r1 + i1 * i1;
  const angle = arg([r1, i1]);
  const b = a ** (r2 / 2) * Math.exp(-i2 * angle);
  const c = r2 * angle + (i2 * Math.log(a)) / 2;
  return [b * Math.cos(c), b * Math.sin(c)];
};
const exp = (z) => pow(e, z);

const mid = [z(1), z(0), z(0), z(1)];
const mmul = (t1, t2) => [
  add(mul(t1[0], t2[0]), mul(t1[1], t2[2])),
  add(mul(t1[0], t2[1]), mul(t1[1], t2[3])),
  add(mul(t1[2], t2[0]), mul(t1[3], t2[2])),
  add(mul(t1[2], t2[1]), mul(t1[3], t2[3])),
];
const mdet = ([a, b, c, d]) => sub(mul(a, d), mul(b, c));
const minv = (t) => [
  div(t[3], mdet(t)),
  neg(div(t[1], mdet(t))),
  neg(div(t[2], mdet(t))),
  div(t[0], mdet(t)),
];
const mapp =
  ([a, b, c, d]) =>
  (x) =>
    div(add(mul(a, x), b), add(mul(c, x), d));

let mouse = [0, 0];
c.addEventListener("mousemove", (e) => {
  mouse = [e.offsetX, e.offsetY];
});

const scr = ([x, y]) => [x * 20 + c.width / 2, c.height / 2 - y * 20];
const scrinv = ([x, y]) => [(x - c.width / 2) / 20, -(y - c.height / 2) / 20];

let t = 0;
const anim = () => {
  requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);
  const mm = [z(1), z(0), div(exp(mul(i, z(t / 200))), z(20)), z(1)];
  const mym = mm;

  ctx.globalAlpha = 1;
  ctx.fillRect(...scr(mapp(mym)(mapp(minv(mym))(scrinv(mouse)))), 5, 5);
  ctx.fillRect(
    ...scr(mapp(mym)(add(z(1), mapp(minv(mym))(scrinv(mouse))))),
    5,
    5
  );
  ctx.fillRect(
    ...scr(mapp(mym)(add(z(0, 1), mapp(minv(mym))(scrinv(mouse))))),
    5,
    5
  );

  for (let x = -c.width; x < c.width; x += 20) {
    for (let y = -c.height; y < c.height; y += 20) {
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(...scr(mapp(mym)([x / 20, y / 20])));
      ctx.lineTo(...scr(mapp(mym)([(x + 20) / 20, y / 20])));
      ctx.moveTo(...scr(mapp(mym)([x / 20, y / 20])));
      ctx.lineTo(...scr(mapp(mym)([x / 20, (y + 20) / 20])));
      ctx.stroke();
    }
  }
  t++;
};
anim();

// complex exponential form test
const a = [1, -2];
const b = mul(z(abs(a)), exp(mul(i, z(arg(a)))));
console.log(div([10, 10], [3, -2]));
