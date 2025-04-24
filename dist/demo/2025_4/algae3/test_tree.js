import {
  left,
  right,
  top,
  bottom,
  Point,
  Ob,
  WidthInterval2,
  Interval2,
  Group2,
  set,
  delRel,
  delOb,
  centerX,
  centerY,
  eqCenterX,
  Pad2,
  spaceX,
  spaceY,
  eqTop,
  eqLeft,
  eqRight,
  eqBottom,
  eq,
  eq2,
  leftTop,
  centerBottom,
  rightBottom,
  centerTop,
  centerCenter,
} from "../../2025_4/algae3/algae3_api.js";

const drawables = [];
const drawable = (draw) => (ob) => {
  drawables.push({ ob, draw });
  return ob;
};
export const draw = () => {
  drawables.map(({ ob, draw }) =>
    draw(left(ob).v, top(ob).v, right(ob).v, bottom(ob).v)
  );
};

import { sub, angleOf, fromPolar } from "../../../lib/math/Vec2.js";
//https://stackoverflow.com/a/6333775
function drawArrow(context, from, to) {
  const headlen = 7; // length of head in pixels
  const d = sub(to, from);
  const angle = angleOf(d);
  context.beginPath();
  context.moveTo(...from);
  context.lineTo(...to);
  context.lineTo(...sub(to, fromPolar(headlen, angle - Math.PI / 6)));
  context.moveTo(...to);
  context.lineTo(...sub(to, fromPolar(headlen, angle + Math.PI / 6)));
  context.stroke();
}

export const Box = (color = "blue", w, h) =>
  drawable((x, y, x2, y2) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, x2 - x, y2 - y);
  })(WidthInterval2(w, h));

export const Line = () =>
  drawable((x, y, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  })(Interval2());

export const Arrow = (from, to) => {
  const ar = drawable((x, y, x2, y2) => drawArrow(ctx, [x, y], [x2, y2]))(
    Interval2()
  );
  if (from) eq2(leftTop(ar), from);
  if (to) eq2(rightBottom(ar), to);
  return ar;
};

export const Outline = (...interval2s) =>
  drawable((x, y, x2, y2) => {
    ctx.beginPath();
    ctx.rect(x, y, x2 - x, y2 - y);
    ctx.stroke();
  })(Group2(...interval2s));

// setup

const oscillator = Ob(0);

const mouse = Point();
let mousex = 0;
let mousey = 0;
c.addEventListener("mousemove", (e) => {
  mousex = e.offsetX;
  mousey = e.offsetY;
});

// scene definition

// TODO: 1 make a DAG diagram
let mei = 0;
const mes = [];
const tt = (...subts) => {
  const me = Box(subts.length === 0 ? "orange" : "yellowgreen");
  mes.push(me);
  if (subts.length === 0) return [me, me];

  const subtsBox = spaceX(10)(...subts.map(([_, g]) => g));
  eqCenterX(me, subtsBox);

  for (const [subt] of subts) Arrow(centerBottom(me), centerTop(subt));

  return [me, spaceY(15)(me, subtsBox)];
};

const ttt = tt(
  tt(
    tt(),
    tt(),
    tt(
      tt(
        tt(
          tt(
            tt(tt(tt(), tt(), tt(tt(tt(), tt(), tt()), tt()))),
            tt(),
            tt(tt(tt(), tt(), tt()), tt())
          )
        ),
        tt(),
        tt()
      ),
      tt()
    )
  ),
  tt(),
  tt(),
  tt(
    tt(
      tt(
        tt(
          tt(tt(tt(), tt(), tt(tt(tt(), tt(), tt()), tt()))),
          tt(),
          tt(tt(tt(), tt(), tt()))
        )
      )
    )
  )
);

Outline(Pad2(Outline(Pad2(ttt[1], 20)), 5));
set(top(ttt[1]), 100);

let mouseRels = eq2(centerCenter(mes[mei]), mouse);

c.addEventListener("mousedown", (e) => {
  delRel(mouseRels[0]);
  delRel(mouseRels[1]);
  mei = (mei + 1) % mes.length;
  mouseRels = eq2(centerCenter(mes[mei]), mouse);
  // why doesn't this cause a correct re-render?
  // NOT A BUG! it is because mouse gets moved by the `eq` above
  // ISSUE THO: this is very confusing though, how could we improve this?
  // some classes could be "DETERMINED" meaning they are only set by a single ob
  set(mouse[0], mouse[0].v);
  set(mouse[1], mouse[1].v);
});

addEventListener("keydown", (e) => {
  if (e.key === "x") {
    console.log(mes[mei]);
    // well this is funky, but it doesn't seem wrong...
    delOb(mes[mei].x.l);
    delOb(mes[mei].y.l);
    delOb(mes[mei].x.r);
    delOb(mes[mei].y.r);
  }
});

let t = 0;
function anim() {
  requestAnimationFrame(anim);

  t = performance.now();

  set(oscillator, 200 + Math.sin(t / 500) * 30);
  set(mouse[0], mousex);
  set(mouse[1], mousey);
  //  set(top(ttt[1]), oscillator.v)

  ctx.clearRect(0, 0, c.width, c.height);

  draw();
}
anim();
