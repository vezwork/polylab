import {
  d,
  put,
  draw,
  xStack,
  above,
  beside,
  yStack,
  toEq,
  group,
  add,
  sub,
  eq,
} from "./ex/algaelib.js";

const make = (color = "red", isGroup) => {
  const dd = d((x, x2, y, y2, ob) => {
    ctx.save();
    ctx.beginPath();
    if (isGroup) ctx.setLineDash([10, 10]);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.rect(x, y, x2 - x, y2 - y);
    if (isGroup) ctx.stroke();
    if (!isGroup) ctx.fill();
    ctx.restore();
  }, !isGroup);
  if (!isGroup) {
    put(dd.w)(100);
    put(dd.h)(Math.random() * 350);
  }
  return dd;
};
const dOutline = (g) => {
  const dgd = make("black", true);
  eq(dgd.x, g.x);
  eq(dgd.y, g.y);
  eq(dgd.x2, g.x2);
  eq(dgd.y2, g.y2);
  return dgd;
};

const origin = [150, 150];
ctx.translate(...origin);

// STARTs OF DRAWING GRID
ctx.strokeStyle = "black";
ctx.beginPath();
ctx.moveTo(-origin[0], 0);
ctx.lineTo(c.width - origin[0], 0);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(0, -origin[1]);
ctx.lineTo(0, c.height - origin[1]);
ctx.stroke();

ctx.strokeStyle = "LightGray";
ctx.beginPath();
for (let x = -origin[0]; x < c.width - origin[0]; x += 50) {
  ctx.moveTo(x, -origin[1]);
  ctx.lineTo(x, c.height - origin[1]);
}
for (let y = -origin[1]; y < c.height - origin[1]; y += 50) {
  ctx.moveTo(-origin[0], y);
  ctx.lineTo(c.width - origin[0], y);
}
ctx.stroke();
// END OF DRAWING GRID

const dd = make("orange");
const dd2 = make("purple");
const dd3 = make("crimson");
const dd4 = make("cornflowerblue");

dOutline(xStack(dd, dd2));

const g = group(dd, dd2);
above(g, dd4);
const dy = yStack(g, dd3);

put(dd4.y)(200);
put(dd4.x)(200);

put(g.x)(0);
//put(g.y)(0);

draw();
