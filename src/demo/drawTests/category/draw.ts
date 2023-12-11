//import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import {
  CtxTransform,
  _,
  addEntries,
  apply,
  applyToVec,
  erp,
  id,
  inv,
  pow,
  scalarMul,
  scale,
  subEntries,
  translation,
} from "../../../lib/math/CtxTransform.js";
import {
  Vec2,
  add,
  distance,
  length,
  rotateQuarterXY,
  rotateQuarterYX,
  setAngleFromVec,
  setLength,
  sub,
  v,
} from "../../../lib/math/Vec2.js";
import { Field, makeOtherFunctions } from "../../../lib/math2/num.js";
import { at, take } from "../../../lib/structure/Iterable.js";
import { mo, push } from "./lib.js";
import { loopMo, loopWalk, loopWalkForward } from "./loopLib.js";

const svg = document.getElementById("s")! as unknown as SVGElement;

// const fill = (color: string) => (v: Vec2) => {
//   ctx.fillStyle = color;
//   ctx.fillRect(...v, 20, 20);
//   console.log("fill", color);
// };
const assign = (v1: Vec2) => (v2: Vec2) => {
  v1[0] = v2[0];
  v1[1] = v2[1];
};
const assignCtxTransform = (t1: CtxTransform) => (t2: CtxTransform) => {
  t1[0] = t2[0];
  t1[1] = t2[1];
  t1[2] = t2[2];
  t1[3] = t2[3];
  t1[4] = t2[4];
  t1[5] = t2[5];
};

function makeCircleSvgEl(color: string) {
  const circle = document.createElementNS(svg.namespaceURI, "circle");
  circle.setAttribute("r", "4");
  circle.setAttribute("fill", color);

  svg.appendChild(circle);
  return circle;
}
function makeLineSvgEl(color: string) {
  const line = document.createElementNS(svg.namespaceURI, "line");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-linecap", "round");

  svg.appendChild(line);
  return line;
}

const camT = _(id)(id);

let rawMouse = [0, 0] as Vec2;
let mouse = [0, 0] as Vec2;
let isMouseDown = { value: false };
document.addEventListener("mousemove", (e) => {
  assign(rawMouse)([e.x, e.y]);
  push(rawMouse);
});
mo(() => assign(mouse)(apply(inv(camT))(rawMouse)))(rawMouse, camT)(mouse);
document.addEventListener("mousedown", (e) => {
  isMouseDown.value = true;
  push(isMouseDown);
});
document.addEventListener("mouseup", (e) => {
  isMouseDown.value = false;
  push(isMouseDown);
});

//const ctx = setupFullscreenCanvas("c");

const grabbables: Vec2[] = [];
let grabbing: Vec2 | null = null;

let input = false;
const checkInput = () => {
  const i = input;
  input = false;
  return i;
};

mo((m) => {
  if (grabbing) {
    assign(grabbing)(mouse);
    input = true;
    push(grabbing);
  }
})(mouse)();
mo(({ value }) => {
  if (value === true) {
    for (const grabbable of grabbables)
      if (distance(mouse, grabbable) < 10) grabbing = grabbable;
  } else {
    grabbing = null;
  }
})(isMouseDown)();

const mouseSvgEl = makeCircleSvgEl("black");

