// April 11 2026
// this has all the projective stuff
// it also has interpolation of projective transforms
// not a geodesic the lie group, but a custom one that I like

const mod = (a, n, nL = 0) =>
  ((((a - nL) % (n - nL)) + (n - nL)) % (n - nL)) + nL;
const subAngles = (theta1, theta2) =>
  mod(theta2 - theta1 + Math.PI, Math.PI * 2) - Math.PI;

const findMax = (ar) =>
  ar.reduce(
    ([maxv, maxi], cur, i) => (cur > maxv ? [cur, i] : [maxv, maxi]),
    [-Infinity, 0]
  )[1];

const sum = (vs) => vs.reduce((ac, n) => ac + n, 0);
const aprow = (r, v) => sum(r.map((rv, i) => rv * v[i]));
const ap = (m, v) => m.map((r) => aprow(r, v));

const dot = (v1, v2) => {
  if (v1.length !== v2.length) throw "dotting different length vectors";
  let sum = 0;
  for (let i = 0; i < v1.length; i++) sum += v1[i] * v2[i];
  return sum;
};
const sub = (as, bs) => as.map((_, i) => as[i] - bs[i]);
const smul = (n, as) => as.map((ai) => n * ai);
const angleOf = ([x, y]) => Math.atan2(y, x);
const add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];
const lerp = (start, end, t) => add(start, smul(t, sub(end, start)));

const row = (m, ri) => m[ri];
const col = (m, ci) => m.map((r) => r[ci]);
const rows = (mat) => mat;
const cols = (mat) => mat[0].map((_, i) => col(mat, i));

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
      m[y][x] = dot(row(m1, y), col(m2, x));
    }
  }
  return m;
};
const mmuls = (...ms) => ms.reduce(mmul, idm());

// ref: https://onecompiler.com/javascript/44fgk8nxt
function gaussianElimination(A, B) {
  const M = A.length; // Number of equations
  const N = A[0].length; // Number of variables

  // Combine the matrix A and the matrix B into an augmented matrix
  const augmentedMatrix = A.map((ai, i) => [...ai, ...B[i]]);

  // Perform Gaussian Elimination
  for (let col = 0; col < N; col++) {
    const maxRow =
      findMax(
        rows(augmentedMatrix.slice(col)).map((row) => Math.abs(row[col]))
      ) + col;

    if (maxRow !== col)
      // swap
      [augmentedMatrix[col], augmentedMatrix[maxRow]] = [
        augmentedMatrix[maxRow],
        augmentedMatrix[col],
      ];

    // eliminate other rows
    for (let i = 0; i < M; i++) {
      if (i !== col) {
        augmentedMatrix[i] = sub(
          augmentedMatrix[i],
          smul(
            augmentedMatrix[i][col] / augmentedMatrix[col][col],
            augmentedMatrix[col]
          )
        );
      }
    }
  }

  // divide gaussian'd B values by diagonal elements and return
  //
  // if for each row A part of augmented matrix is non-zero and B part is also non-zero:
  //  unique soln
  // if there is a row where A part is 0s and B part is not:
  //  no soln
  // if there is a row where A part is 0s and so is B part:
  //  infinite soln
  return augmentedMatrix.map((ai, i) => smul(1 / ai[i], ai.slice(N)));
}

const minv = (m) => gaussianElimination(m, idm());

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
  gaussianElimination(
    [
      [-3, -5, 36],
      [-1, 0, 7],
      [1, 1, -10],
    ],
    [[10], [5], [-4]]
  )
);

const nrm = ([x, y, z]) => [x / z, y / z, 1];
const dhp = ([x, y, z]) => ctx.fillRect(x / z, y / z, 2, 2);

let mouse = [0, 0, 1];
addEventListener("mousemove", (e) => {
  mouse = [e.offsetX, e.offsetY, 1];
});

const go = (p10, p01, p00, p11) => {
  const m = [
    [p00[0], p10[0], p01[0]],
    [p00[1], p10[1], p01[1]],
    [1, 1, 1],
  ];

  const a = gaussianElimination(m, [[p11[0]], [p11[1]], [1]]);

  return mmul(m, [
    [a[0][0], 0, 0],
    [0, a[1][0], 0],
    [0, 0, a[2][0]],
  ]);
};

