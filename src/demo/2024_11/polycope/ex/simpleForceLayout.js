const smul = (n, [x, y]) => [n * x, n * y];
const len = ([x, y]) => (x ** 2 + y ** 2) ** (1 / 2);
const unit = (p) => smul(1 / len(p), p);
const add = ([x, y], [p, q]) => [x + p, y + q];
const sub = ([x, y], [p, q]) => [x - p, y - q];
const dist = (p, q) => len(sub(p, q));
const set = (p, [x, y]) => {
  p[0] = x;
  p[1] = y;
};

const mid = [c.width / 2, c.height / 2];

const p = [
  [300, 300],
  [310, 310],
  [320, 300],
  [400, 400],
];
const e = new Map();
const adde = (p1, p2) => {
  e.set(p1, [...(e.get(p1) ?? []), p2]);
  e.set(p2, [...(e.get(p2) ?? []), p1]);
};
adde(p[0], p[1]);
adde(p[1], p[2]);
adde(p[0], p[2]);
const cycle = (n) => {
  const newps = [];
  for (let i = 0; i < n; i++) {
    const np = [Math.random(), Math.random()];
    const pp = newps.at(i - 1);
    p.push(np);
    newps[i] = np;
    if (pp) adde(np, pp);
  }
  adde(newps[0], newps.at(-1));
  return newps;
};
adde(cycle(5)[0], p[0]);
adde(cycle(6)[0], p[0]);
addEventListener("mousedown", (e) => {
  const np = [e.offsetX, e.offsetY];
  for (const q of p) if (dist(q, np) < 30) adde(np, q);
  p.push(np);
});

requestAnimationFrame(draw);
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  let forces = p.map((p) => [0, 0]);
  for (let i = 0; i < p.length; i++) {
    for (let j = i + 1; j < p.length; j++) {
      const dir = unit(sub(p[i], p[j]));
      const v = (1 / dist(p[i], p[j])) ** (1 / 2.5);
      const f = smul(v, dir);
      forces[i] = add(forces[i], f);
      forces[j] = sub(forces[j], f);
    }
    const nxt = e.get(p[i]) ?? [];
    nxt.forEach((q) => {
      const dir = unit(sub(q, p[i]));
      const v = (dist(p[i], q) / 100) ** 3;
      forces[i] = add(forces[i], smul(v, dir));
    });
    forces[i] = add(forces[i], smul(1 / 30, sub(mid, p[i])));
  }

  forces.forEach((f, i) => set(p[i], add(p[i], f)));

  for (const [s, ss] of e) {
    for (const q of ss) {
      ctx.beginPath();
      ctx.moveTo(...s);
      ctx.lineTo(...q);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "white";
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "black";
      ctx.stroke();
    }
  }

  for (const [x, y] of p) ctx.fillRect(x - 3, y - 3, 6, 6);
}
