import {
  Ob,
  set,
  rel,
  upRel,
  Obs,
  upRels,
  rels,
  setOrder,
} from "./ex/algae3.js";

//const ob1 = Ob(0)
//const ob2 = Ob(0)
//const ob3 = Ob(0)
//const ob4 = Ob(0)
//const ob5 = Ob(0)
//const ob7 = Ob(0)
const ob6 = Ob(0);
const ob7_2 = Ob(0);
const ob8 = Ob(0);
const ob9 = Ob(0);
const ob10 = Ob(0);
const ob11 = Ob(0);

upRel(ob6, ob11);
upRel(ob8, ob11);

// TODO: We can't not move things (on down pass)

rel(ob8, ob10, { to: (v) => v - 100, from: (v) => v + 100 });
//rel(ob1,ob2,{to:v=>v+50, from:v=>v-50})
//rel(ob2,ob3,{to:v=>v+50, from:v=>v-50})
rel(ob9, ob10, { to: (v) => v - 150, from: (v) => v + 150 });
//upRel(ob1,ob4)
//upRel(ob2,ob4)
//upRel(ob3,ob6)
//upRel(ob4,ob6)
//upRel(ob7,ob6)
//upRel(ob1, ob5)
//upRel(ob4,ob5)
//
//upRel(ob1,ob9)
//upRel(ob2,ob9)
//upRel(ob3,ob9)
//upRel(ob4,ob9)
//upRel(ob5,ob9)
upRel(ob6, ob9);
//upRel(ob7,ob9)
upRel(ob7_2, ob9);

//set(ob1, 220)
set(ob6, 120);

console.clear();
//console.table({ob2,ob3,ob4,ob5,ob6})

let focusIndex = 0;
let focus = Obs[focusIndex % Obs.length];

const draw = () => {
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = "orange";
  ctx.fillRect(focus.v, focus.y, 10, 10);
  ctx.fillStyle = "black";

  for (const [_, relset] of upRels) {
    for (const rel of relset) {
      ctx.strokeStyle = "cornflowerblue";
      ctx.beginPath();
      ctx.moveTo(rel.ob1.v, rel.ob1.y);
      ctx.lineTo(rel.ob2.v, rel.ob2.y);
      ctx.stroke();
    }
  }
  for (const [_, relset] of rels) {
    for (const rel of relset) {
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.moveTo(rel.ob1.v, rel.ob1.y);
      ctx.lineTo(rel.ob2.v, rel.ob2.y);
      ctx.stroke();
    }
  }
  for (const ob of Obs) {
    ctx.fillRect(ob.v, ob.y, 5, 5);
    ctx.fillText(setOrder.get(ob) ?? "", ob.v - 10, ob.y);
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
