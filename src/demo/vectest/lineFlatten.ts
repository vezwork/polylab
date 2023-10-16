import { lerp, segXProj } from "../../lib/math/Line2.js";
import { Vec2 } from "../../lib/math/Vec2.js";
import { historyArray } from "../../lib/structure/Iterable.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d") as CanvasRenderingContext2D;

const mouse: [number, number] = [0, 0];
let mousedown = false;

const path: Vec2[] = [];

c.addEventListener("mousemove", (e) => {
  mouse[0] = e.offsetX;
  mouse[1] = e.offsetY;
});
c.addEventListener("mousedown", (e) => {
  mousedown = true;
});
c.addEventListener("mouseup", (e) => {
  mousedown = false;
});

function draw() {
  ctx.clearRect(0, 0, c.width, c.height);

  if (mousedown) path.push([...mouse]);

  ctx.beginPath();
  ctx.lineWidth = 4;
  if (path[0]) ctx.moveTo(...path[0]);
  for (const [next, cur, prev] of historyArray(path, 3)) {
    if (cur) ctx.lineTo(...cur);
    if (next && cur && prev) {
      const neighborAvg = lerp([next, prev])(0.5);
      const to = lerp([cur, neighborAvg])(1.9);
      cur[0] = to[0];
      cur[1] = to[1];
    }
  }
  ctx.stroke();

  ctx.fillStyle = "red";
  ctx.fillRect(...mouse, 10, 10);

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
