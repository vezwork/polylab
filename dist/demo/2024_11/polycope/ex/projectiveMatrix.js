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
  ctx.clearRect(0, 0, c.width, c.height);

  //const m = [[10*cos(t),-10*sin(t),-10],
  //[10*sin(t),10*cos(t),-10],
  //[0.02,0.02,1]]
  const m = mmuls(transm(220), perspm(0.01), rotm(t), transm(-10), scalem(20));

  for (let x = -150; x < 150; x += 2) {
    for (let y = -150; y < 150; y += 2) {
      dhp(ap(m, [x, y, 1]));
    }
  }

  t += 0.01;
}
