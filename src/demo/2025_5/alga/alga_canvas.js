import {
  sub,
  angleOf,
  fromPolar,
  add,
  angleBetween,
} from "../../../lib/math/Vec2.js";
import {
  WidthInterval2,
  Interval2,
  Group,
  delOb,
  Point as P,
  eq2,
  leftTop,
  rightBottom,
  left,
  top,
  right,
  bottom,
  Pad2,
  set,
  centerCenter,
  delRel,
  set2,
  explore,
} from "./alga_api.js";

// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
// https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
const measureWidth = (ctx, text, size) => {
  ctx.textBaseline = "alphabetic";
  ctx.font = `${size}px serif`;
  const measure = ctx.measureText(text);
  return [
    measure.width,
    // WARNING! this is super hacked. 5 is a magic number
    size - 4 /* too accurate!: measure.actualBoundingBoxAscent*/,
  ];
};

//https://stackoverflow.com/a/6333775
function drawArrow(ctx, from, to) {
  const headlen = 7; // length of head in pixels

  const angle = angleBetween(from, to);
  ctx.beginPath();
  ctx.moveTo(...from);
  ctx.lineTo(...to);
  ctx.lineTo(...sub(to, fromPolar(headlen, angle - Math.PI / 6)));
  ctx.moveTo(...to);
  ctx.lineTo(...sub(to, fromPolar(headlen, angle + Math.PI / 6)));
  ctx.stroke();
}

