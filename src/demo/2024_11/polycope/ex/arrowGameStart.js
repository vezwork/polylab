import {
  sub,
  angleOf,
  fromPolar,
  add,
  angleBetween,
  length,
  setLength,
  lerp,
  distance,
} from "../../../lib/math/Vec2.js";
import { subAngles } from "../../../lib/math/Number.js";

const dpr = window.devicePixelRatio;
const h = c.height;
const w = c.width;
c.width = w * dpr;
c.height = h * dpr;
c.style.width = w + "px";
c.style.height = h + "px";
ctx.scale(dpr, dpr);

const drawArrow = (ctx, from, to, label) => {
  const headlen = 10;

  const angle = angleBetween(from, to);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(...from);
  ctx.lineTo(...to);
  ctx.lineTo(...sub(to, fromPolar(headlen, angle - Math.PI / 6)));
  ctx.moveTo(...to);
  ctx.lineTo(...sub(to, fromPolar(headlen, angle + Math.PI / 6)));
  ctx.stroke();

  const arrowVec = sub(to, from);
  const l = length(arrowVec);
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = "bold 20px sans-serif";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 5;
  ctx.strokeText(label, ...add(from, setLength(l / 2 + 10, arrowVec)));
  ctx.fillStyle = "black";
  ctx.fillText(label, ...add(from, setLength(l / 2 + 10, arrowVec)));
  ctx.restore();
};

const drawCirc = (r, x, y) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fill();
};

class Dot {
  r = 0;
  s = 1;
  to = new Map();
  constructor(...p) {
    this.p = p;
  }
  setR(newR) {
    this.r = newR;
    return this;
  }
  setS(newS) {
    this.s = newS;
    return this;
  }
}
const dot = (...p) => new Dot(...p);
const labelDict = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  d: "p",
  Z: "N",
  M: "W",
};
const line = (d1, d2, name) => {
  d1.to.set(name, d2);
};

class Level {
  player = { dot: null, p: null };
  constructor(...dots) {
    this.dots = dots;
    if (dots.length > 0) {
      this.player.dot = dots[0];
      this.player.p = dots[0].p;
    }
  }
}

const l2 = () => {
  const l = new Level();
  const map = [[], [], [], [], [], [], []];
  for (let x = 0; x < map.length; x++) {
    for (let y = 0; y < map.length; y++) {
      const d = dot((x - 3) * 100, (y - 3) * 100).setS(
        1.2 ** distance([x, y], [3, 3])
      );
      map[x][y] = d;
      l.dots.push(d);
    }
  }
  l.player.dot = map[3][3];
  l.player.p = map[3][3].p;

  for (let x = 0; x < 7; x++)
    for (let y = 1; y < 4; y++) line(map[x][y], map[x][y - 1], "ArrowUp");
  for (let x = 0; x < 7; x++)
    for (let y = 3; y < 6; y++) line(map[x][y], map[x][y + 1], "ArrowDown");
  for (let x = 1; x < 4; x++)
    for (let y = 0; y < 7; y++) line(map[x][y], map[x - 1][y], "ArrowLeft");
  for (let x = 3; x < 6; x++)
    for (let y = 0; y < 7; y++) line(map[x][y], map[x + 1][y], "ArrowRight");

  l.win = (level) => length(l.player.p) > length(map[0][0].p) - 0.01;
  l.to = () => l0();

  return l;
};

const level1 = () => {
  const level1 = new Level(
    dot(230, 110),
    dot(120, 120),
    dot(120, 220).setS(1.2),
    dot(200, 220).setS(1.2 ** 2),
    dot(300, 220).setS(1.2 ** 3),
    dot(400, 220).setS(1.2 ** 4)
  );
  line(level1.dots[0], level1.dots[1], "a");
  line(level1.dots[1], level1.dots[2], "a");
  line(level1.dots[2], level1.dots[1], "a");
  line(level1.dots[2], level1.dots[3], "z");
  line(level1.dots[3], level1.dots[4], "z");
  line(level1.dots[4], level1.dots[5], "z");
  line(level1.dots[5], level1.dots[0], "1");

  level1.win = (level) => distance(level.player.p, level.dots[1].p) < 0.01;
  level1.to = () => l2();

  return level1;
};

