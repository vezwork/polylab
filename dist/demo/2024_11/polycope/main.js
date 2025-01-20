import { history } from "./history.js";
import { Caret } from "./caret.js";
import { CaretSink, ContainerSink } from "./caretsink.js";
import { pSelectionString } from "./parse.js";
import {
  insertAt,
  deleteAt,
  linePos,
  dist,
  distMouseEventToEl,
  elTopAndBottom,
  vertDistPointToLineEl,
} from "./helpers.js";
import { editor } from "./editor.js";

const caretEl = document.createElement("span");
caretEl.style.display = "block";
document.body.prepend(caretEl);
caretEl.style.position = "absolute";
caretEl.style.width = "2px";
caretEl.style.height = "100px";
caretEl.style.background = "black";
caretEl.style.pointerEvents = "none";

const anchorEl = new DOMParser().parseFromString(
  `<span style="
  display:block;
  position: absolute;
  width: 2px;
  height: 100px;
  background: rgb(187, 107, 120);
  pointer-events: none;
  "></span>`,
  "text/html"
).body.firstChild;
document.body.prepend(anchorEl);

const {
  getHistoryRoot,
  setHistory,
  getHistoryHead,
  setHistoryHead,
  removeLastThat,
  pushHistory,
  undo,
  redo,
  mainline,
  restoreFirstThat,
  lastCheckpoint,
} = history();

let caretId = "init";
let caretPos = 0;
let elFromFocusId = {};

let carryPos = -1;
let carryId = null;

let anchorPos = caretPos;
let anchorId = caretId;

let selection = [];
let processedSelection = [];

function renderCaret() {
  const [x, y] = linePos(elFromFocusId[caretId].str, caretPos);

  const caretContainerRect = e1.getBoundingClientRect();
  const rect = elFromFocusId[caretId].els[y][x].getBoundingClientRect();

  caretEl.style.height = rect.height;
  caretEl.style.transform = `translate(${
    rect.right - caretContainerRect.x
  }px, ${rect.y - caretContainerRect.y}px)`;
}
function renderAnchor() {
  const [x, y] = linePos(elFromFocusId[anchorId].str, anchorPos);

  const caretContainerRect = e1.getBoundingClientRect();
  const rect = elFromFocusId[anchorId].els[y][x].getBoundingClientRect();

  anchorEl.style.height = rect.height;
  anchorEl.style.transform = `translate(${
    rect.right - caretContainerRect.x
  }px, ${rect.y - caretContainerRect.y}px)`;
}
function getCaretopeSink(id, pos) {
  const [x, y] = linePos(elFromFocusId[id].str, pos);
  // remove container sinks so they don't throw off the indexing
  const caretSinkLine = elFromFocusId[id].sink.lines[y].filter((s) => !s.lines);
  return caretSinkLine[x];
}

function discrim(e) {
  if (e.key.length === 1) return true;
  if (e.key === "Enter") return true;
  if (e.key === "Backspace") return true;
}
function bigreduce() {
  for (const [id, el] of Object.entries(elFromFocusId)) el.reset();
  window.mainline = mainline();
  for (const e of mainline()) elFromFocusId[e.caretId].act(e);

  for (const [id, el] of Object.entries(elFromFocusId)) {
    el.calcLines();
    el.els = el.render();
    el.sink.lines = el.els.map((line) =>
      line.flatMap((charEl) => {
        if (charEl.isEditor) {
          const containerSink = charEl.sink;
          const sink = new CaretSink(() => {
            const rect = charEl.getBoundingClientRect();
            return {
              left: rect.right + 0.1,
              right: rect.right + 0.2,
              top: rect.top,
              bottom: rect.bottom,
            };
          });
          sink.isAfterEditorSink = true;
          sink.parent = el.sink;
          sink.charEl = charEl;
          containerSink.parentContainerSink = el.sink;
          containerSink.charEl = charEl;
          return [containerSink, sink];
        } else {
          const sink = new CaretSink(() => charEl.getBoundingClientRect());
          sink.parent = el.sink;
          sink.charEl = charEl;
          return sink;
        }
      })
    );
  }

  renderCaret();
  renderAnchor();
}

