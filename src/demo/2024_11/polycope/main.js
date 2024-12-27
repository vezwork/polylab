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
  getHistoryHead,
  setHistoryHead,
  removeLastThat,
  pushHistory,
  undo,
  redo,
  mainline,
  restoreFirstThat,
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

const editor = (id = Math.random() + "", parentContainerSink) => {
  const wrapEl = document.createElement("div");
  wrapEl.className = "editor";
  elFromFocusId[id] = wrapEl;
  wrapEl.style.display = "inline-block";
  wrapEl.tabIndex = 0;
  const mousePick = (shouldMoveAnchor) => (e) => {
    e.stopPropagation();

    selectionSinks().forEach((c) => {
      c.charEl.isSelected = false;
      c.charEl.classList.remove("selected");
      if (c.charEl.isEditorStart)
        elFromFocusId[c.charEl.parentId].isStartSelected = false;
    });

    const closestLineEl = wrapEl.lineEls.sort(
      (el1, el2) =>
        vertDistPointToLineEl(e, el1) - vertDistPointToLineEl(e, el2)
    )[0];
    const picked = [...closestLineEl.children].sort(
      (el1, el2) => distMouseEventToEl(e, el1) - distMouseEventToEl(e, el2)
    )[0];
    caretId = id;
    caretPos = picked.pos;

    if (shouldMoveAnchor) {
      anchorId = id;
      anchorPos = picked.pos;
      renderAnchor();
    }
    renderCaret();

    calcSelection();
  };
  wrapEl.addEventListener("mousedown", mousePick(true));
  document.addEventListener("mousemove", (e) => {
    if (e.buttons === 1) mousePick(false)(e);
  });
  wrapEl.sink = new ContainerSink(() => wrapEl.getBoundingClientRect());
  wrapEl.sink.parent = parentContainerSink ?? null;

  let str = [];
  let lines = [[]];

  function reset() {
    str = [];
    lines = [[]];

    wrapEl.innerHTML = "";
  }

  function myDeleteAt(pos) {
    str = deleteAt(str, pos - 1);
    wrapEl.str = str;
  }
  function myInsertAt(pos, char) {
    str = insertAt(str, pos, char);
    wrapEl.str = str;
  }
  wrapEl.myDeleteAt = myDeleteAt;
  wrapEl.myInsertAt = myInsertAt;

  function act(e) {
    if (e.caretId !== id) return;
    caretId = e.caretId;
    caretPos = e.caretPos;
    processedSelection = e.processedSelection;

    if (processedSelection.length > 0) {
      // deletion works here because processedSelection is always ordered left to right,
      // selectionSinks handles that.
      for (const [sid, spos] of processedSelection.toReversed()) {
        elFromFocusId[sid]?.myDeleteAt(spos);
      }
      if (e.comp !== 1) {
        caretPos = e.caretPos;
        caretId = e.caretId;
      } else {
        caretPos = e.anchorPos;
        caretId = e.anchorId;
      }
    }
    // Note: its gross that we have to clear processedSelection here.
    // This should always be calc'd from caret and anchor pos, not manually set.
    processedSelection = [];
    e = { ...e, processedSelection: [] };

    if (e.paste) {
      if (e.paste.id) {
        act({ ...e, paste: undefined, newId: e.paste.id });
        elFromFocusId[caretId]?.act({
          ...e,
          paste: e.paste.data,
          caretId,
          caretPos,
        });
      } else if (Array.isArray(e.paste)) {
        let initCaretPos = e.caretPos;
        let initId = e.caretId;
        for (const entry of e.paste) {
          act({
            ...e,
            paste: entry,
            caretId: initId,
            caretPos: initCaretPos,
          });
          initCaretPos++;
        }
      } else {
        // when does this happen!?
        act({ ...e, paste: undefined, key: e.paste });
      }
    } else if (e.newId) {
      const newE = editor(e.newId, wrapEl.sink);
      newE.render();
      elFromFocusId[caretId]?.myInsertAt(caretPos, newE);

      caretPos = 0;
      caretId = newE.id;
    } else if (e.key.length === 1) {
      elFromFocusId[caretId]?.myInsertAt(caretPos, e.key);

      caretPos++;
    }
    if (e.key === "Enter") {
      elFromFocusId[caretId]?.myInsertAt(caretPos, "\n");
      caretPos++;
    }
    if (e.key === "Backspace") {
      if (e.processedSelection.length > 0) {
      } else if (caretPos > 0) {
        str = deleteAt(str, caretPos - 1);
        caretPos--;
      } else {
        // TODO?: delete at start of editor
        //   caretPos = wrapEl.pos - 1;
        //   caretId = wrapEl.parentId;
        console.log(wrapEl.parentId === undefined);
      }
    }
    anchorPos = caretPos;
    anchorId = caretId;

    wrapEl.str = str;
  }

  function calcLines() {
    let curLine = [];
    lines = [curLine];
    for (const charOrEditor of str) {
      if ("\n" === charOrEditor) {
        curLine = [];
        lines.push(curLine);
      } else curLine.push(charOrEditor);
    }
    wrapEl.lines = lines;
  }
  wrapEl.calcLines = calcLines;

  function render() {
    wrapEl.innerHTML = "";
    let pos = 0;
    wrapEl.lineEls = [];
    return lines.map((line, y) => {
      const lineStartEl = document.createElement("span");
      lineStartEl.style.height = "1.3em";
      lineStartEl.style.width = "4px";
      lineStartEl.style.display = "inline-block";
      lineStartEl.style.verticalAlign = "middle";
      lineStartEl.pos = pos;
      lineStartEl.parentId = id;
      if (y === 0) lineStartEl.isEditorStart = true;
      else lineStartEl.isNewLine = true;
      pos++;
      let els = line.map((char, x) => {
        let charEl;
        if (char.isEditor) {
          charEl = char;
        } else if (char === " ") {
          charEl = document.createElement("span");
          charEl.style.display = "inline-block";
          charEl.style.verticalAlign = "middle";
          charEl.style.width = "8px";
          charEl.style.height = "16px";
        } else {
          charEl = document.createElement("span");
          charEl.innerText = char;
        }

        if (y === lines.length - 1 && x === line.length - 1)
          charEl.isEditorEnd = true;
        charEl.pos = pos;
        charEl.parentId = id;
        pos++;
        return charEl;
      });
      els = [lineStartEl, ...els];
      const lineEl = document.createElement("div");
      lineEl.style.minHeight = "16px";
      lineEl.append(...els);
      wrapEl.lineEls.push(lineEl);
      wrapEl.append(lineEl);
      return els;
    });
  }

  function renderCaret() {
    const [x, y] = linePos(str, caretPos);
    const rect = wrapEl.els[y][x].getBoundingClientRect();

    caretEl.style.height = rect.height;
    caretEl.style.transform = `translate(${
      rect.right + window.pageXOffset
    }px, ${rect.y + window.pageYOffset}px)`;
  }
  function renderAnchor() {
    const [x, y] = linePos(str, anchorPos);
    const rect = wrapEl.els[y][x].getBoundingClientRect();

    anchorEl.style.height = rect.height;
    anchorEl.style.transform = `translate(${
      rect.right + window.pageXOffset
    }px, ${rect.y + window.pageYOffset}px)`;
  }
  function getCaretopeSink(pos) {
    const [x, y] = linePos(str, pos);
    // remove container sinks so they don't throw off the indexing
    const caretSinkLine = wrapEl.sink.lines[y].filter((s) => !s.lines);
    return caretSinkLine[x];
  }
  wrapEl.getCaretopeSink = getCaretopeSink;

  wrapEl.act = act;
  wrapEl.id = id;
  wrapEl.lines = lines;
  wrapEl.str = str;
  wrapEl.renderCaret = renderCaret;
  wrapEl.renderAnchor = renderAnchor;
  wrapEl.render = render;
  wrapEl.reset = reset;
  wrapEl.act = act;
  wrapEl.isEditor = true;
  return wrapEl;
};