export const d = (ctx) => {
  const c = ctx.canvas;
  let drawables = [];
  const drawable = (draw) => (ob) => {
    const d = { ob, draw };
    drawables.push(d);
    ob.drawable = d;
    return ob;
  };
  const draw = () => {
    drawables.map(({ ob, draw }) => draw(ob));
  };
  const deleteDrawable = (drawable) => {
    delOb(drawable.x.l);
    delOb(drawable.x.r);
    delOb(drawable.y.l);
    delOb(drawable.y.r);
    drawables = drawables.filter((d) => d.ob !== drawable);

    Arrows = Arrows.filter((d) => d !== drawable);
  };

  const Point = (color = "blue", r) =>
    drawable((ob) => {
      const [x, y] = ob;
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    })(P());

  const Box = (color = "blue", w, h) => {
    const d = drawable((ob) => {
      const [x, y, x2, y2] = [left(ob), top(ob), right(ob), bottom(ob)];
      ctx.save();
      ctx.fillStyle = d.color;
      ctx.fillRect(x, y, x2 - x, y2 - y);
      ctx.restore();
    })(WidthInterval2(w, h));
    d.color = color;
    return d;
  };

  const FONT_SIZE = 20;
  const Text = (text, size = FONT_SIZE) => {
    const d = drawable((ob) => {
      const [x, y, x2, y2] = [left(ob), top(ob), right(ob), bottom(ob)];
      ctx.textBaseline = "top";
      ctx.font = `${size}px serif`;
      ctx.fillText(text, x, y);
    })(WidthInterval2(...measureWidth(ctx, text, size)));
    d.text = text;
    d.size = size;
    return d;
  };

  const Line = (from, to) => {
    const ar = drawable((ob) => {
      const [x, y, x2, y2] = [left(ob), top(ob), right(ob), bottom(ob)];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    })(Interval2());
    if (from) eq2(from, leftTop(ar));
    if (to) eq2(to, rightBottom(ar));
    return ar;
  };

  let Arrows = [];
  const Arrow = (from, to) => {
    const ar = drawable((ob) => {
      const [x, y, x2, y2] = [left(ob), top(ob), right(ob), bottom(ob)];
      drawArrow(ctx, [x, y], [x2, y2]);
    })(Interval2());
    Arrows.push(ar);
    ar.from = from;
    ar.to = to;
    if (from) eq2(from, leftTop(ar));
    if (to) eq2(to, rightBottom(ar));
    return ar;
  };

  const Outline = (...interval2s) =>
    drawable((ob) => {
      const [x, y, x2, y2] = [left(ob), top(ob), right(ob), bottom(ob)];
      ctx.beginPath();
      ctx.rect(x, y, x2 - x, y2 - y);
      ctx.stroke();
    })(Group(...interval2s));

  // scene definition
  const draggables = [];
  const DraggableBox = (color, w, h) => {
    const box = Box(color, w, h);
    draggables.push(box);
    box.x.l.draggable = box;
    box.x.r.draggable = box;
    box.y.l.draggable = box;
    box.y.r.draggable = box;
    return box;
  };
  const dropzones = [];
  const DropzoneBox = (color, w, h) => {
    const box = Box(color, w, h);
    const dropzone = Group(box);
    dropzone.placeholder = box;
    dropzones.push(dropzone);
    return dropzone;
  };
  const DraggableOutline = (...drawables) => {
    const g = Group(...drawables);
    const o = Outline(Pad2(g, 7.5));
    eq2(o.leftTop, DraggableBox("#eee").centerCenter);
    eq2(o.rightTop, DraggableBox("#eee").centerCenter);
    eq2(o.leftBottom, DraggableBox("#eee").centerCenter);
    eq2(o.rightBottom, DraggableBox("#eee").centerCenter);

    eq2(o.rightCenter, DraggableBox("#eee").centerCenter);
    eq2(o.leftCenter, DraggableBox("#eee").centerCenter);
    eq2(o.centerTop, DraggableBox("#eee").centerCenter);
    eq2(o.centerBottom, DraggableBox("#eee").centerCenter);
    return g;
  };

  const isPointInside = (p, i2) => {
    const inx = p[0].v > i2.x.l.v && p[0].v < i2.x.r.v;
    const iny = p[1].v > i2.y.l.v && p[1].v < i2.y.r.v;
    return inx && iny;
  };
  const areIntervalsOverLapping = (a, b) =>
    (a.l.v > b.l.v && a.l.v < b.r.v) ||
    (a.r.v > b.l.v && a.r.v < b.r.v) ||
    (a.l.v < b.l.v && a.r.v > b.r.v);
  const areInteval2sOverlapping = (a) => (b) =>
    areIntervalsOverLapping(a.x, b.x) && areIntervalsOverLapping(a.y, b.y);
  const mouseAnchor = P();
  const mouse = P();
  const mouseSelectArea = Group(mouseAnchor, mouse);
  Outline(mouseSelectArea);
  // TODO: need to be able to group mouseAnchor and mouse to get mouseSelectArea instead of mouseI2
  // but neither Group nor Group2 work with Points.
  const outlines = [];
  let dragging;
  const isDragging = () => !!dragging;
  let isMouseDown = false;
  let selectedDraggables = [];
  let mousePos = [0, 0];
  c.addEventListener("mousemove", (e) => {
    mousePos = [e.offsetX, e.offsetY];
  });

  function anim() {
    requestAnimationFrame(anim);
    set2(mouse, mousePos);
    if (!isMouseDown || dragging) set2(mouseAnchor, mousePos);

    for (const outline of outlines) deleteDrawable(outline);
    outlines.length = 0;

    selectedDraggables = draggables.filter(
      areInteval2sOverlapping(mouseSelectArea)
    );

    for (const draggable of draggables)
      if (isPointInside(mouse, draggable) && outlines.length === 0)
        return outlines.push(Outline(draggable));
  }
  anim();

  const getConnectedDraggableGroup = (draggable) =>
    Group(
      ...new Set([
        ...[...explore(draggable.x.l)]
          .filter((o) => o.draggable)
          .map((o) => o.draggable),
        ...[...explore(draggable.y.l)]
          .filter((o) => o.draggable)
          .map((o) => o.draggable),
      ])
    );

  let mouseRels;
  c.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    for (const draggable of draggables) {
      if (isPointInside(mouse, draggable) && !mouseRels) {
        mouseRels = eq2(centerCenter(draggable), mouse);
        dragging = draggable;
        // DraggableOutline(getConnectedDraggableGroup(draggable));
      }
    }
  });

  c.addEventListener("mouseup", (e) => {
    isMouseDown = false;
    set2(mouseAnchor, [e.offsetX, e.offsetY]);
    if (selectedDraggables.length > 0 && !dragging) {
      DraggableOutline(Group(...selectedDraggables));
    }
    if (mouseRels) {
      for (const draggable of draggables) {
        if (draggable !== dragging && isPointInside(mouse, draggable)) {
          eq2(centerCenter(draggable), centerCenter(dragging));
        }
      }
      for (const dropzone of dropzones) {
        if (isPointInside(mouse, dropzone) && dropzone.placeholder) {
          dropzone.del(dropzone.placeholder);
          deleteDrawable(dropzone.placeholder);
          dropzone.placeholder = undefined;
          dropzone.add(getConnectedDraggableGroup(dragging));
        }
      }
      delRel(mouseRels[0]);
      delRel(mouseRels[1]);
      mouseRels = undefined;
      dragging = undefined;
    }
  });

  return {
    deleteDrawable,
    drawables,
    draw,
    Box,
    Outline,
    Arrow,
    DraggableBox,
    DropzoneBox,
    Point,
    DraggableOutline,
    draggables,
    Text,
    Line,
    isDragging,
    mouse,
    getArrows: () => Arrows,
    isPointInside,
  };
};