const l0 = () => {
  const l = new Level(
    dot(120, 120),
    dot(220, 120).setR(-Math.PI / 4),
    dot(220, 220).setR(-Math.PI / 2),
    dot(120, 220).setR((-Math.PI * 3) / 4),
    dot(0, 0).setS(1.2).setR(Math.PI),
    dot(120, 120).setR(Math.PI)
  );
  line(l.dots[0], l.dots[1], "A");
  line(l.dots[1], l.dots[2], "o");
  line(l.dots[2], l.dots[3], "Z");
  line(l.dots[3], l.dots[5], "o");
  line(l.dots[5], l.dots[4], "M");
  line(l.dots[0], l.dots[4], "M");
  line(l.dots[5], l.dots[1], "A");
  l.win = (level) => {
    ctx.save();
    ctx.font = "bold 50px serif";
    ctx.globalAlpha = 1 / (distance(level.player.p, level.dots[0].p) + 1);
    if (level.player.dot !== level.dots[5]) {
      ctx.fillText("thinking", 30, -50);
    } else {
      ctx.scale(-1, -1);
      ctx.fillText("thinking", -230, 80);
      ctx.scale(-1, -1);
    }
    ctx.rotate(Math.PI / 2);
    ctx.globalAlpha = 1 / (distance(level.player.p, level.dots[1].p) + 1);
    ctx.fillText("around", 30, -275);
    ctx.rotate(Math.PI / 2);
    ctx.globalAlpha = 1 / (distance(level.player.p, level.dots[2].p) + 1);
    ctx.fillText("the", -160, -275);
    ctx.rotate(Math.PI / 2);
    ctx.globalAlpha = 1 / (distance(level.player.p, level.dots[3].p) + 1);
    ctx.fillText("box", -150, -50);
    ctx.restore();
    return distance(level.player.p, level.dots[4].p) < 0.01;
  };
  l.to = () => level1();

  return l;
};

const l00 = () => {
  const l = new Level(
    dot(0, 0),
    dot(100, 0),
    dot(200, 0),
    dot(300, 0),
    dot(400, 0),
    dot(500, 0)
  );
  line(l.dots[0], l.dots[1], "h");
  line(l.dots[1], l.dots[2], "e");
  line(l.dots[2], l.dots[3], "l");
  line(l.dots[3], l.dots[4], "l");
  line(l.dots[4], l.dots[5], "o");
  l.win = (level) => {
    return distance(level.player.p, level.dots[5].p) < 0.01;
  };
  l.to = () => l0();

  return l;
};

let level = l00();
let camera = { p: level.player.p, r: 0, s: 1 };

addEventListener("keydown", (e) => {
  e.preventDefault();
  level.player.dot = level.player.dot.to.get(e.key) ?? level.player.dot;
});

requestAnimationFrame(draw);
let t = -1;
function draw() {
  t++;
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.save();
  ctx.translate(...sub([350, 350], camera.p));
  ctx.translate(...camera.p);
  ctx.rotate(camera.r);
  ctx.scale(camera.s, camera.s);
  ctx.translate(...sub([0, 0], camera.p));

  const a = subAngles(camera.r, level.player.dot.r);
  camera.r += a / 15;
  camera.s = 0.95 * camera.s + 0.05 * level.player.dot.s;
  camera.p = lerp(camera.p, level.player.dot.p, 0.05);

  if (level.win?.(level)) {
    level = level.to();
    camera = { p: level.player.p, r: 0, s: 1 };
  }

  for (const from of level.dots) {
    for (const [name, to] of from.to) {
      const arrowVec = sub(to.p, from.p);
      const l = length(arrowVec);
      drawArrow(
        ctx,
        from.p,
        add(from.p, setLength(l - 20, arrowVec)),
        labelDict[name] ?? name
      );
    }
  }

  ctx.save();
  //  ctx.shadowColor = "black";
  //  ctx.shadowOffsetY = 1;
  //  ctx.shadowBlur = 15;
  ctx.fillStyle = "#fafafa";
  for (const dot of level.dots) {
    drawCirc(16, ...dot.p);
  }
  ctx.restore();

  ctx.fillStyle = "pink";
  drawCirc(8, ...level.player.p);
  level.player.p = lerp(level.player.p, level.player.dot.p, 0.1);

  ctx.save();
  ctx.resetTransform();
  ctx.scale(2, 2);
  //ctx.filter = 'blur(40px)'
  //ctx.drawImage(c,0,0)
  ctx.restore();

  //  ctx.save();
  //  ctx.resetTransform()
  //  const S = c.height/2+240
  //  ctx.clearRect(0,S,c.width,c.height-S)
  //  const H = 3
  //  for(let i = 0; i < c.height-S; i += H) {
  //    let a = Math.sin((i+t)/70) * i/20
  //    ctx.globalAlpha = i/(c.height-S)/2
  //    ctx.drawImage(c,
  //                0,S-i, c.width,H,
  //                0,S+i, c.width,H);
  //  }
  //  ctx.restore()

  ctx.restore();
}