const mFromPs = ([p10, p01, p00, p11]) => {
  // ref: https://math.stackexchange.com/questions/296794/finding-the-transform-matrix-from-4-projected-points-with-javascript
  // ainv maps from source locations to basis vectors
  const a = go([1, 0], [0, 1], [0, 0], [1, 1]);
  const ainv = minv(a);
  // b maps from basis vectors to dest locations
  const b = go(p10, p01, p00, p11);
  return mmul(b, ainv);
};
const psFromM = (m) => [
  nrm(ap(m, [1, 0, 1])),
  nrm(ap(m, [0, 1, 1])),
  nrm(ap(m, [0, 0, 1])),
  nrm(ap(m, [1, 1, 1])),
];

const avgP = (...ps) => [
  sum(ps.map(([x]) => x)) / ps.length,
  sum(ps.map(([x, y]) => y)) / ps.length,
];

const stats = (ps) => {
  const center = avgP(...ps);
  const relPs = ps.map((p) => sub(p, center));
  const angles = relPs.map(angleOf);
  return { center, angles };
};
const idealPs = [
  [1, 0],
  [0, 1],
  [0, 0],
  [1, 1],
];
const { angles: idealAngles } = stats(idealPs);

// TODO: avgAngle not yet correct, only works for right half of circle
const stats2 = (ps) => {
  const { center, angles } = stats(ps);
  const diffAs = angles.map((a, i) => subAngles(a, idealAngles[i]));
  const avgAngle = mod(sum(diffAs) / diffAs.length, 2 * Math.PI);
  return { center, avgAngle };
};

let t = 0;
draw();
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  const inPs = [
    [200, 100],
    [100, 200],
    [100, 100],
    [200, 200],
  ];

  let m = mFromPs(inPs);

  //const aa = gaussianElimination(m,mouse.map(v=>[v]))
  //const angle = Math.atan2(aa[1][0],aa[0][0])
  //m = mmuls(m, rotm(angle))

  let ps = psFromM(m);

  const { center: cp, avgAngle } = stats2(ps);
  const factorM = mmuls(rotm(avgAngle), transm(-cp[0], -cp[1]), m);
  const factorPs = psFromM(factorM);

  //const targetPs = [
  //[446.31,128.44,1],[539.98,390.54,1],[362.1,306.33,1],[624.19,312.66,1]
  //]
  const targetPs = inPs.map((p) =>
    ap(
      mmuls(
        transm(cp[0] + 100, cp[1] + 100),
        rotm(2.2),
        transm(-cp[0], -cp[1])
      ),
      [...p, 1]
    )
  );
  targetPs[3][1] += 30;

  let targetM = mFromPs(targetPs);
  let { center: tcp, avgAngle: ta } = stats2(targetPs);
  ta = ta;
  const targetFactorM = mmuls(rotm(ta), transm(-tcp[0], -tcp[1]), targetM);
  const targetFactorPs = psFromM(targetFactorM);

  const tt = (t / 200) % 1;
  const lps = factorPs.map((p, i) => lerp(p, targetFactorPs[i], tt));
  const la = avgAngle + subAngles(avgAngle, ta) * tt;
  const lcp = lerp(cp, tcp, tt);

  ctx.fillText(tt.toFixed(2), 10, 10);
  ctx.fillText(ta.toFixed(2), 10, 20);

  //m = m.map((r,y)=>r.map((e,x)=>e + (targetM[y][x]-e)*tt))
  //m = mmuls(transm(lcp[0],lcp[1]),rotm(-la),mFromPs(lps))
  m = mFromPs(inPs.map((p, i) => [...lerp(p, targetPs[i], tt), 1]));

  ps = psFromM(m);

  for (let x = -70; x < 70; x += 1) {
    for (let y = -70; y < 70; y += 1) {
      ctx.beginPath();
      const gg = nrm(ap(m, [x, y, 1]));
      dhp(ap(m, [x, y, 1]));
    }
  }

  ctx.save();
  ctx.fillStyle = "red";
  ps.forEach((p) => ctx.fillRect(...p.slice(0, 2), 10, 10));
  ctx.fillStyle = "blue";
  inPs.forEach((p) => ctx.fillRect(...p.slice(0, 2), 10, 10));
  ctx.fillStyle = "green";
  targetPs.forEach((p) => ctx.fillRect(...p.slice(0, 2), 10, 10));
  ctx.restore();

  t += 1;
}
