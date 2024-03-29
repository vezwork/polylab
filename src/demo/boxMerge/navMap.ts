import { isPointInside, positive, XYWH } from "../../lib/math/XYWH.js";
import { horizontalNavMaps } from "./space.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d") as CanvasRenderingContext2D;

const mouse: [number, number] = [0, 0];
let isMouseDown = false;
let isMouseRightDown = false;

let boxes: XYWH[] = [];
let curCreateBox: XYWH | null = null;

document.getElementById("reset")?.addEventListener("click", () => (boxes = []));

c.addEventListener("mousemove", (e) => {
  mouse[0] = e.offsetX;
  mouse[1] = e.offsetY;
});
c.addEventListener("mousedown", (e) => {
  if (e.button === 0) isMouseDown = true;
  else isMouseRightDown = true;
});
c.addEventListener("mouseup", (e) => {
  if (e.button === 0) isMouseDown = false;
  else isMouseRightDown = false;
});

function draw() {
  ctx.clearRect(0, 0, c.width, c.height);

  if (isMouseDown) {
    if (!curCreateBox) {
      curCreateBox = [...mouse, 0, 0] as XYWH;
    } else {
      curCreateBox[2] = mouse[0] - curCreateBox[0];
      curCreateBox[3] = mouse[1] - curCreateBox[1];
      curCreateBox = positive(curCreateBox);
    }
  } else {
    if (curCreateBox) {
      boxes.push(curCreateBox);
      curCreateBox = null;
    }
  }

  if (isMouseRightDown)
    boxes = boxes.filter((box) => !isPointInside(mouse, box));

  const nav = horizontalNavMaps(
    boxes.map(([x, y, w, h]) => ({
      top: y,
      bottom: y + h,
      x: x + w,
      xL: x, // not necessary for horizontalNavMaps, just passing data along
    }))
  );

  const ls = [...nav.lines()];
  // for (const start of starts) {
  //   ctx.fillStyle = "green";
  //   ctx.fillRect(start.x - 10, start.top - 10, 10, 10);
  //   ctx.fillStyle = "black";
  // }

  for (const box of boxes) ctx.fillRect(...box);

  for (const l of ls) {
    ctx.strokeStyle = "#79DEED";
    ctx.beginPath();
    for (const b of l) {
      ctx.lineTo(b.x, b.bottom);
    }
    if (l[l.length - 1].x > c.width - 80)
      ctx.lineTo(c.width, l[l.length - 1].bottom);
    ctx.stroke();
  }
  // for (const [fromBox, toBox] of fromNav) {
  //   //const myL = ls.findIndex((l) => l.includes(fromBox));
  //   ctx.strokeStyle = "#79DEED";
  //   ctx.beginPath();
  //   ctx.moveTo(fromBox.x, fromBox.top);
  //   //ctx.fillText(myL, fromBox.x, fromBox.top);
  //   ctx.lineTo(toBox.x, toBox.top);
  //   ctx.stroke();
  // }

  if (curCreateBox) ctx.fillRect(...curCreateBox);

  ctx.fillRect(...mouse, 5, 5);

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
