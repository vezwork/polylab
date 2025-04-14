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
  init,
} from "./ex/algae3.js";

const Box = (w = 30, flag) => {
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
    const l = Ob(0, flag);
    const r = Ob(0, flag);
    const group = { l, r };
    for (const box of boxes) upRel(box.l, l, Math.min);
    for (const box of boxes) upRel(box.r, r, Math.max);
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

const center = (box) => {
  const ob = Ob(0);
  upRel(box.l, ob, avg);
  upRel(box.r, ob, avg);
  return ob;
};

const eq = (a, b) => rel(a, b, { to: (v) => v, from: (v) => v });
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
  const b2 = Box2();
  const g = Group2(...ts);

  x_(...ts);
  y_(g, b2);
  eq(center(g.x), center(b2.x));

  console.log(b2);

  return Group2(b2, ...ts);
};

//const ba = Box2()
//ba.y.l.v = 100
//
//
//const bb = Box2(120)
//const bc = Box2()
//
//bc.x.l.v = 200
//
//
//x_(ba,bb)
//eq(ba.y.l,bb.y.l)
//
//
//const gab = Group2(ba, bb)
//y_(gab, bc)
//eq(center(gab.x),center(bc.x))

//const tt = t(t(), t())

const ba = Box2();
const bb = Box2();
//const g = x_(ba,bb)
const g = Group2(ba, bb);
const bc = Box2(10, 10);
y_(g, bc);
eq(center(g.x), center(bc.x));

ba.x.l.v = 360;
ba.y.l.v = 300;

bb.x.l.v = 260;
bb.y.l.v = 260;

init();
// BUG: center(bc.x) is not initially sync'd with bc.x.
// When center(bc.x) is moved in init, it does not correct this
// So when set(bc.x.r, bc.x.r.v) happens in init, it propagates this issue

let i = 100;

function anim() {
  requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);

  //set(bc.x.r, 200+Math.sin(i)*20)

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

  //if (focus.flag === 'y')
  //  set(focus, focus.v + (mouseY - focus.v) * 0.1)
  //else set(focus, focus.v + (mouseX - focus.v) * 0.1)
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
  const yo = (ob) => g.get(obClass.get(ob)) * 40 + 20;
  const x = (ob) => (ob.flag === "y" ? yo(ob) : xo(ob));
  const y = (ob) => (ob.flag === "y" ? xo(ob) : yo(ob));

  ctx.fillStyle = "orange";
  ctx.fillRect(x(focus), y(focus), 10, 10);
  ctx.fillStyle = "black";

  for (const [_, relset] of upRels) {
    for (const rel of relset) {
      ctx.strokeStyle = "cornflowerblue";
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

c.addEventListener("click", (e) => {
  focusIndex++;
  focus = Obs[focusIndex % Obs.length];
});
c.addEventListener("mousemove", (e) => {
  mouseX = e.offsetX;
  mouseY = e.offsetY;
});