const editorLineage = (el) => {
  let lineageStack = [];
  let cur = el;
  while (cur.pos) {
    lineageStack.push(cur);
    cur = elFromFocusId[cur.parentId];
  }
  return lineageStack;
};
const ancestorIds = (id) =>
  editorLineage(elFromFocusId[id])
    .map((el) => el.id)
    .concat(["init"]);
const caretTreePos = ([id, pos]) => [
  ...editorLineage(elFromFocusId[id])
    .toReversed()
    .map((ed) => ed.pos),
  pos,
];
const comp = (rep1, rep2) => {
  const a = caretTreePos(rep1);
  const b = caretTreePos(rep2);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  if (a.length > b.length) return -1;
  if (a.length < b.length) return 1;
  return 0;
};
const minAndMax = (a, b) => (comp(a, b) === 1 ? [b, a] : [a, b]);
const getSink = ([id, pos]) => getCaretopeSink(id, pos);
const getCaret = (a) => new Caret(getSink(a));
const selectionSinks = () => {
  const result = [];

  const anchorSink = getSink([anchorId, anchorPos]);
  if (!anchorSink || !getSink([caretId, caretPos])) return [];
  const [min, max] = minAndMax([caretId, caretPos], [anchorId, anchorPos]);
  const selC = getCaret(min);
  const maxSink = getSink(max);
  while (selC.caretSink && selC.caretSink !== maxSink) {
    selC.moveRight();
    result.push(selC.caretSink);
  }
  return result;
};
const e1Wrap = document.createElement("div");
e1Wrap.classList.add("editor-wrapper");
const e1 = editor("init", undefined, {
  elFromFocusId,
  selectionSinks,
  calcSelection,
  vertDistPointToLineEl,
  distMouseEventToEl,
  deleteAt,
  insertAt,
  linePos,
  renderCaret,
  renderAnchor,
  getCaretId: () => caretId,
  setCaretId: (id) => {
    caretId = id;
  },
  getCaretPos: () => caretPos,
  setCaretPos: (p) => {
    caretPos = p;
  },
  getAnchorId: () => anchorId,
  setAnchorId: (id) => {
    anchorId = id;
  },
  getAnchorPos: () => anchorPos,
  setAnchorPos: (p) => {
    anchorPos = p;
  },
  getProcessedSelection: () => processedSelection,
  setProcessedSelection: (ps) => {
    processedSelection = ps;
  },
});
e1Wrap.append(e1);
document.body.append(e1Wrap);
e1.focus();
e1.render();
bigreduce();

const copy = (e) => {
  if (processedSelection.length === 0) return;
  const output = calcSelectionString(processedSelection);

  e.clipboardData.setData("text/plain", output);
  e.preventDefault();
  console.log("copied!", output);

  if (e.type === "cut") {
    pushHistory({
      key: "Backspace",
      caretId,
      caretPos,
      processedSelection,
      anchorId,
      anchorPos,
      comp: comp([caretId, caretPos], [anchorId, anchorPos]),
    });
    bigreduce();
  }
};
document.addEventListener("copy", copy);
document.addEventListener("cut", copy);
document.addEventListener("paste", (e) => {
  let paste = e.clipboardData.getData("text");

  if (paste) {
    const output = pSelectionString(paste).parse;
    const go = (v) =>
      Array.isArray(v)
        ? {
            id: Math.random() + "",
            data: v.map(go),
          }
        : v;
    pushHistory({
      caretId,
      paste: output.map(go),
      caretPos,
      processedSelection,
      anchorId,
      anchorPos,
      comp: comp([caretId, caretPos], [anchorId, anchorPos]),
    });
    bigreduce();
  }
});