const e1 = editor("init");
document.getElementById("outer").append(e1);

function discrim(e) {
  if (e.key.length === 1) return true;
  if (e.key === "Enter") return true;
  if (e.key === "Backspace") return true;
}
function bigreduce() {
  for (const [id, el] of Object.entries(elFromFocusId)) el.reset();
  window.mainline = mainline();
  for (const e of mainline()) {
    const el = elFromFocusId[e.caretId];
    el.act(e);
  }
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
  const focusedEl = elFromFocusId[caretId];
  focusedEl.renderCaret();
  elFromFocusId[anchorId]?.renderAnchor();
}
bigreduce();

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
const getSink = ([id, pos]) => elFromFocusId[id]?.getCaretopeSink(pos);
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
e1.focus();
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

function loadFromLocalStorage() {
  pushHistory({
    caretId,
    paste: localStorage.getItem("eval").split(""),
    caretPos,
    processedSelection,
    anchorId,
    anchorPos,
    comp: comp([caretId, caretPos], [anchorId, anchorPos]),
  });
  bigreduce();
  const toEval = e1.str.join("");
  sandboxedEval(toEval, true);
}
const CHECKPOINT_THUMB_SIZE = 70;
function createHistoryCheckpoint(c) {
  const newC = document.createElement("canvas");
  newC.width = CHECKPOINT_THUMB_SIZE;
  newC.height = CHECKPOINT_THUMB_SIZE;
  const newCtx = newC.getContext("2d");
  newCtx.drawImage(c, 0, 0, CHECKPOINT_THUMB_SIZE, CHECKPOINT_THUMB_SIZE);

  const image = new Image();
  image.style.border = "1px solid black";
  image.style.borderRadius = "4px";
  image.style.display = "block";
  image.style.margin = "10px 0";
  image.src = newC.toDataURL();
  const historyNode = getHistoryHead();
  image.addEventListener("click", (e) => {
    setHistoryHead(historyNode);
    bigreduce();
    const toEval = e1.str.join("");
    sandboxedEval(toEval);
  });
  document.getElementById("outer").appendChild(image);
}

