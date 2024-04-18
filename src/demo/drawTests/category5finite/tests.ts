import { add, distance, sub } from "../../../lib/math/Vec2.js";
import {
  changed,
  d,
  div,
  eq,
  left,
  log,
  mof,
  mul,
  p,
  plus,
  right,
  sub as obsub,
  to,
} from "./helpers.js";
import { and, cat, mo, push } from "./lib.js";

const TEST1 = () => {
  const a1 = [9];
  const d2 = [10];
  const d3 = [];
  const d4 = [];
  const d5 = [];
  const d6 = [8];

  const d1xd2 = p(a1, d2);
  const d1xd2xd6 = p(d1xd2, d6);

  const plus10 = mo((a, b) => (b[0] = a[0] + 10));
  const minus10 = mo((a, b) => (b[0] = a[0] - 10));

  plus10(a1)(d2);
  minus10(d2)(a1);

  plus10(d2)(d3);

  plus10(d3)(d4);

  plus10(d4)(d5);

  minus10(d6)(d5);
  plus10(d5)(d6);

  console.log(
    a1[0],
    d2[0],
    d3[0],
    d4[0],
    d5[0],
    d6[0],
    [...d1xd2],
    [...d1xd2xd6]
  );
  push(a1, d2);
  console.log(
    a1[0],
    d2[0],
    d3[0],
    d4[0],
    d5[0],
    d6[0],
    [...d1xd2],
    [...d1xd2xd6]
  );
};

const TEST2 = () => {
  changed.clear();
  const test = d();
  const testa = d(1);
  const testb = d(7);
  eq(testb, plus(test, testa));
  push(...changed);
  console.log("ISSUE WHERE ORDER OF ARGS MATTERS!", test, testa, testb);
};
//TEST2();

const TEST4 = () => {
  changed.clear();

  const a = p(d(1), d(2));
  const b = p(d(), d());
  eq(left(b), plus(left(a), right(a)));

  push(...changed);
  console.log(a, b);
};
//TEST4();

const TEST5 = () => {
  changed.clear();

  const c = document.getElementById("c") as HTMLCanvasElement;
  const ctx = c.getContext("2d")!;

  const red = p(p(d(100), d(100)), p(d(100), d(100)));
  const blue = p(p(d(), d()), p(d(100), d(100)));

  const xy = left(red);
  const wh = right(red);
  const x = left(xy);
  const w = left(wh);
  const y = right(xy);
  const h = right(wh);

  const w2 = div(w, d(2));

  const cx = plus(x, w2);
  const l = plus(x, w);

  const h2 = div(h, d(2));

  const cy = plus(y, h2);
  const b = plus(y, h);

  eq(left(left(blue)), l);
  eq(right(left(blue)), b);

  push(...changed);
  console.log(x, y, w, w2, cx, l);

  const defaultDrawableDims = ([[x, y], [w, h]]) => [
    x ?? 0,
    y ?? 0,
    w ?? 0,
    h ?? 0,
  ];
  const redDefaulted = mof(defaultDrawableDims)(red);
  const blueDefaulted = mof(defaultDrawableDims)(blue);
  mof(([x, y, w, h]) => {
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, w, h);
  })(redDefaulted);
  mof(([x, y, w, h]) => {
    ctx.fillStyle = "blue";
    ctx.fillRect(x, y, w, h);
  })(blueDefaulted);

  const mouse = d([0, 0]);
  eq(p(cx, plus(y, d(150))), mouse);

  c.addEventListener("mousemove", (e) => {
    mouse[0] = [e.offsetX, e.offsetY];
    ctx.clearRect(0, 0, c.width, c.height);
    push(mouse);
  });
};
//TEST5();

const TEST6 = () => {
  changed.clear();

  const canvas = document.getElementById("c") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  const a = d(10);
  const b = d(30);
  const c = d();
  eq(a, plus(b, c));
  push(...changed);

  ctx.font = "bold 48px sans-serif";
  mof((a) => ctx.fillText(a + " = ", 10, 100))(a);
  mof((b) => ctx.fillText(b + "+", 200, 100))(b);
  mof((c) => ctx.fillText(c, 400, 100))(c);

  document.addEventListener("keydown", (e) => {
    b[0] = parseInt(e.key);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    push(b);
  });
};
//TEST6();

