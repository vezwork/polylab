const log = console.log;
const on = addEventListener;
// returns: least el by f(el), least f(el), index of least el
const least = (ar, f) =>
  ar.reduce(
    ([b, pb, pbi], cs, i) => (f(cs) < pb ? [cs, f(cs), i] : [b, pb, pbi]),
    [null, Infinity, null]
  );
const sum = (ar) => ar.reduce((s, cs) => s + cs, 0);

const d = [];
const redos = [];

// todo:
// -selection

const act = (f) => d.push(f);
const undo = () => {
  d.length > 0 ? redos.push(d.pop()) : 0;
  reduce();
};
const redo = () => {
  redos.length > 0 ? d.push(redos.pop()) : 0;
  reduce();
};

let s = "";
let caret = 0;
let anchor = 0;
const reduce = () => {
  s = "";
  caret = 0;
  anchor = 0;
  d.map((a) => a());
};

const ins = (s, p, put) =>
  s.slice(0, s.length - p) + put + s.slice(s.length - p);
const del = (s, p, n = 1) =>
  s.slice(0, s.length - p - n) + s.slice(s.length - p);

const actit = (f) => {
  const car = caret;
  const anc = anchor;
  act(() => {
    caret = car;
    anchor = anc;
    f();
  });
  reduce();
};
const ains = (put) => actit(() => (s = ins(s, caret, put)));
const adel = () =>
  actit(() => (s = del(s, Math.max(caret, anchor), Math.abs(caret - anchor))));

const lcsinks = () => {
  let csls = [[csinks[0]]];
  for (let i = 1; i <= s.length; i++) {
    if (s[i - 1] === "\n") csls.push([csinks[i]]);
    else csls.at(-1).push(csinks[i]);
  }
  return csls;
};
const caretl = () => {
  let myLine = 0;
  for (let i = 0; i < s.length - caret; i++) if (s[i] === "\n") myLine++;
  return myLine;
};
const closestCaretPosInL = (i) => {
  const csls = lcsinks();
  const pli = sum(csls.slice(0, i).map((cs) => cs.length));

  if (csls[i]) {
    const mySink = csinks[s.length - caret];
    const [_, _0, ii] = least(csls[i], (cs) => Math.abs(cs[0] - mySink[0]));

    return s.length - (pli + ii);
  } else return undefined;
};

on("keydown", (e) => {
  if (e.metaKey && e.key === "z") {
    if (e.shiftKey) return redo();
    else return undo();
  }

  if (e.key === "ArrowLeft") caret = Math.min(s.length, caret + 1);
  if (e.key === "ArrowRight") caret = Math.max(0, caret - 1);
  if (e.key === "ArrowUp") {
    caret = closestCaretPosInL(caretl() - 1) ?? caret;
  }
  if (e.key === "ArrowDown") {
    caret = closestCaretPosInL(caretl() + 1) ?? caret;
  }
  if (e.key.startsWith("Arrow")) {
    e.preventDefault();
    if (!e.shiftKey) anchor = caret;
  }

  if (e.key === "Enter") ains("\n"), (anchor = caret);
  if (e.key === "Backspace") adel(), (anchor = caret);
  if (e.key.length === 1) ains(e.key), (anchor = caret);
});

let isMouseDown = false;
let m = [0, 0];
on("mousemove", (e) => {
  m = [e.offsetX, e.offsetY];

  if (!isMouseDown) return;
  const [b, pb, i] = least(csinks, (cs) => dist(m, cs));
  caret = s.length - i;
});
const dist = ([x, y], [x1, y1]) => Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
on("mouseup", (e) => {
  isMouseDown = false;
});
on("mousedown", (e) => {
  isMouseDown = true;
  const [b, pb, i] = least(csinks, (cs) => dist(m, cs));
  anchor = caret = s.length - i;
});

let csinks = [];
const w = 20;
const h = 20;
function draw(xi = 0, y = 0) {
  ctx.font = "20px monospace";
  ctx.textBaseline = "top";

  csinks = [];

  let x = xi;
  let sawC = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (i === s.length - caret) sawC++;
    if (i === s.length - anchor) sawC++;
    csinks.push([x, y]);
    if (c === "\n") {
      y += h;
      x = xi;
    } else {
      ctx.fillText(c, x, y);
      if (sawC === 1) ctx.fillRect(x, y + h, w, 3);
      x += w;
    }
  }
  csinks.push([x, y]);

  ctx.save();
  ctx.fillStyle = "red";
  for (const s of csinks) ctx.fillRect(s[0], s[1], 3, 3);

  ctx.fillRect(...csinks[s.length - caret], 3, h);
  ctx.fillStyle = "blue";
  ctx.fillRect(...csinks[s.length - anchor], 3, h);

  ctx.restore();
}

anim();
function anim() {
  requestAnimationFrame(anim);

  ctx.clearRect(0, 0, c.width, c.height);

  draw(20, 0);
}
