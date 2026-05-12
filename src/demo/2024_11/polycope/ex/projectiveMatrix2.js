const sum = (vs) => vs.reduce((ac, n) => ac + n, 0);
const aprow = (r, v) => sum(r.map((rv, i) => rv * v[i]));
const ap = (m, v) => m.map((r) => aprow(r, v));

const dot = (v1, v2) => {
  if (v1.length !== v2.length) throw "dotting different length vectors";
  let sum = 0;
  for (let i = 0; i < v1.length; i++) sum += v1[i] * v2[i];
  return sum;
};

const mrow = (m, ri) => m[ri];
const mcol = (m, ci) => m.map((r) => r[ci]);

const idm = () => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const mmul = (m1, m2) => {
  let m = [];
  for (let y = 0; y < m1.length; y++) {
    m[y] = [];
    for (let x = 0; x < m2[0].length; x++) {
      m[y][x] = dot(mrow(m1, y), mcol(m2, x));
    }
  }
  return m;
};
const mmuls = (...ms) => ms.reduce(mmul, idm());

const cos = Math.cos;
const sin = Math.sin;

const rotm = (t) => [
  [cos(t), -sin(t), 0],
  [sin(t), cos(t), 0],
  [0, 0, 1],
];
const scalem = (x, y = x) => [
  [x, 0, 0],
  [0, y, 0],
  [0, 0, 1],
];
const transm = (x, y = x) => [
  [1, 0, x],
  [0, 1, y],
  [0, 0, 1],
];
const perspm = (x, y = x) => [
  [1, 0, 0],
  [0, 1, 0],
  [x, y, 1],
];

console.log(
  mmul(
    [
      [2, -1],
      [4, 9],
    ],
    [
      [3, 4],
      [5, 6],
    ]
  )
);

const dhp = ([x, y, z]) => ctx.fillRect(x / z, y / z, 3, 3);

let t = 0;
draw();
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, 400);

  //const m = mmuls(transm(220),perspm(0.01),rotm(t),transm(-10),scalem(20))
  const r = 3;
  const g = 1 / r;
  const h = 1 / r;
  const pi0 = [200, 100];
  const pi1 = [100, 200];
  const m = [
    [pi0[0] * g, pi1[0] * h, 100],
    [pi0[1] * g, pi1[1] * h, 100],
    [g, h, 1],
  ];

  for (let x = -0; x < 100; x += 1) {
    for (let y = -0; y < 100; y += 1) {
      dhp(ap(m, [x, y, 1]));
    }
  }

  ctx.save();
  ctx.fillStyle = "red";
  ctx.fillText(g.toFixed(2), 10, 10);

  //ctx.strokeStyle='red'
  //const p = ap(m,[1,1,1])
  //ctx.lineTo(p[0]/p[2],p[1]/p[2])
  //ctx.stroke()
  dhp(ap(m, [1, 1, 1]));
  const q = ap(m, [1, 1, 1]);
  const p = ap(m, [10000, 10000, 1]);
  //console.log((q[0]/q[2] - 100) / (p[0]/p[2] - 100), 2/(r+2))
  console.log(q[0] / q[2] / (q[1] / q[2]));

  ctx.fillRect(100, 100, 10, 10);
  ctx.fillRect(...pi0, 10, 10);
  ctx.fillRect(...pi1, 10, 10);
  ctx.restore();

  t += 1;
}
