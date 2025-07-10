import {
  Point,
  Group2,
  set,
  set2,
  spaceX,
  spaceY,
  eq,
  eqOffset,
  eq2,
  stackX,
  stackY,
} from "../../2025_5/alga/alga_api.js";
import { d } from "../../2025_5/alga/alga_canvas.js";

// make things crispy
const dpr = window.devicePixelRatio;
c.width = window.innerWidth * dpr;
c.height = window.innerHeight * dpr;
c.style.width = window.innerWidth + "px";
c.style.height = window.innerHeight + "px";
ctx.scale(dpr, dpr);

const {
  draw,
  Box,
  Outline,
  Arrow,
  DraggableBox,
  DraggableOutline,
  deleteDrawable,
  Text,
  Line,
} = d(ctx);

const txtInit = DraggableBox();
let txtL = Group2(txtInit);
let txtO = Outline(txtL);
let txtHead = txtInit;
set2(txtInit.leftTop, [250, 200]);
// next:
// - better text rendering
// - backspace (deleting object from group)
// - left and right careting (along Arrows somehow?)
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const newTxtInit = DraggableBox("red", 10, 10);
    const newTxtL = Group2(newTxtInit);
    stackY(txtL, newTxtL, 5);

    Arrow(txtHead.centerBottom, newTxtInit.centerTop);
    txtL = newTxtL;
    txtHead = newTxtInit;

    deleteDrawable(txtO);
    txtO = Outline(txtL);
    // what if this automatically outlined whatever txtO pointed at?
  } else {
    const newHead = Text(e.key);
    stackX(txtHead, newHead, 8);
    txtL.add(newHead);
    Arrow(txtHead.rightCenter, newHead.leftCenter);
    txtHead = newHead;
  }
});
// what if this text was in a group and the group auto-expanded?

const exp = (numD, expD) => {
  eq2(numD.rightTop, expD.leftCenter);
  return Group2(numD, expD);
};
const FRAC_GAP = 8;
const frac = (numD, denD) => {
  const g = stackY(numD, denD, FRAC_GAP);
  const l = Line();
  eq(l.left, g.left);
  eq(l.right, g.right);
  eqOffset(l.top, numD.bottom, -FRAC_GAP / 2);
  eqOffset(l.bottom, numD.bottom, -FRAC_GAP / 2);
  return g;
};
const sum = (topD, bottomD, rightD) => {
  const Σ = Text("Σ", 40);
  stackX(Σ, rightD);
  stackY(topD, Σ, 3);
  stackY(Σ, bottomD, 5);
  return Group2(Σ, topD, bottomD, rightD);
};

const g = stackX(
  Text("ζ(s) = "),
  sum(
    Text("∞", 22),
    Text("n=0"),
    frac(Text("1"), exp(Text("n"), Text("s", 12)))
  ),
  0
);
DraggableOutline(g);
set2(g.leftTop, [30, 30]);

const boundingExperimentF = () => {
  const b1 = DraggableBox("yellowgreen");
  const b2 = DraggableBox("orangered");
  const b3 = DraggableBox("violet");
  const b4 = DraggableBox("cornflowerblue");
  set(b2.left, 20);
  set(b4.left, 20);
  const g1 = Outline(Group2(b1, b2));
  const g2 = Outline(Group2(b3, b4));
  const boundingExperiment = spaceY(20)(g1, g2);
  Line(g1.centerBottom, g2.centerTop);
  DraggableOutline(boundingExperiment);
  boundingExperiment.left = 30;
  boundingExperiment.top = 130;
};
boundingExperimentF();

const dagNode = (...sts) => {
  const node = DraggableBox("orange");
  node.t = node;
  node.next = sts.map((st) => st.t);

  for (const subt of sts) Line(node.centerBottom, subt.t.centerTop);

  const subts = sts.filter((subt) => !subt.parent);
  if (subts.length === 0) return node;
  for (const subt of subts) subt.parent = node;

  const subtsBox = spaceX(20)(...subts);
  eq(subtsBox.left, node.left);

  const res = spaceY(30)(node, Group2(...subts));
  res.t = node;

  return res;
};

// actually a DAG
const minNode = dagNode();
const subDag1 = dagNode(dagNode(dagNode(minNode), dagNode(minNode)));
const subDag2 = dagNode(dagNode(dagNode(minNode), dagNode(minNode)));
const myDag = dagNode(
  dagNode(subDag1),
  dagNode(subDag1),
  dagNode(subDag1, subDag2)
);

DraggableOutline(myDag);
myDag.left = 30;
myDag.top = 230;

const a0 = DraggableBox("orange");
const b0 = DraggableBox("orange");
const b1 = DraggableBox("orange");
const b2 = DraggableBox("orange");
const c0 = DraggableBox("orange");
const c1 = DraggableBox("orange");
Arrow(a0.centerTop, b0.centerTop);
Arrow(a0.centerTop, b1.centerTop);
Arrow(a0.centerTop, b2.centerTop);
Arrow(b0.centerTop, c0.centerTop);
Arrow(b1.centerTop, c0.centerTop);
Arrow(b2.centerTop, c0.centerTop);
Arrow(b2.centerTop, c1.centerTop);

set2(DraggableOutline(Group2(a0, b0, b1, b2, c0, c1)).leftTop, [300, 20]);

spaceX(20)(b0, b1, b2);
spaceX(55)(c0, c1);
eq(a0.left, b0.left);
eq(b0.left, c0.left);
spaceY()(a0, Group2(b0, b1, b2));
spaceY()(Group2(b0, b1, b2), c0);
spaceY()(b2, c1);

const m00 = DraggableBox("yellowgreen");
const m10 = DraggableBox("salmon");
const m11 = DraggableBox("goldenrod");
Outline(Group2(m10, m11)).left = Outline(m00).right.plus(10);
m10.top = 600;
m11.top += 20;
DraggableOutline(Group2(m00, m11)).top = 500;

const D = DraggableBox;
const tt0 = D("red");
const tt02 = D("orangered");
const tt1 = D("red");
const tt12 = D("orangered");
const gg0 = Group2(tt0, tt02);
const gg1 = Group2(tt1, tt12);
gg0.left = gg1.right.plus(15);
const ggg = DraggableOutline(Group2(tt0, tt1));
tt1.left = 500;
tt02.left = 500;
tt12.left = 500;
tt1.top = 200;
tt0.top = 200;

function anim() {
  requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);
  draw();
}
anim();