// Crosscut study
const TEST7 = () => {
  changed.clear();

  const canvas = document.getElementById("c") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  const ax = d(400);
  const ay = d(400);
  const bx = d();
  const by = d();
  const cx = d(320);
  const cy = d(320);

  // for crosscut study I would need these components:
  // - POINT x y
  // - LINE p1 p2
  // - YELLOW_POINT x y
  // - YELLOW_LINE p1 p2
  // - YELLOW_BOX label x y yp[] // connections
  // and I would need some "actions":
  // - drag point
  // - start&end attach line to point

  const drawCircle = ([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.stroke();
  };
  const lineBetween = (a, b) => {
    const line = mof(([[ax, ay], [bx, by]]) => [ax, ay, bx, by])(p(a, b));
    mof(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    })(line);
    return line;
  };
  lineBetween(p(ax, ay), p(cx, cy));

  mof(drawCircle)(p(ax, ay));
  mof(drawCircle)(p(bx, by));
  mof(drawCircle)(p(cx, cy));

  const miny = mof(([ay, cy]) => Math.min(ay, cy))(p(ay, cy));
  const minx = mof(([ax, cx]) => Math.min(ax, cx))(p(ax, cx));
  mof(([x, y]) => ctx.fillText("CROSSCUT STUDY", x, y - 10))(p(minx, miny));

  const mouse = d([0, 0]);

  const Δ = (
    ob,
    diff = (oldData, newData): any => newData - oldData,
    add = (data, changeData): any => changeData + data
  ) => {
    let prev = ob[0];
    let change: any = null;
    const changeMo = mof((v) => {
      change = diff(prev, v);
      prev = v;
      return change;
    })(ob);
    mo(([obchange], v) => {
      v[0] = add(v[0], obchange);
    })(changeMo)(ob);
    return changeMo;
  };
  const Δplus = (a, b) => {
    const c = mof(([a, b]) => a + b)(p(a, b));
    mo(([Δc], [ab]) => {
      ab[0] += Δc / 2;
      ab[1] += Δc / 2;
    })(Δ(c))(p(a, b));
    // mo(([[b, c]], a) => (a[0] = c - b))(p(b, c))(a); // IMPORTANT: the order of these last two lines matters
    // mo(([[a, c]], b) => (b[0] = c - a))(p(a, c))(b);
    return c;
  };

  const THING = d(1 / 3);
  const mTHING = obsub(d(1), THING);

  eq(plus(mul(ax, THING), mul(cx, mTHING)), bx);
  eq(plus(mul(ay, THING), mul(cy, mTHING)), by);

  push(...changed);

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    THING[0] = (Math.sin(t) + 1.1) / 2.2;
    push(THING);
    // crosscut doesn't update from mouse like the following line:
    // it only updates when the mouse moves
    //push(mouse); // why we have to push THING and mouse separately? It somehow makes sense but idk
    requestAnimationFrame(draw);

    t += 0.01;
  }
  requestAnimationFrame(draw);

  //   const GO = d(0.1);
  //   eq(Δ(bx), GO);
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   push(GO);
  //   function draw() {
  //     requestAnimationFrame(draw);
  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //     push(GO);
  //   }
  //   requestAnimationFrame(draw);

  log("Δmouse!!!")(mouse);
  const Δmouse = Δ(mouse, (a, b) => sub(b, a), add);
  const Δbxy = p(Δ(bx), Δ(by));
  let eqSide: any = null;
  let eqTo: any = null;
  // PREV VERSION:
  //   eq(p(bx, by), mouse);

  canvas.addEventListener("mousemove", (e) => {
    mouse[0] = [e.offsetX, e.offsetY];

    if (e.buttons === 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (eqTo === null) {
        if (distance(mouse[0], [ax[0], ay[0]]) < 10) eqSide = p(ax, ay);
        if (distance(mouse[0], [bx[0], by[0]]) < 10) eqSide = p(bx, by);
        if (distance(mouse[0], [cx[0], cy[0]]) < 10) eqSide = p(cx, cy);

        if (eqSide !== null)
          eqTo = mo(([[x, y]], b) => (b[0] = [x, y]))(mouse)(eqSide); // v.s. eq(mouse, eqSide)
      }
    } else {
      if (eqTo !== null) {
        // v.s.
        //cat.remove(mouse, eqIso[0]);
        //cat.remove(bxy, eqIso[1]);
        cat.remove(mouse, eqTo);
        eqTo = null;
        eqSide = null;
      }
    }

    push(mouse);
  });
};
//TEST7();

