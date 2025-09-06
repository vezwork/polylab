import { createSyncedListAndListOfLists } from "./SyncedLists.js";
import { history } from "./history.js";

const { getHistoryRoot, setHistory, pushHistory, undo, redo, mainline } =
  history();
import { serializeHistory, deserializeHistory } from "./historySerial.js";

const s = createSyncedListAndListOfLists();
let l = s.l;
let lol = s.lol;
let lolFroml = s.lolFroml;
let lFromlol = s.lFromlol;

// TODO:
// - column remembering for up/down nav
// -[x] history
//   - selection restoration on undo
// - mouse picking
// -[x] selection
// - copy & paste
// STRETCH:
// - multicursors
// - nested editors and caret nav
// - reactive layout
// - CRDT
// - saving docs

const anchor = l.pointer(l.start);
const pointer = l.pointer(l.start);

const leastBy = (ar, scoreF) =>
  ar.reduce(
    (acc, cur) => {
      const { leastScore, least } = acc;
      const curScore = scoreF(cur);
      if (curScore < leastScore) return { leastScore: curScore, least: cur };
      else return acc;
    },
    { leastScore: Infinity, least: ar[0] }
  ).least;

function* getlSelection() {
  const anchorNode = anchor.node;
  const pointerNode = pointer.node;
  let sawAnchor = false;
  let sawPointer = false;
  for (const n of [...l.traverseWithStart()]) {
    if (sawAnchor || sawPointer) yield n;
    if (pointerNode === n) sawPointer = true;
    if (anchorNode === n) sawAnchor = true;
    if (sawAnchor && sawPointer) break;
  }
}

const charFromKey = {
  Enter: "\n",
  Tab: "\t",
};

const actions = {};
function historicalOnKey(f) {
  addEventListener("keydown", (e) => {
    const key = e.key;
    if (e.metaKey) return; // so undo works

    const action = f(key);
    if (action !== undefined) {
      const id = Math.random() + "";
      pushHistory({
        key,
        pointerId: pointer.node.id,
        anchorId: anchor.node.id,
        id,
      });
      action({
        pointer,
        anchor,
        key,
        id,
        get selection() {
          return [...getlSelection()];
        },
      });
      if (actions[key] === undefined) actions[key] = action;
    }
  });
}

// Important note: the action must be a pure function of the key!
// and state...?
historicalOnKey((key) => {
  const char = charFromKey[key] ?? key;
  if (char.length === 1) {
    return ({ pointer, anchor, selection, key, id }) => {
      const char = charFromKey[key] ?? key;
      for (const n of selection) l.remove(n);
      anchor.node = pointer.node = l.addAfter(
        pointer.node,
        { char },
        false,
        id
      );
    };
  }
  if (key === "Backspace") {
    if (pointer.node === l.start) return;
    return ({ pointer, selection }) => {
      if (selection.length === 0) l.remove(pointer.node);
      else for (const n of selection) l.remove(n);
    };
  }
});

addEventListener("keydown", (e) => {
  if (e.metaKey && e.key === "z") {
    e.preventDefault();
    if (e.shiftKey) {
      const h = redo();
      if (h === undefined) return;
      const action = actions[h.key];
      pointer.node = l.nodeFromId.get(h.pointerId);
      anchor.node = l.nodeFromId.get(h.anchorId);
      action({
        pointer,
        anchor,
        key: h.key,
        id: h.id,
        get selection() {
          return getlSelection();
        },
      });
    } else {
      const res = undo();

      // reset state
      const s = createSyncedListAndListOfLists();
      l = s.l;
      lol = s.lol;
      lolFroml = s.lolFroml;
      lFromlol = s.lFromlol;
      anchor.node = pointer.node = l.start;
      // big reduce
      for (const h of mainline()) {
        const action = actions[h.key];
        pointer.node = l.nodeFromId.get(h.pointerId);
        anchor.node = l.nodeFromId.get(h.anchorId);
        action({
          pointer,
          anchor,
          key: h.key,
          id: h.id,
          get selection() {
            return getlSelection();
          },
        });
      }
      // add back selection
      const h = res[1];
      pointer.node = l.nodeFromId.get(h.pointerId);
      anchor.node = l.nodeFromId.get(h.anchorId);
    }
    return;
  }

  if (!e.metaKey) e.preventDefault();

  if (e.key === "ArrowLeft") pointer.node = pointer.node.prev ?? pointer.node;
  if (e.key === "ArrowRight") pointer.node = pointer.node.next ?? pointer.node;
  if (e.key === "ArrowDown") {
    const pointerNode2D = lolFroml.get(pointer.node);
    if (pointerNode2D.list.node.next?.data) {
      pointer.node = lFromlol.get(
        leastBy(
          [...pointerNode2D.list.node.next.data.traverseWithStart()],
          (n) => Math.abs(n.x - pointerNode2D.x)
        )
      );
    }
  }
  if (e.key === "ArrowUp") {
    const pointerNode2D = lolFroml.get(pointer.node);
    if (pointerNode2D.list.node.prev?.data) {
      pointer.node = lFromlol.get(
        leastBy(
          [...pointerNode2D.list.node.prev.data.traverseWithStart()],
          (n) => Math.abs(n.x - pointerNode2D.x)
        )
      );
    }
  }
  if (e.key.startsWith("Arrow") && !e.shiftKey) anchor.node = pointer.node;
});

// time to think about pointers/cursors

const c = document.getElementById("c");
const ctx = c.getContext("2d");

// make things crispy
const dpr = window.devicePixelRatio;
const h = c.height;
const w = c.width;
c.width = w * dpr;
c.height = h * dpr;
c.style.width = w + "px";
c.style.height = h + "px";
ctx.scale(dpr, dpr);

const boxh = 20;
const boxw = 20;
const keyName = {
  "\n": "↵",
  "\t": "→",
  " ": "·",
};

function drawBox(box, isSelected) {
  ctx.beginPath();
  ctx.rect(box.x, box.y, boxw, boxh);
  ctx.stroke();
  ctx.fillStyle = "rgba(129, 67, 193, 0.2)";
  if (isSelected) ctx.fill();
  ctx.fillStyle = "black";
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.font = `${boxw}px 'fira code'`;
  ctx.fillText(
    keyName[box.data.char] ?? box.data.char,
    box.x + boxw / 2,
    box.y
  );
}

function drawLol() {
  let x = 0;
  let y = 45;

  const selection = [...getlSelection()].map((n) => lolFroml.get(n));

  for (let line of lol) {
    line.data.start.x = -20;
    line.data.start.y = y;

    let lineYMax = y + boxh;
    for (const box of line.data) {
      box.x = x;
      x += boxw;
      lineYMax = Math.max(y + boxh, lineYMax);
    }
    const lineYmid = y + (lineYMax - y) / 2;
    for (const box of line.data) {
      box.y = lineYmid - boxh / 2;

      drawBox(box, selection.includes(box));
    }
    x = 0;
    y = lineYMax;
    if (y > c.height) break;
  }

  const box = lolFroml.get(pointer.node);
  ctx.fillRect(box.x + boxw, box.y, 3, boxh + 1);
}

function drawl() {
  l.start.x = -20;
  l.start.y = 0;

  const selection = [...getlSelection()];

  let x = 0;
  for (const box of l) {
    box.x = x;
    x += boxw;
    box.y = 0;

    drawBox(box, selection.includes(box));
  }

  let box = pointer.node;
  ctx.fillRect(box.x + boxw, box.y, 3, boxh + 1);
}

function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  drawLol();
  drawl();
}
requestAnimationFrame(draw);
