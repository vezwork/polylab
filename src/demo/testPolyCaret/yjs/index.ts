import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
//@ts-ignore
import * as Y from "https://cdn.jsdelivr.net/npm/yjs@13.6.8/+esm";
//@ts-ignore
import { WebsocketProvider } from "https://cdn.jsdelivr.net/npm/yicat-y-websocket@1.4.4/+esm";
//@ts-ignore
import { IndexeddbPersistence } from "https://cdn.jsdelivr.net/npm/y-indexeddb@9.0.11/+esm";

export const ydoc = new Y.Doc();

// this allows you to instantly get the (cached) documents data
const indexeddbProvider = new IndexeddbPersistence("test3", ydoc);
indexeddbProvider.on("synced", render);

// const websocketProvider = new WebsocketProvider(
//   "ws://localhost:8080",
//   "test",
//   ydoc
// );

export const myArray = ydoc.getArray("myArray");
export const undoManager = new Y.UndoManager(myArray);

const ctx = setupFullscreenCanvas("c");

let ref = refFrom(myArray, 0);

const PADDING = 10;
const FONT_SIZE = 54;
function render() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = `${FONT_SIZE}px monospace`;
  let offsetX = 20;
  let i = 0;
  for (const el of myArray) {
    if (areRefsSame(ref, refFrom(myArray, i))) {
      ctx.fillStyle = "blue";
      ctx.fillRect(offsetX, 10, 2, FONT_SIZE);
      ctx.fillStyle = "black";
    }
    if (typeof el === "string") {
      ctx.fillText(el, offsetX, FONT_SIZE);
      const { width } = ctx.measureText(el);
      offsetX += width + PADDING;
    } else {
      ctx.fillRect(offsetX - 2, 5, 20, 2);
      offsetX += 20 + PADDING;
      for (const e of el) {
        ctx.fillRect(offsetX, 10, 20, 20);
        offsetX += 20 + PADDING;
      }
    }
    i++;
  }
  if (areRefsSame(ref, refFrom(myArray, i))) {
    ctx.fillStyle = "blue";
    ctx.fillRect(offsetX, 10, 2, FONT_SIZE);
    ctx.fillStyle = "black";
  }
}

document.addEventListener("keydown", (e) => {
  console.log(e.key);

  // if (e.key === "ArrowLeft") {
  //   relPos = Y.createRelativePositionFromTypeIndex(
  //     myArray,
  //     Math.max(
  //       0,
  //       Y.createAbsolutePositionFromRelativePosition(relPos, ydoc).index - 1
  //     )
  //   );
  // }
  // if (e.key === "ArrowRight") {
  //   relPos = Y.createRelativePositionFromTypeIndex(
  //     myArray,
  //     Math.min(
  //       myArray.length,
  //       Y.createAbsolutePositionFromRelativePosition(relPos, ydoc).index + 1
  //     )
  //   );
  // }

  if (e.key === "Backspace") delRef(ref);

  if (e.key === "Tab") {
    const ins = new Y.Array();
    insRef(ref, ins);
  }
  if (e.key === "z" && e.metaKey)
    if (e.shiftKey) undoManager.undo();
    else undoManager.redo();
  else if (e.key.length === 1) insRef(ref, e.key);
  if (e.key.startsWith("Arrow")) null;

  render();

  e.preventDefault();
});

function areRefsSame(ref1, ref2) {
  if (ref1.base !== ref2.base) return false;
  const s1 = indexStackFromRelStack(ref1.stack);
  const s2 = indexStackFromRelStack(ref2.stack);
  if (s1.length !== s2.length) return false;
  for (let i = 0; i < s1.length; i++) {
    if (s1[i] !== s2[i]) return false;
  }
  return true;
}
// fromRef(refFrom(yArray)) === yArray
function refFrom(yArray, index?: number) {
  const relI =
    index === undefined
      ? []
      : [Y.createRelativePositionFromTypeIndex(yArray, index)];

  if (yArray.parent === null) return { base: yArray, stack: relI };
  else {
    const parent = refFrom(yArray.parent);
    return {
      base: parent.base,
      stack: [
        ...parent.stack,
        Y.createRelativePositionFromTypeIndex(
          yArray.parent,
          Array.from(yArray.parent).indexOf(yArray)
        ),
        ...relI,
      ],
    };
  }
}
const indexStackFromRelStack = (relStack) =>
  relStack.map(
    (relPos) => Y.createAbsolutePositionFromRelativePosition(relPos, ydoc).index
  );
function fromRef({ base, stack }) {
  let cur = base;
  for (const index of indexStackFromRelStack(stack)) {
    cur = base.get(index);
  }
  return cur;
}
const parentRef = ({ base, stack }) => ({ base, stack: stack.slice(0, -1) });
function delRef(ref) {
  const p = fromRef(parentRef(ref));
  const i = Y.createAbsolutePositionFromRelativePosition(
    ref.stack.at(-1),
    ydoc
  ).index;
  p.delete(i - 1);
}
function insRef(ref, ...ins) {
  const p = fromRef(parentRef(ref));
  const i = Y.createAbsolutePositionFromRelativePosition(
    ref.stack.at(-1),
    ydoc
  ).index;

  p.insert(i, [...ins]);
}
