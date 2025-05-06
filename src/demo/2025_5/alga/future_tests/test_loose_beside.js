const b1 = DraggableBox("yellowgreen");
const b2 = DraggableBox("crimson");
const b3 = DraggableBox("violet");
rel(b1.x.r, b2.x.l, {
  to: (v, cur = -Infinity) => Math.max(cur, v + 2),
  from: (v, cur = Infinity) => Math.min(cur, v - 2),
});
rel(b2.x.r, b3.x.l, {
  to: (v, cur = -Infinity) => Math.max(cur, v + 2),
  from: (v, cur = Infinity) => Math.min(cur, v - 2),
});
const bg = Group2(b2, b3);
const bgb = DraggableBox("black");
eq2(leftTop(bg), rightBottom(bgb));

// important note: this is a cool idea but is not compatible with out downRel setting works (in groups)
// currently only one downRel edge is taken because it is expected that side rels are enough to fill in the
// red (it is expected that diagrams with downrels and side rels commute).
// This would require taking ALL downrels and additionally visiting objects in a side rel class (equiv class)
// from each side rel into them (traversing within an equiv class originating from each object set by a downRel).
