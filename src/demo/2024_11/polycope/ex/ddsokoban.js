const level = [
  [0, 0, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 0, 0, 0, 1, 0],
  [1, 0, 3, 2, 0, 0, 1, 0],
  [1, 1, 1, 0, 2, 0, 1, 0],
  [1, 0, 1, 1, 2, 0, 1, 0],
  [1, 0, 1, 0, 0, 0, 1, 1],
  [1, 2, 0, 2, 2, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

const p = [2, 2];
const bs = [
  [2, 3],
  [3, 4],
  [4, 4],
  [6, 1],
  [6, 3],
  [6, 4],
  [6, 5],
];
let s = { p, bs, level };

const g = {
  0: "transparent",
  1: "black",
  2: "brown",
  3: "cornflowerblue",
};
const goals = [
  [2, 1],
  [3, 5],
  [4, 1],
  [5, 4],
  [6, 3],
  [6, 6],
  [7, 4],
];

const SZ = 40;

function draw({ level }) {
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "pink";
  for (const [y, x] of goals)
    ctx.fillRect(x * SZ + SZ / 3, y * SZ + SZ / 3, SZ / 3, SZ / 3);
  for (let y = 0; y < level.length; y++) {
    const row = level[y];
    for (let x = 0; x < row.length; x++) {
      const block = row[x];
      ctx.fillStyle = g[block];
      ctx.fillRect(x * SZ, y * SZ, SZ, SZ);
    }
  }
}
draw(s);

const moveP = (s, [dy, dx]) => {
  let newS = structuredClone(s);
  let { level, p } = newS;

  if (level[p[0] + dy][p[1] + dx] === 1) return false;
  if (level[p[0] + dy][p[1] + dx] === 2) {
    const nnewS = moveB(s, [p[0] + dy, p[1] + dx], [dy, dx]);
    if (!nnewS) return false;
    newS = nnewS;
    level = newS.level;
    p = newS.p;
  }

  level[p[0]][p[1]] = 0;
  level[p[0] + dy][p[1] + dx] = 3;

  newS.p = [p[0] + dy, p[1] + dx];

  return newS;
};
const moveB = (s, p, [dy, dx]) => {
  const newS = structuredClone(s);
  const { level, bs } = newS;

  if (level[p[0] + dy][p[1] + dx] !== 0) return false;
  const i = getB(newS, p);
  level[p[0]][p[1]] = 0;
  level[p[0] + dy][p[1] + dx] = 2;
  bs[i] = [p[0] + dy, p[1] + dx];
  return newS;
};
const getB = ({ bs }, p) => bs.findIndex(([y, x]) => y === p[0] && x === p[1]);

const pick = ([x, y]) => [Math.floor(y / SZ), Math.floor(x / SZ)];

const ser = (s) => JSON.stringify(s);
const unser = (str) => JSON.parse(str);

const setMapAdd = (setMap, key, value) => {
  if (!setMap.has(key)) setMap.set(key, new Set());
  setMap.get(key).add(value);
};
const buildStateGraph = (s) => {
  const graph = new Map();

  const next = [s];
  let i = 0;
  while (next.length > 0 && i < 1000) {
    i++;
    const now = next.pop();
    const cur = structuredClone(now);
    const sercur = ser(cur);

    const go = (dir) => {
      const a = moveP(cur, dir);
      if (!a) return;
      const sera = ser(a);
      setMapAdd(graph, sercur, sera);
      if (!graph.has(sera)) next.push(a);
    };
    go([0, -1]);
    go([0, 1]);
    go([1, 0]);
    go([-1, 0]);
  }
  return graph;
};
const bfs = (s, pred = () => false) => {
  const path = new Map();
  path.set(ser(s), []);

  const next = [s];
  let i = 0;
  while (next.length > 0 && i < 3000) {
    i++;
    const now = next.pop();
    const cur = structuredClone(now);
    const sercur = ser(cur);
    if (pred(now)) return path.get(sercur);

    const go = (dir) => {
      const a = moveP(cur, dir);
      if (!a) return;
      const sera = ser(a);
      if (!path.has(sera)) {
        path.set(sera, [...path.get(sercur), dir]);
        next.unshift(a);
      }
    };
    go([0, -1]);
    go([0, 1]);
    go([1, 0]);
    go([-1, 0]);
  }
  return false;
};

//const graph = bfs(s)
//console.log(graph)

addEventListener("keydown", (e) => {
  e.preventDefault();
  if (e.key === "ArrowLeft") s = moveP(s, [0, -1]) || s;
  if (e.key === "ArrowRight") s = moveP(s, [0, 1]) || s;
  if (e.key === "ArrowUp") s = moveP(s, [-1, 0]) || s;
  if (e.key === "ArrowDown") s = moveP(s, [1, 0]) || s;
  draw(s);
});
let drag = null;
addEventListener("mousedown", (e) => {
  drag = pick([e.offsetX, e.offsetY]);
  ctx.beginPath();
  ctx.rect(drag[1] * SZ, drag[0] * SZ, SZ, SZ);
  ctx.stroke();
});
addEventListener("mouseup", (e) => {
  const v = s.level[drag[0]][drag[1]];
  const ep = pick([e.offsetX, e.offsetY]);
  if (v === 3) {
    //player
    const dirs = bfs(s, (cs) => cs.level[ep[0]][ep[1]] === 3);
    if (dirs) a(dirs);
  }
  if (v === 2) {
    const i = getB(s, drag);
    const dirs = bfs(s, (cs) => getB(cs, ep) === i);
    if (dirs) a(dirs);
  }

  if (s.p[0] === drag[0] && s.p[1] === drag[1]) {
    //player
  }
  //console.log(drag, )
  //   bfs(s, (cs)=>)
});

//const ii = graph.keys()
function a(dirs) {
  let i = 0;
  function go() {
    if (i < dirs.length) setTimeout(() => requestAnimationFrame(go), 100);

    const dir = dirs[i];
    if (!dir) return;
    s = moveP(s, dir) || s;
    draw(s);

    i++;
  }

  requestAnimationFrame(go);
}
//a()
c.style.cursor = "grab";
