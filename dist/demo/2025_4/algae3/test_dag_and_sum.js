import {
  left,
  right,
  top,
  bottom,
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
  centerBottom,
  centerTop,
  leftTop,
  rightTop,
  leftCenter,
} from "../../2025_4/algae3/algae3_api.js";
import { d } from "../../2025_4/algae3/algae3_canvas.js";

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
  Text,
  Line,
} = d(ctx);

const exp = (numD, expD) => {
  eq2(rightTop(numD), leftCenter(expD));
  return Group2(numD, expD);
};
const FRAC_GAP = 8;
const frac = (numD, denD) => {
  const g = stackY(numD, denD, FRAC_GAP);
  const l = Line();
  eq(left(l), left(g));
  eq(right(l), right(g));
  eqOffset(top(l), bottom(numD), -FRAC_GAP / 2);
  eqOffset(bottom(l), bottom(numD), -FRAC_GAP / 2);
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
set2(leftTop(g), [30, 30]);

const b1 = DraggableBox("yellowgreen");
const b2 = DraggableBox("orangered");
const b3 = DraggableBox("violet");
const b4 = DraggableBox("cornflowerblue");
set(left(b2), 20);
set(left(b4), 20);
const g1 = Outline(Group2(b1, b2));
const g2 = Outline(Group2(b3, b4));
const boundingExperiment = spaceY(20)(g1, g2);
Line(centerBottom(g1), centerTop(g2));
DraggableOutline(boundingExperiment);
set(left(boundingExperiment), 30);
set(top(boundingExperiment), 130);

const dagNode = (...sts) => {
  const node = DraggableBox("orange");
  node.top = node;
  node.next = sts.map((st) => st.top);

  for (const subt of sts) Line(centerBottom(node), centerTop(subt.top));

  const subts = sts.filter((subt) => !subt.parent);
  if (subts.length === 0) return node;
  for (const subt of subts) subt.parent = node;

  const subtsBox = spaceX(20)(...subts);
  eq(left(subtsBox), left(node));

  const res = spaceY(30)(node, Group2(...subts));
  res.top = node;

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
set(left(myDag), 30);
set(top(myDag), 230);

function anim() {
  requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);
  draw();
}
anim();