// remove 'parent' property which creates circular refs
const serializeCheckpointHelper = (node) => {
  if (node === undefined) return undefined;
  return {
    src: node.src,
  };
};
const deserializeCheckpointHelper = (parent) => (node) => {
  if (node === undefined) return undefined;
  const image = new Image();
  image.src = node.src;
  return {
    image,
    node: parent,
    src: node.src,
  };
};
const serializeHistHelper = (node) => {
  return {
    data: node.data,
    checkpoint: serializeCheckpointHelper(node.checkpoint),
    next: node.next.map(serializeHistHelper),
  };
};
const deserializeHistHelper = (parent) => (node) => {
  const deserialized = {
    parent,
    data: node.data,
  };
  deserialized.checkpoint = deserializeCheckpointHelper(deserialized)(
    node.checkpoint
  );
  deserialized.next = node.next.map(deserializeHistHelper(deserialized));
  return deserialized;
};
const serializeHistory = (root) => JSON.stringify(serializeHistHelper(root));
const deserializeHistory = (str) =>
  deserializeHistHelper(undefined)(JSON.parse(str));

function loadFromLocalStorage() {
  if (localStorage.getItem("history")) {
    const root = deserializeHistory(localStorage.getItem("history"));
    setHistory(root);
    bigreduce();
    const toEval = e1.str.join("");
    sandboxedEval(toEval, () => drawHistoryTree());
  }
}
// const historyCheckpoints = new Map();
const CHECKPOINT_THUMB_SIZE = 50;
function createHistoryCheckpoint(c) {
  const newC = document.createElement("canvas");
  newC.width = CHECKPOINT_THUMB_SIZE;
  newC.height = CHECKPOINT_THUMB_SIZE;
  const newCtx = newC.getContext("2d");
  newCtx.drawImage(c, 0, 0, CHECKPOINT_THUMB_SIZE, CHECKPOINT_THUMB_SIZE);

  const image = new Image();
  image.src = newC.toDataURL();
  const historyNode = getHistoryHead();
  historyNode.checkpoint = {
    image,
    node: historyNode,
    src: image.src,
  };
  return new Promise((resolve) =>
    image.addEventListener("load", () => resolve(image))
  );
}

function sandboxedEval(toEval, callback = () => {}) {
  const htmlString = `
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow:hidden;
    }
  </style>
  <canvas
    id="c"
    height="700"
    width="700"
  ></canvas>
  <script type="module">
    const ctx = c.getContext('2d');
    ${toEval}
  </script>
  `;
  const prevIframe = document.getElementById("myIframe");
  const iframe = document.createElement("iframe");
  iframe.srcdoc = htmlString;
  iframe.onload = function () {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    callback(iframeDoc);
  };
  iframe.id = "myIframe";
  iframe.style.border = "1px solid black";
  iframe.style.borderRadius = "4px";
  iframe.style.height = "700px";
  iframe.style.width = "700px";
  iframe.style.position = "sticky";
  iframe.style.top = "40px";
  iframe.style.right = "40px";

  const iframeDiv = document.createElement("div");
  iframeDiv.style.position = "absolute";
  iframeDiv.style.top = "790px";
  iframeDiv.style.right = "40px";
  iframeDiv.style.height = "calc(100% - 40px)";
  iframeDiv.style.width = "700px";
  iframeDiv.style.display = "flex";
  iframeDiv.style.flexDirection = "row-reverse";
  iframeDiv.append(iframe);

  document.body.append(iframeDiv);
  setTimeout(() => prevIframe?.remove(), 100); // try to prevent flicker
}
loadFromLocalStorage();
// createHistoryCheckpoint();

