import { sub, angleOf, fromPolar } from "../../../lib/math/Vec2.js";
import {
  WidthInterval2,
  Interval2,
  Group,
  delOb,
  Point,
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
  const d = sub(to, from);
  const angle = angleOf(d);
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
    drawables.push({ ob, draw });
    return ob;
  };
  const draw = () => {
    drawables.map(({ ob, draw }) =>
      draw(left(ob).v, top(ob).v, right(ob).v, bottom(ob).v)
    );
  };
  const deleteDrawable = (drawable) => {
    delOb(drawable.x.l);
    delOb(drawable.x.r);
    delOb(drawable.y.l);
    delOb(drawable.y.r);
    drawables = drawables.filter((d) => d.ob !== drawable);
  };

  const Box = (color = "blue", w, h) =>
    drawable((x, y, x2, y2) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(x, y, x2 - x, y2 - y);
      ctx.restore();
    })(WidthInterval2(w, h));

  const FONT_SIZE = 20;
  const Text = (text, size = FONT_SIZE) =>
    drawable((x, y, x2, y2) => {
      ctx.textBaseline = "top";
      ctx.font = `${size}px serif`;
      ctx.fillText(text, x, y);
    })(WidthInterval2(...measureWidth(ctx, text, size)));

  const Line = (from, to) => {
    const ar = drawable((x, y, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    })(Interval2());
    if (from) eq2(from, leftTop(ar));
    if (to) eq2(to, rightBottom(ar));
    return ar;
  };

  const Arrow = (from, to) => {
    const ar = drawable((x, y, x2, y2) => drawArrow(ctx, [x, y], [x2, y2]))(
      Interval2()
    );
    if (from) eq2(from, leftTop(ar));
    if (to) eq2(to, rightBottom(ar));
    return ar;
  };

  const Outline = (...interval2s) =>
    drawable((x, y, x2, y2) => {
      ctx.beginPath();
      ctx.rect(x, y, x2 - x, y2 - y);
      ctx.stroke();
    })(Group(...interval2s));

  // scene definition
  const draggables = [];
  const DraggableBox = (color, w, h) => {
    const box = Box(color, w, h);
    draggables.push(box);
    return box;
  };
  const DraggableOutline = (...drawables) => {
    const g = Group(...drawables);
    const o = Outline(Pad2(g, 7.5));
    const dragHandle = DraggableBox("#eee");
    eq2(g.rightBottom, dragHandle.leftTop);
    return o;
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
  const mouseAnchor = Point();
  const mouse = Point();
  const mouseSelectArea = Group(mouseAnchor, mouse);
  Outline(mouseSelectArea);
  // TODO: need to be able to group mouseAnchor and mouse to get mouseSelectArea instead of mouseI2
  // but neither Group nor Group2 work with Points.
  const outlines = [];
  let dragging;
  let isMouseDown = false;
  let selectedDraggables = [];
  c.addEventListener("mousemove", (e) => {
    let mousePos = [e.offsetX, e.offsetY];
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
  });

  function anim() {
    requestAnimationFrame(anim);
  }
  anim();

  let mouseRels;
  c.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    for (const draggable of draggables) {
      if (isPointInside(mouse, draggable) && !mouseRels) {
        mouseRels = eq2(centerCenter(draggable), mouse);
        dragging = draggable;
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
    DraggableOutline,
    draggables,
    Text,
    Line,
    mouse,
  };
};
