import {
  add,
  print,
  sub,
  l,
  framed,
  level,
  normalizeRadix,
} from "./radixListNum.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d")!;

const GAP = 1;

const cy = c.height / 2;

const BASE = 2n;

let zoom = -6; // integers (log scale)

const baseExp = (n) => ({
  n: [1n],
  radix: n + 1,
});

let nnn = {
  n: [],
  radix: 0,
  isNeg: false,
};

const keysDown = {};
document.addEventListener("keydown", (e) => {
  keysDown[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keysDown[e.key] = false;
});

const sstr = (a) =>
  JSON.stringify(a, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

requestAnimationFrame(render);
function render() {
  requestAnimationFrame(render);

  if (keysDown["ArrowLeft"]) {
    nnn = sub(nnn, baseExp(zoom + 1), BASE);
  }
  if (keysDown["ArrowRight"]) {
    nnn = add(nnn, baseExp(zoom + 1), BASE);
  }
  if (keysDown["ArrowDown"]) {
    zoom += 1;
  }
  if (keysDown["ArrowUp"]) {
    zoom -= 1;
  }
  nnn = normalizeRadix(nnn);

  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillRect(0, cy, c.width, 1);

  ctx.fillText(print(nnn), 0, 20);
  ctx.fillText(zoom.toString(2), 0, 40);
  //   ctx.fillText(pos.toString(2), 0, 60);

  let nn = framed(nnn, l(nnn), zoom);
  for (let i = 0; i * GAP < c.width; i++) {
    ctx.fillStyle = "black";
    const px = i * GAP;
    const h = 4 * level(nn); // TODO: make this better
    ctx.fillRect(px, cy, 1, h);
    nn = add(nn, baseExp(zoom), BASE);
  }
  nn = framed(nnn, l(nnn), zoom);
  for (let i = 0; i * GAP < c.width; i++) {
    const px = i * GAP;
    const h = 4 * level(nn); // TODO: make this better
    ctx.fillStyle = "black";
    ctx.globalCompositeOperation = "xor";
    if (level(nn) > zoom + 4 || level(nn) === 0)
      ctx.fillText(print(nn), px, cy + h + 10);
    nn = add(nn, baseExp(zoom), BASE);
  }
}

// number type with:
// - addition
// - making a number with a single value at an index
// - sign
// - radix
// - truncation / focus
// - pretty-print