// Crosscut study Δplus-variation
const TEST8 = () => {
  changed.clear();

  const canvas = document.getElementById("c") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  const ax = d(400);
  const ay = d(400);
  const bx = d();
  const by = d();
  const cx = d(320);
  const cy = d(320);

  // for crosscut study I would need these components:
  // - POINT x y
  // - LINE p1 p2
  // - YELLOW_POINT x y
  // - YELLOW_LINE p1 p2
  // - YELLOW_BOX label x y yp[] // connections
  // and I would need some "actions":
  // - drag point
  // - start&end attach line to point

  const drawCircle = ([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.stroke();
  };
  const lineBetween = (a, b) => {
    const line = mof(([[ax, ay], [bx, by]]) => [ax, ay, bx, by])(p(a, b));
    mof(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    })(line);
    return line;
  };
  lineBetween(p(ax, ay), p(cx, cy));

  mof(drawCircle)(p(ax, ay));
  mof(drawCircle)(p(bx, by));
  mof(drawCircle)(p(cx, cy));

  const miny = mof(([ay, cy]) => Math.min(ay, cy))(p(ay, cy));
  const minx = mof(([ax, cx]) => Math.min(ax, cx))(p(ax, cx));
  mof(([x, y]) =>
    ctx.fillText("CROSSCUT STUDY INTERACTION VARIATION", x, y - 10)
  )(p(minx, miny));

  const mouse = d([0, 0]);

  const Δ = (
    ob,
    diff = (oldData, newData): any => newData - oldData,
    add = (data, changeData): any => changeData + data
  ) => {
    let prev = ob[0];
    let change: any = null;
    const changeMo = mof((v) => {
      change = diff(prev, v);
      prev = v;
      return change;
    })(ob);
    mo(([obchange], v) => {
      v[0] = add(v[0], obchange);
    })(changeMo)(ob);
    return changeMo;
  };
  const Δplus = (a, b) => {
    const c = mof(([a, b]) => a + b)(p(a, b));
    mo(([Δc], [ab]) => {
      ab[0] += Δc / 2;
      ab[1] += Δc / 2;
    })(Δ(c))(p(a, b));
    // mo(([[b, c]], a) => (a[0] = c - b))(p(b, c))(a); // IMPORTANT: the order of these last two lines matters
    // mo(([[a, c]], b) => (b[0] = c - a))(p(a, c))(b);
    return c;
  };

  const THING = d(1 / 3);
  const mTHING = obsub(d(1), THING);

  eq(Δplus(mul(ax, THING), mul(cx, mTHING)), bx);
  eq(Δplus(mul(ay, THING), mul(cy, mTHING)), by);

  push(...changed);

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    THING[0] = (Math.sin(t) + 1.1) / 2.2;
    push(THING);
    push(mouse); // why we have to push THING and mouse separately? It somehow makes sense but idk
    requestAnimationFrame(draw);

    t += 0.01;
  }
  requestAnimationFrame(draw);

  //   const GO = d(0.1);
  //   eq(Δ(bx), GO);
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   push(GO);
  //   function draw() {
  //     requestAnimationFrame(draw);
  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //     push(GO);
  //   }
  //   requestAnimationFrame(draw);

  log("mouse!!!")(mouse);
  //const Δmouse = Δ(mouse, (a, b) => sub(b, a), add);
  //const Δbxy = p(Δ(bx), Δ(by));
  let eqSide: any = null;
  let eqTo: any = null;
  // PREV VERSION:
  //   eq(p(bx, by), mouse);

  canvas.addEventListener("mousemove", (e) => {
    mouse[0] = [e.offsetX, e.offsetY];

    if (e.buttons === 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (eqTo === null) {
        if (distance(mouse[0], [ax[0], ay[0]]) < 10) eqSide = p(ax, ay);
        if (distance(mouse[0], [bx[0], by[0]]) < 10) eqSide = p(bx, by);
        if (distance(mouse[0], [cx[0], cy[0]]) < 10) eqSide = p(cx, cy);

        if (eqSide !== null)
          eqTo = mo(([[x, y]], b) => (b[0] = [x, y]))(mouse)(eqSide); // v.s. eq(mouse, eqSide)
      }
    }

    //push(mouse);
  });
  canvas.addEventListener("mouseup", (e) => {
    if (eqTo !== null) {
      // v.s.
      //cat.remove(mouse, eqIso[0]);
      //cat.remove(bxy, eqIso[1]);
      cat.remove(mouse, eqTo);
      eqTo = null;
      eqSide = null;
    }
  });
};
TEST8();
