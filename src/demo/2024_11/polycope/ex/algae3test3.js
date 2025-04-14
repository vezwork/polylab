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

const ob1 = Ob(0);
const ob2 = Ob(0);
const ob3 = Ob(0);
const ob4 = Ob(0);
const ob5 = Ob(0);
const ob7 = Ob(0);
const ob6 = Ob(0);
const ob7_2 = Ob(0);
const ob8 = Ob(0);
const ob9 = Ob(0);
const ob10 = Ob(0);
const ob11 = Ob(0);
const ob12 = Ob(0);
const ob12_2 = Ob(0);
const ob12_3 = Ob(0);
const ob13 = Ob(0);

upRel(ob6, ob11);
upRel(ob8, ob11);

// TODO: We can't not move things (on down pass)

rel(ob8, ob10, { to: (v) => v - 100, from: (v) => v + 100 });
rel(ob1, ob2, { to: (v) => v + 50, from: (v) => v - 50 });
rel(ob2, ob3, { to: (v) => v + 50, from: (v) => v - 50 });
rel(ob9, ob10, { to: (v) => v - 150, from: (v) => v + 150 });
upRel(ob1, ob4);
upRel(ob2, ob4);
upRel(ob3, ob6);
upRel(ob4, ob6);
upRel(ob7, ob6);
upRel(ob1, ob5);
upRel(ob4, ob5);
//
upRel(ob1, ob9, avg);
upRel(ob2, ob9, avg);
upRel(ob3, ob9, avg);
upRel(ob4, ob9, avg);
upRel(ob5, ob9, avg);
upRel(ob6, ob9, avg);
upRel(ob7, ob9, avg);
upRel(ob7_2, ob9, avg);

upRel(ob10, ob12, Math.min);
upRel(ob11, ob12, Math.min);
upRel(ob1, ob12, Math.min);
upRel(ob7_2, ob12, Math.min);

upRel(ob12_2, ob13, avg);
upRel(ob12_3, ob13, avg);

rel(ob12, ob13, { to: (v) => v + 10, from: (v) => v - 10 });
//rel(ob12_2,ob12_3,{to:v=>v-30, from:v=>v+30})

ob1.v = 400;
init();

//console.clear()
//console.table({ob2,ob3,ob4,ob5,ob6})

let focusIndex = 0;
let focus = Obs[focusIndex % Obs.length];

const draw = () => {
  ctx.clearRect(0, 0, c.width, c.height);

  const g = grade();
  //const y = ob => ob.y
  const y = (ob) => g.get(obClass.get(ob)) * 40 + 20;

  ctx.fillStyle = "orange";
  ctx.fillRect(focus.v, y(focus), 10, 10);
  ctx.fillStyle = "black";

  for (const [_, relset] of upRels) {
    for (const rel of relset) {
      ctx.strokeStyle = "cornflowerblue";
      ctx.beginPath();
      ctx.moveTo(rel.ob1.v, y(rel.ob1));
      ctx.lineTo(rel.ob2.v, y(rel.ob2));
      ctx.stroke();
    }
  }
  for (const [_, relset] of rels) {
    for (const rel of relset) {
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.moveTo(rel.ob1.v, y(rel.ob1));
      ctx.lineTo(rel.ob2.v, y(rel.ob2));
      ctx.stroke();
    }
  }
  for (const ob of Obs) {
    ctx.fillRect(ob.v, y(ob), 5, 5);
    ctx.fillText(setOrder.get(ob) ?? "", ob.v - 10, y(ob));
  }
};
draw();

let mouseX = 0;

c.addEventListener("click", (e) => {
  focusIndex++;
  focus = Obs[focusIndex % Obs.length];
});
c.addEventListener("mousemove", (e) => {
  mouseX = e.offsetX;
});

function anim() {
  requestAnimationFrame(anim);
  set(focus, focus.v + (mouseX - focus.v) * 0.1);
  draw();
}
requestAnimationFrame(anim);
