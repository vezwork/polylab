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
  Ob,
  map,
  set,
} from "./ex/algaelib.js";
import {
  lerp,
  angleOf,
  sub as vsub,
  fromPolar,
} from "../../../lib/math/Vec2.js";

//https://stackoverflow.com/a/6333775
export function drawArrow(context, from, to) {
  const headlen = 14; // length of head in pixels
  const d = vsub(to, from);
  const angle = angleOf(d);
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(...from);
  context.lineTo(...to);
  context.lineTo(...vsub(to, fromPolar(headlen, angle - Math.PI / 6)));
  context.moveTo(...to);
  context.lineTo(...vsub(to, fromPolar(headlen, angle + Math.PI / 6)));
  context.stroke();
}

const boxD = (color = "red", isGroup) => {
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
const outlineD = (g) => {
  const dgd = boxD("black", true);
  eq(dgd.x, g.x);
  eq(dgd.y, g.y);
  eq(dgd.x2, g.x2);
  eq(dgd.y2, g.y2);
  return dgd;
};

const origin = [150, 150];
ctx.translate(...origin);

// START OF DRAWING GRID

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

ctx.strokeStyle = "gray";
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(-origin[0], 0);
ctx.lineTo(c.width - origin[0], 0);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(0, -origin[1]);
ctx.lineTo(0, c.height - origin[1]);
ctx.stroke();
// END OF DRAWING GRID

// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
// https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
const measureWidth = (str, fontSize) => {
  //ctx.textBaseline = "alphabetic";
  ctx.font = `${fontSize}px monospace`;
  const measure = ctx.measureText(str);
  return [str, fontSize, measure.width + 4, measure.fontBoundingBoxAscent];
};
const textD = (str, fontSize) => {
  const m = measureWidth(str, fontSize);
  const dd = d((x, x2, y, y2) => {
    ctx.textBaseline = "top";
    ctx.font = `${fontSize}px monospace`;
    ctx.fillText(str, x, y);
  });
  put(dd.w)(m[2]);
  put(dd.h)(m[3]);
  return dd;
};

const imageD = (url) => {
  const img = new Image();
  img.src = url;

  const dd = d((x, x2, y, y2) => {
    ctx.drawImage(img, x, y);
  });

  return new Promise((resolve) =>
    img.addEventListener("load", (e) => {
      put(dd.w)(img.width);
      put(dd.h)(img.height);
      resolve(dd);
    })
  );
};

const lineD = (...ps) => {
  const w = Math.max(...ps.map((p) => p[0]));
  const h = Math.max(...ps.map((p) => p[1]));

  const dd = d((x, x2, y, y2) => {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const p of ps) {
      ctx.lineTo(p[0] + x, p[1] + y);
    }
    ctx.stroke();
  });
  put(dd.w)(w);
  put(dd.h)(h);

  return dd;
};
const arrowD = () =>
  d((x, x2, y, y2) => {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    const start = [x, y];
    const end = [x2, y2];
    drawArrow(ctx, lerp(start, end, 0.02), lerp(start, end, 0.98));
  });

const dd = boxD("orange");
const dd3 = boxD("crimson");
const dd4 = boxD("cornflowerblue");
const ld = lineD([0, 100], [100, 0], [200, 100], [0, 100]);
const td = textD("hello!", 65);
const cat = await imageD(
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Cat_March_2010-1a.jpg/120px-Cat_March_2010-1a.jpg?20121124230906"
);
const captiond = textD(
  "commons.wikimedia.org/wiki/File:Cat_March_2010-1a.jpg",
  10
);

above(dd, dd4);
const dy = yStack(dd, dd3);

yStack(ld, dd);
xStack(ld, td);
xStack(dd3, cat);
above(cat, captiond);
eq(cat.x, captiond.x);

// the defaulting of this is broken and as a result it is not layed out
// properly.
const gg = group(boxD("purple"), boxD("green"));
xStack(cat, gg);

console.log("g", gg);

put(dd4.y)(200);
put(dd4.x)(220);

const arrow = arrowD();
eq(arrow.x, dd.x);
eq(arrow.x2, dd4.x2);
eq(arrow.y, dd.y);
eq(arrow.y2, dd4.y2);

const arrow2 = arrowD();
eq(arrow2.x, dd3.x);
eq(arrow2.y, dd3.y2);
toEq(arrow2.x2, arrow.xc);
toEq(arrow2.y2, arrow.yc);

const arrow3 = arrowD();
toEq(arrow3.x, arrow.xi(0.8));
toEq(arrow3.y, arrow.yi(0.8));
toEq(arrow3.x2, arrow2.xi(0.5));
toEq(arrow3.y2, arrow2.yi(0.5));

draw();