let localUndoBase = null;
document.body.addEventListener("keydown", (e) => {
  if (e.key === "Backspace") e.preventDefault();
  if (e.key === " ") e.preventDefault();
  if (e.key.startsWith("Arrow")) {
    e.preventDefault();
    if (e.key === "ArrowDown") moveCaret("down", e.shiftKey, e.metaKey);
    if (e.key === "ArrowUp") moveCaret("up", e.shiftKey, e.metaKey);
    if (e.key === "ArrowLeft") moveCaret("left", e.shiftKey, e.metaKey);
    if (e.key === "ArrowRight") moveCaret("right", e.shiftKey, e.metaKey);

    return;
  }
  if (e.key === "s" && e.metaKey) {
    // eval
    e.preventDefault();

    const toEval = e1.str.join("");
    sandboxedEval(toEval, (iframeDoc) => {
      createHistoryCheckpoint(iframeDoc.getElementById("c")).then(() => {
        localStorage.setItem("history", serializeHistory(getHistoryRoot()));
        drawHistoryTree();
      });
    });

    return;
  }
  if (e.key === "a" && e.metaKey) {
    e.preventDefault();
    moveCaret("up", false, true);
    moveCaret("down", true, true);
    return;
  }

  if (e.key === "b" && e.metaKey) {
    pushHistory({
      key: e.key,
      caretId,
      newId: Math.random() + "",
      caretPos,
      processedSelection,
      anchorId,
      anchorPos,
      comp: comp([caretId, caretPos], [anchorId, anchorPos]),
    });
    bigreduce();
  } else if (e.key === "c" && e.metaKey) {
  } else if (e.key === "x" && e.metaKey) {
  } else if (e.key === "v" && e.metaKey) {
  } else if (e.key === "p" && e.metaKey && e.shiftKey) {
    const restoredAction = restoreFirstThat((d) =>
      ancestorIds(d.caretId).includes(localUndoBase)
    );
    e.preventDefault();
    bigreduce();
    // TODO: BUGFIX: I need to set these to the values after acting on the restored action
    // so I need a way to access those...
    // I could make bigreduce an iterable and detect when that history item appears
    if (restoredAction) {
      bigreduce();
      anchorId = restoredAction.anchorId;
      anchorPos = restoredAction.anchorPos;
      caretPos = restoredAction.caretPos;
      caretId = restoredAction.caretId;
      renderCaret();
      renderAnchor();
    }
  } else if (e.key === "p" && e.metaKey) {
    localUndoBase = localUndoBase ?? caretId;
    const removedAction = removeLastThat((d) =>
      ancestorIds(d.caretId).includes(localUndoBase)
    );
    e.preventDefault();

    if (removedAction) {
      bigreduce();
      anchorId = removedAction.anchorId;
      anchorPos = removedAction.anchorPos;
      caretPos = removedAction.caretPos;
      caretId = removedAction.caretId;
      renderCaret();
      renderAnchor();
    }
  } else if (e.key === "z" && e.metaKey && e.shiftKey) {
    redo();
    bigreduce();
  } else if (e.key === "z" && e.metaKey) {
    const res = undo();

    bigreduce();
    // add back selection on undo
    if (res[1]?.processedSelection) {
      anchorId = res[1].anchorId;
      anchorPos = res[1].anchorPos;
      caretPos = res[1].caretPos;
      caretId = res[1].caretId;
      renderCaret();
      renderAnchor();

      calcSelection();
    }
  } else if (discrim(e) && !e.metaKey) {
    const h = {
      key: e.key,
      caretId,
      caretPos,
      processedSelection,
      anchorId,
      anchorPos,
      comp: comp([caretId, caretPos], [anchorId, anchorPos]),
    };
    pushHistory(h);
    bigreduce();
  }
});