function sandboxedEval(toEval, shouldCreateHistoryCheckpoint = false) {
  const htmlString = `
  <style>
    html, body {
      margin: 0;
      padding: 0;
    }
  </style>
  <canvas
    id="c"
    height="700"
    width="700"
  ></canvas>
  <script type="module">
    ${toEval}
  </script>
  `;
  document.getElementById("myIframe")?.remove();
  const iframe = document.createElement("iframe");
  iframe.srcdoc = htmlString;
  iframe.onload = function () {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    if (shouldCreateHistoryCheckpoint)
      createHistoryCheckpoint(iframeDoc.getElementById("c"));
  };
  iframe.id = "myIframe";
  iframe.style.border = "none";
  iframe.style.height = "700px";
  iframe.style.width = "700px";
  iframe.style.position = "fixed";
  iframe.style.top = "40px";
  iframe.style.right = "40px";
  iframe.style.border = "1px solid black";
  iframe.style.borderRadius = "4px";
  document.getElementById("outer").append(iframe);
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
    console.log("evaling", toEval);
    localStorage.setItem("eval", toEval);

    sandboxedEval(toEval, true);

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
      elFromFocusId[caretId]?.renderCaret();
      elFromFocusId[anchorId]?.renderAnchor();
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
      elFromFocusId[caretId]?.renderCaret();
      elFromFocusId[anchorId]?.renderAnchor();
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
      elFromFocusId[caretId]?.renderCaret();
      elFromFocusId[anchorId]?.renderAnchor();

      calcSelection();
    }
  } else if (discrim(e) && !e.metaKey) {
    pushHistory({
      key: e.key,
      caretId,
      caretPos,
      processedSelection,
      anchorId,
      anchorPos,
      comp: comp([caretId, caretPos], [anchorId, anchorPos]),
    });
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

  const c = new Caret(elFromFocusId[caretId].getCaretopeSink(caretPos));
  if (carryId) c.carrySink = elFromFocusId[carryId].getCaretopeSink(carryPos);
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
  elFromFocusId[caretId]?.renderCaret();
  elFromFocusId[anchorId]?.renderAnchor();

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