const shape = (t: CtxTransform) => {
  const origin = apply(t)(v(0));
  const red = applyToVec(t)(v(1, 0));
  const blue = applyToVec(t)(v(0, 1));

  const originRed = [0, 0] as Vec2;
  const originBlue = [0, 0] as Vec2;

  grabbables.push(originRed, originBlue, origin);

  mo((o, r, b, t) => {
    t[0] = r[0];
    t[1] = r[1];
    t[2] = b[0];
    t[3] = b[1];
    t[4] = o[0];
    t[5] = o[1];
  })(
    origin,
    red,
    blue
  )(t);
  mo((t, o) => {
    o[0] = t[4];
    o[1] = t[5];
  })(t)(origin);
  mo((t, r) => {
    r[0] = t[0];
    r[1] = t[1];
  })(t)(red);
  mo((t, b) => {
    b[0] = t[2];
    b[1] = t[3];
  })(t)(blue);

  mo((o, r, or) => assign(or)(add(o, r)))(origin, red)(originRed);
  mo((o, b, ob) => assign(ob)(add(o, b)))(origin, blue)(originBlue);

  mo((o, or, r) => assign(r)(sub(or, o)))(origin, originRed)(red);
  mo((o, ob, b) => assign(b)(sub(ob, o)))(origin, originBlue)(blue);

  mo((r, or, o) => assign(o)(sub(or, r)))(red, originRed)(origin);
  mo((b, ob, o) => assign(o)(sub(ob, b)))(blue, originBlue)(origin);

  // option -1: comment all the lines below if you just dont care!

  // option a: uncomment these lines to disable different length basis
  // mo((r, b) => assign(b)(setLength(length(r), b)))(red)(blue);
  // mo((b, r) => assign(r)(setLength(length(b), r)))(blue)(red);

  // option b: uncomment these lines to disable skewing
  mo((v, o) => assign(o)(setAngleFromVec(rotateQuarterXY(v))(o)))(red)(blue);
  mo((v, o) => assign(o)(setAngleFromVec(rotateQuarterYX(v))(o)))(blue)(red);

  // option c: uncomment these line to make basis determine eachother
  // mo((r, b) => assign(b)(rotateQuarterXY(r)))(red)(blue);
  // mo((b, r) => assign(r)(rotateQuarterYX(b)))(blue)(red);

  // const verticalLine = makeLineSvgEl("black");
  // const horizontalLine = makeLineSvgEl("black");

  const redSvgEl = makeCircleSvgEl("red");
  const redLineSvgEl = makeLineSvgEl("red");
  const blueSvgEl = makeCircleSvgEl("blue");
  const blueLineSvgEl = makeLineSvgEl("blue");
  const originSvgEl = makeCircleSvgEl("green");

  //mo((m, svg))(mouse)(null);
  mo((o, s) => {
    s.setAttribute("cx", o[0]);
    s.setAttribute("cy", o[1]);
  })(mouse)(mouseSvgEl);
  mo((o, s) => {
    s.setAttribute("cx", o[0]);
    s.setAttribute("cy", o[1]);
  })(origin)(originSvgEl);
  mo((o, s) => {
    s.setAttribute("cx", o[0]);
    s.setAttribute("cy", o[1]);
  })(originRed)(redSvgEl);
  mo((o, or, s) => {
    s.setAttribute("x1", o[0]);
    s.setAttribute("y1", o[1]);
    s.setAttribute("x2", or[0]);
    s.setAttribute("y2", or[1]);
  })(
    origin,
    originRed
  )(redLineSvgEl);
  mo((o, s) => {
    s.setAttribute("cx", o[0]);
    s.setAttribute("cy", o[1]);
  })(originBlue)(blueSvgEl);
  mo((o, ob, s) => {
    s.setAttribute("x1", o[0]);
    s.setAttribute("y1", o[1]);
    s.setAttribute("x2", ob[0]);
    s.setAttribute("y2", ob[1]);
  })(
    origin,
    originBlue
  )(blueLineSvgEl);
  // mo((o, b, r, s) => {
  //   s.setAttribute("x1", o[0] + r[0]);
  //   s.setAttribute("y1", o[1] + r[1]);
  //   s.setAttribute("x2", o[0] + b[0] + r[0]);
  //   s.setAttribute("y2", o[1] + b[1] + r[1]);
  // })(
  //   origin,
  //   blue,
  //   red
  // )(verticalLine);
  // mo((o, b, r, s) => {
  //   s.setAttribute("x1", o[0] + b[0]);
  //   s.setAttribute("y1", o[1] + b[1]);
  //   s.setAttribute("x2", o[0] + b[0] + r[0]);
  //   s.setAttribute("y2", o[1] + b[1] + r[1]);
  // })(
  //   origin,
  //   blue,
  //   red
  // )(horizontalLine);
  push(origin);

  return t;
};

const makeShape = (rel, t = _(id)(id)) => {
  shape(t);
  let prevT = [...t] as CtxTransform;

  mo(() => {
    if (checkInput()) {
      const deltaT = _(t)(inv(prevT)); // BUG: can result in skewing
      assignCtxTransform(rel)(_(deltaT)(rel));
    }
    prevT = [...t];
  })(t)();

  return t;
};

const forwardShapeRel = (rel) => (prev) => {
  const t = makeShape(rel);

  mo(() => assignCtxTransform(prev)(_(inv(rel))(t)))(t)(prev);
  mo(() => assignCtxTransform(t)(_(rel)(prev)))(prev)(t);

  return t;
};
const backwardShapeRel = (rel) => (next) => {
  const t = makeShape(rel);

  mo(() => assignCtxTransform(next)(_(rel)(t)))(t)(next);
  mo(() => assignCtxTransform(t)(_(inv(rel))(next)))(next)(t);

  return t;
};

const rel = translation(v(2, 0));
const rel2 = translation(v(0, 2));
const initThing = makeShape(rel, _(scale(v(35)))(translation(v(315))));

loopMo(forwardShapeRel(rel), backwardShapeRel(rel))("Shape")("Shape");
//loopMo(forwardShapeRel(rel2), backwardShapeRel(rel2))("Shape")("Shape");

const walk = loopWalk("Shape", initThing);

// walk.next();
// walk.next();
// walk.next();
// walk.next();
// walk.next();
// walk.next();
// walk.next();
// walk.next();
setInterval(() => {
  walk.next();
  push(initThing);
}, 300);

let scroll = 0;

let camV = 0;
let vTarget = 0;

function camera() {
  const ato = _(pow(rel)(scroll))(initThing);
  const scrollTarget = inv(_(_(scale(v(0.01)))(translation(v(-3, -3))))(ato));

  camV += (vTarget - camV) * 0.1;
  assignCtxTransform(camT)(erp(id)(scrollTarget)(camV));
  push(camT);

  svg.setAttribute(
    "transform",
    `matrix(${camT[0].toFixed(6)},${camT[1].toFixed(6)},${camT[2].toFixed(
      6
    )},${camT[3].toFixed(6)},${camT[4].toFixed(6)},${camT[5].toFixed(6)})`
  );

  requestAnimationFrame(camera);
}
requestAnimationFrame(camera);

document.addEventListener("wheel", (event) => {
  const { deltaY } = event;
  scroll += deltaY / 100;

  vTarget = 1;
});
document.addEventListener("keydown", () => {
  //scroll = 0;
  vTarget = 0;
});