function moveCaret(dir, isSelecting, isJumping) {
  selectionSinks().forEach((c) => {
    c.charEl.isSelected = false;
    c.charEl.classList.remove("selected");
    if (c.charEl.isEditorStart)
      elFromFocusId[c.charEl.parentId].isStartSelected = false;
  });

  const c = new Caret(getCaretopeSink(caretId, caretPos));
  if (carryId) c.carrySink = getCaretopeSink(caretId, carryPos);
  if (isJumping) {
    if (dir === "down") c.moveToRootEnd();
    if (dir === "up") c.moveToRootStart();
    if (dir === "left") c.moveToStartOfRootLine();
    if (dir === "right") c.moveToEndOfRootLine();
  } else {
    if (isSelecting) {
      if (dir === "down" || dir === "right") {
        if (dir === "down") c.moveDown();
        if (dir === "right") c.moveRight();
        let prev;
        while (
          prev !== c.caretSink &&
          (c.caretSink.charEl.isEditorEnd || c.caretSink.charEl.isEditorStart)
        ) {
          prev = c.caretSink;
          c.moveRight();
        }
      } else {
        if (dir === "up") c.moveUp();
        if (dir === "left") c.moveLeft();
        let prev;
        while (
          prev !== c.caretSink &&
          (c.caretSink.charEl.isEditorEnd || c.caretSink.charEl.isEditorStart)
        ) {
          prev = c.caretSink;
          c.moveLeft();
        }
      }
    } else {
      if (dir === "down") c.moveDown();
      if (dir === "up") c.moveUp();
      if (dir === "left") c.moveLeft();
      if (dir === "right") c.moveRight();
    }
  }
  caretId = c.caretSink.charEl.parentId;
  caretPos = c.caretSink.charEl.pos;
  if (!isSelecting) {
    anchorId = caretId;
    anchorPos = caretPos;
  }
  if (c.carrySink) {
    carryPos = c.carrySink.charEl.pos;
    carryId = c.carrySink.charEl.parentId;
  } else {
    carryId = null;
  }
  renderCaret();
  renderAnchor();

  calcSelection();
}
// uggh this is disgusting
function calcSelectionString(processedSelection) {
  // WIP COPY PASTE
  const commonPrefixLength = (bla) => {
    const upperBound = Math.min(...bla.map((l) => l.length));
    for (let i = 0; i < upperBound; i++) {
      const values = new Set(bla.map((l) => l[i]));

      if (values.size !== 1) return i;
    }
    return upperBound;
  };

  console.log(processedSelection.map((v) => [caretTreePos(v), getSink(v)]));
  const mm = processedSelection
    .map((v) => [caretTreePos(v), getSink(v)])
    .filter(([_, s]) => !s.isAfterEditorSink)
    .map(([v, s]) => [
      v,
      s.charEl.isNewLine ? "\n" : s.charEl.innerText ? s.charEl.innerText : " ",
    ]);
  const m = mm.map((v) => v[0]);
  const p = commonPrefixLength(processedSelection.map(caretTreePos));
  const mp = m.map((l) => l.slice(p));

  const root = {};
  let i = 0;
  for (const lis of mp) {
    let cur = root;
    for (const entry of lis) {
      if (!cur[entry]) cur[entry] = {};
      cur = cur[entry];
    }
    cur.data = mm[i][1];
    i++;
  }

  const serial = (tre) =>
    Object.values(tre).flatMap((v) =>
      v.data ? v.data : ["(>", ...serial(v), "<)"]
    );

  return m.length === 1 ? root.data : serial(root).join("");
}

function calcSelection() {
  selection = selectionSinks();
  processedSelection = [];
  selection.forEach((c) => {
    if (c.charEl.isEditorStart) {
      elFromFocusId[c.charEl.parentId].isStartSelected = true;
    }
    if (!c.charEl.isEditor || (c.charEl.isEditor && c.charEl.isStartSelected)) {
      c.charEl.classList.add("selected");
      if (!c.charEl.isEditorStart) {
        processedSelection.push([c.charEl.parentId, c.charEl.pos]);
        c.charEl.isSelected = true;
      }
    }
  });
}

import { createHistoryTreeVis } from "./historyRender.js";
const { c, drawHistoryTree } = createHistoryTreeVis(
  setHistoryHead,
  bigreduce,
  sandboxedEval,
  lastCheckpoint,
  getHistoryRoot,
  CHECKPOINT_THUMB_SIZE,
  e1
);
document.body.prepend(c);
e1Wrap.prepend(anchorEl);
e1Wrap.prepend(caretEl);
