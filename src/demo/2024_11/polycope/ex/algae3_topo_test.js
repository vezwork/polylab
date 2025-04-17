import {
  Ob,
  set,
  rel,
  upRel,
  Obs,
  upRels,
  rels,
  setOrder,
  avg,
  grade,
  obClass,
} from "./ex/algae3_topo.js";

const Box = (w = 15, flag) => {
  const box = { l: Ob(0, flag), r: Ob(w, flag) };
  rel(box.l, box.r, { to: (v) => v + w, from: (v) => v - w });
  return box;
};
const allBox2 = [];
const Box2 = (w, h) => {
  const box2 = {
    x: Box(w),
    y: Box(h, "y"),
  };
  allBox2.push(box2);
  return box2;
};

const Group =
  (flag) =>
  (...boxes) => {
    const l = upRel(Math.min, flag)(...boxes.map((box) => box.l));
    const r = upRel(Math.max, flag)(...boxes.map((box) => box.r));
    const group = { l, r };
    return group;
  };
const allGroup2 = [];
const Group2 = (...box2s) => {
  const group2 = {
    x: Group()(...box2s.map((b) => b.x)),
    y: Group("y")(...box2s.map((b) => b.y)),
  };
  allGroup2.push(group2);
  return group2;
};

const center = (box) => upRel(avg)(box.l, box.r);

const eq = (a, b) => rel(a, b, { to: (v) => v, from: (v) => v });
const eqyl_ = (...boxes) => {
  for (let i = 0; i < boxes.length - 1; i++) eq(boxes[i].y.l, boxes[i + 1].y.l);
  //return Group2(...boxes)
};
const _ = (a, b) => eq(a.r, b.l);
const x_ = (...boxes) => {
  for (let i = 0; i < boxes.length - 1; i++) _(boxes[i].x, boxes[i + 1].x);
  return Group2(...boxes);
};
const y_ = (...boxes) => {
  for (let i = 0; i < boxes.length - 1; i++) _(boxes[i].y, boxes[i + 1].y);
  return Group2(...boxes);
};

const t = (...ts) => {
  if (ts.length > 0) {
    const b2 = Box2();

    const g = x_(...ts);
    eqyl_(...ts);

    eq(center(g.x), center(b2.x));

    return y_(g, b2);
  } else return Box2();
};

// TODO: test usage
// - overlapping groups
// - arrows
// - using single dimension relation full bounding boxes
// - example usages in general
// TODO: check for duplicate work in `set`
// TODO: documentation

const tt = t(t(), t());
const otherBox = Box2();
x_(tt, otherBox);

let i = 100;

function anim() {
  if (!paused) requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = "salmon";
  ctx.globalAlpha = 0.3;
  for (const { x, y } of allGroup2)
    ctx.fillRect(x.l.v, y.l.v, x.r.v - x.l.v, y.r.v - y.l.v);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = "black";
  for (const { x, y } of allBox2) {
    ctx.beginPath();
    ctx.rect(x.l.v, y.l.v, x.r.v - x.l.v, y.r.v - y.l.v);
    ctx.stroke();
  }

  i += 0.05;

  if (focus.flag === "y") set(focus, focus.v + (mouseY - focus.v) * 0.1);
  else set(focus, focus.v + (mouseX - focus.v) * 0.1);

  //set(otherBox.y.r, 400+Math.sin(i)*20)
  draw();
}
requestAnimationFrame(anim);

let focusIndex = 0;
let focus = Obs[focusIndex % Obs.length];

const draw = () => {
  //  ctx.clearRect(0, 0, c.width, c.height);

  const g = grade();
  //const y = ob => ob.y
  const xo = (ob) => ob.v;
  const yo = (ob) => g.get(obClass.get(ob)) * 15 + 20;
  const x = (ob) => (ob.flag === "y" ? yo(ob) : xo(ob));
  const y = (ob) => (ob.flag === "y" ? xo(ob) : yo(ob));

  ctx.fillStyle = "orange";
  ctx.font = "8px sans-serif";
  ctx.fillRect(x(focus), y(focus), 10, 10);
  ctx.fillStyle = "black";

  for (const [_, relset] of upRels) {
    for (const rel of relset) {
      ctx.strokeStyle =
        rel.f === Math.min
          ? "cornflowerblue"
          : rel.f === avg
          ? "YellowGreen"
          : "crimson";
      ctx.beginPath();
      ctx.moveTo(x(rel.ob1), y(rel.ob1));
      ctx.lineTo(x(rel.ob2), y(rel.ob2));
      ctx.stroke();
    }
  }
  for (const [_, relset] of rels) {
    for (const rel of relset) {
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.moveTo(x(rel.ob1), y(rel.ob1));
      ctx.lineTo(x(rel.ob2), y(rel.ob2));
      ctx.stroke();
    }
  }
  for (const ob of Obs) {
    ctx.fillRect(x(ob), y(ob), 5, 5);
    ctx.fillText(setOrder.get(ob) ?? "", x(ob) - 10, y(ob));
  }
};
draw();

let mouseX = 0;
let mouseY = 0;

let paused = false;
c.addEventListener("mousedown", (e) => {
  focusIndex++;
  focus = Obs[focusIndex % Obs.length];
  console.log("focus", focus);
  //  if (focusIndex === 16) paused = true
});
c.addEventListener("mousemove", (e) => {
  mouseX = e.offsetX;
  mouseY = e.offsetY;
});
