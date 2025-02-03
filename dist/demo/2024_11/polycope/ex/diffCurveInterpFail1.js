import {
  add,
  sub,
  mul,
  distance,
  length,
  angleBetween,
  fromPolar,
  lerp,
  normalize,
  rotateQuarterYX,
  setLength,
  rejecta,
  coLerp,
} from "../../../lib/math/Vec2.js";

const π = Math.PI;
const LINE_L = 800;
const LINK_DIST = 130;
const R = 8;

function drawCircle(p, r) {
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], r, r, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();
}

function diffCurve(I, L, init, ...cs) {
  const res = [];
  let p = [...init];
  let s = [...cs];
  for (let i = 0; i < I; i++) {
    res.push([...p]);
    p[0] += Math.cos(s[0]) * L;
    p[1] += Math.sin(s[0]) * L;

    for (let j = 0; j < s.length - 1; j++) {
      s[j] += s[j + 1];
    }
  }
  return res;
}

function drawLine(ps) {
  if (ps.length === 0) return;
  ctx.beginPath(); // Start a new path
  ctx.moveTo(...ps[0]);
  ps.map((p) => ctx.lineTo(...p));
  ctx.stroke(); // Render the path
  return ps;
}

function drawDiffCurve(LINK_DIST, init, ...cs) {
  return drawLine(diffCurve(LINE_L / LINK_DIST, LINK_DIST, init, ...cs));
}

const ps = [
  [150, 30],
  [190, 70],
  [620, 170],
];

// linkage stuff
const set = (p, v, dir = 0) => {
  p[0] = v[0];
  p[1] = v[1];

  const i = ps.indexOf(p);
  const pp = ps[i - 1];
  if (dir <= 0 && pp) {
    let θ = angleBetween(p, pp);
    const npp = add(p, fromPolar(LINK_DIST, θ));
    pp[0] = npp[0];
    pp[1] = npp[1];
    set(pp, npp, -1);
  }
  const np = ps[i + 1];
  if (dir >= 0 && np) {
    let θ = angleBetween(p, np);
    const nnp = add(p, fromPolar(LINK_DIST, θ));
    set(np, nnp, 1);
  }
};
set(ps[0], ps[0]);

let m = [0, 0];
let grabbing = false;
c.addEventListener("mousemove", (e) => {
  m = [e.offsetX, e.offsetY];
  if (grabbing) set(grabbing, m);
});
c.addEventListener("mousedown", (e) => {
  for (const p of ps) {
    if (distance(m, p) < R) {
      grabbing = p;
      return;
    }
  }
  ps.push([...m]);
  set(ps.at(-1), ps.at(-1));
});
c.addEventListener("mouseup", (e) => {
  grabbing = false;
});

const diffThings = (ps) => {
  const cs = [];
  for (let i = 0; i < ps.length - 1; i++)
    cs[i] = angleBetween(ps[i], ps[i + 1]);

  const r = [cs];
  while (r.at(-1).length > 1) {
    const diffs = [];
    for (let i = 0; i < r.at(-1).length - 1; i++)
      diffs[i] = r.at(-1)[i + 1] - r.at(-1)[i];
    r.push(diffs);
  }
  return r;
};

function go(start, end) {
  const nv = sub(end, start);
  const nvperp = rotateQuarterYX(nv);

  return ps.map((p) => {
    const base = lerp(start, end, coLerp(ps[0], ps.at(-1), p));
    const r = rejecta(ps[0], ps.at(-1), p);
    const lr = length(r);
    const rat =
      lr === 0 ? 0 : length(r) / distance(ps.at(-1), ps[0]) / (ps.length - 1);
    const v = mul(rat, nvperp);
    return add(base, v);
  });
}

function diffCurveFromPs(ps) {
  const r = diffThings(ps);
  return diffCurve(
    LINE_L / distance(ps[0], ps[1]),
    distance(ps[0], ps[1]),
    [...ps[0]],
    ...r.map((diff) => diff[0])
  );
}

function drawDiffCurveFromPs(ps) {
  //return drawLine(diffCurveFromPs(ps))
  const r = diffThings(ps);
  drawDiffCurve(
    distance(ps[0], ps[1]),
    [...ps[0]],
    ...r.map((diff) => diff[0])
  );
  return r;
}

function cr(ps) {
  const r = diffThings(ps);

  const m = lerp(ps[0], ps[1], 0.5);
  const perp = rotateQuarterYX(sub(ps[1], ps[0]));
  // https://math.stackexchange.com/questions/272151
  const a = LINK_DIST;
  const h = (a * Math.tan(r[1][0] / 4)) / 2;
  const b = Math.sqrt((a / 2) ** 2 + h ** 2);
  const sperp = setLength(h, perp);

  return [ps[0], add(m, sperp), ps[1]];
}

const F = 0.0003;
draw();
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  const r = diffThings(ps);
  const blackLine = diffCurve(
    LINE_L / LINK_DIST,
    LINK_DIST,
    ps[0],
    ...r.map((diff) => diff[0])
  );

  ctx.strokeStyle = "crimson";
  ctx.fillStyle = "crimson";

  const cr1 = cr(ps);
  drawCircle(cr1[1], 3);
  const crl1 = diffCurveFromPs(cr1);

  const cr2 = cr(blackLine.slice(1, 1 + ps.length));
  drawCircle(cr2[1], 3);
  const crl2 = diffCurveFromPs(cr2);

  ctx.strokeStyle = "limegreen";
  ctx.fillStyle = "limegreen";

  const smoothedP = lerp(crl1[3], crl2[1], 0.5);
  drawCircle(smoothedP, 3);
  drawDiffCurveFromPs([crl1[0], crl1[1], crl1[2], smoothedP, crl2[2]]);

  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  for (const p of ps) drawCircle(p, R);
}
