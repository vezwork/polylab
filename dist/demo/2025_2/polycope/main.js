import { history } from "./history.js";
import { Caret } from "./caret.js";
import { CaretSink, ContainerSink } from "./caretsink.js";
import { pSelectionString } from "./parse.js";
import { linePos, posFromLinePos, getLine } from "./helpers.js";
import { editor } from "./editor.js";

export const createEditorEnv = () => {
  const caretEl = document.createElement("span");
  caretEl.style.display = "block";
  document.body.prepend(caretEl);
  caretEl.style.position = "absolute";
  caretEl.style.width = "2px";
  caretEl.style.height = "100px";
  caretEl.style.background = "red";
  caretEl.style.pointerEvents = "none";

  const anchorEl = new DOMParser().parseFromString(
    `<span style="
  display:block;
  position: absolute;
  width: 2px;
  height: 100px;
  background: rgb(227, 137, 150);
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

  function getElFromPos(id, pos) {
    const [x, y] = linePos(elFromFocusId[id].str, pos);
    return elFromFocusId[id].els[y][x];
  }
  function renderCaret() {
    const caretContainerRect = e1.getBoundingClientRect();
    const rect = getElFromPos(caretId, caretPos).getBoundingClientRect();

    caretEl.style.height = rect.height;
    caretEl.style.transform = `translate(${
      rect.right - caretContainerRect.x
    }px, ${rect.y - caretContainerRect.y}px)`;
  }
  function renderAnchor() {
    const caretContainerRect = e1.getBoundingClientRect();
    const rect = getElFromPos(anchorId, anchorPos).getBoundingClientRect();

    anchorEl.style.height = rect.height;
    anchorEl.style.transform = `translate(${
      rect.right - caretContainerRect.x
    }px, ${rect.y - caretContainerRect.y}px)`;
  }
  function getCaretopeSink(id, pos) {
    const [x, y] = linePos(elFromFocusId[id].str, pos);
    // remove container sinks so they don't throw off the indexing
    const caretSinkLine = elFromFocusId[id].sink.lines[y].filter(
      (s) => !s.lines
    );
    return caretSinkLine[x];
  }

  function discrim(e) {
    if (e.key.length === 1) return true;
    if (e.key === "Enter") return true;
    if (e.key === "Backspace") return true;
  }
  function bigreduce() {
    for (const [id, el] of Object.entries(elFromFocusId)) el.reset();
    for (const e of mainline()) {
      caretId = e.caretId;
      caretPos = e.caretPos;
      anchorId = e.anchorId;
      anchorPos = e.anchorPos;

      if (e.commentify) {
        const [x, y] = linePos(elFromFocusId[e.caretId].str, e.caretPos);
        const lineIndexes = new Set([
          y,
          ...e.processedSelection.map(
            ([sid, spos]) => linePos(elFromFocusId[sid].str, spos)[1]
          ),
        ]);
        let prevCaretPos = caretPos;
        let prevAnchorPos = anchorPos;
        for (const y of lineIndexes) {
          const pos = posFromLinePos(elFromFocusId[e.caretId].str, [0, y]);
          const line = getLine(elFromFocusId[e.caretId].str, pos);
          if (line.startsWith("//")) {
            caretPos = posFromLinePos(elFromFocusId[e.caretId].str, [2, y]);
            elFromFocusId[e.caretId].act({ key: "Backspace" });
            elFromFocusId[e.caretId].act({ key: "Backspace" });
            // Math.max is used so the caret won't get pushed to the previous line
            if (prevCaretPos > caretPos)
              prevCaretPos = Math.max(prevCaretPos - 2, caretPos);
            if (prevAnchorPos > caretPos)
              prevAnchorPos = Math.max(prevAnchorPos - 2, caretPos);
          } else {
            caretPos = posFromLinePos(elFromFocusId[e.caretId].str, [0, y]);
            elFromFocusId[e.caretId].act({ key: "/" });
            elFromFocusId[e.caretId].act({ key: "/" });
            if (prevCaretPos > caretPos - 2) prevCaretPos += 2;
            if (prevAnchorPos > caretPos - 2) prevAnchorPos += 2;
          }
        }
        caretPos = prevCaretPos;
        anchorPos = prevAnchorPos;
        continue;
      }
      if (e.spacify || e.despacify) {
        const [x, y] = linePos(elFromFocusId[e.caretId].str, e.caretPos);
        const lineIndexes = new Set([
          y,
          ...e.processedSelection.map(
            ([sid, spos]) => linePos(elFromFocusId[sid].str, spos)[1]
          ),
        ]);
        let prevCaretPos = caretPos;
        let prevAnchorPos = anchorPos;
        if (e.spacify) {
          for (const y of lineIndexes) {
            caretPos = posFromLinePos(elFromFocusId[e.caretId].str, [0, y]);
            elFromFocusId[e.caretId].act({ key: " " });
            elFromFocusId[e.caretId].act({ key: " " });
            if (prevCaretPos >= caretPos - 2) prevCaretPos += 2;
            if (prevAnchorPos >= caretPos - 2) prevAnchorPos += 2;
          }
        }
        if (e.despacify) {
          for (const y of lineIndexes) {
            const pos = posFromLinePos(elFromFocusId[e.caretId].str, [2, y]);
            const line = getLine(elFromFocusId[e.caretId].str, pos);
            if (!line.startsWith("  ")) continue;
            caretPos = pos;
            elFromFocusId[e.caretId].act({ key: "Backspace" });
            elFromFocusId[e.caretId].act({ key: "Backspace" });
            // Math.max is used so the caret won't get pushed to the previous line
            if (prevCaretPos > caretPos)
              prevCaretPos = Math.max(prevCaretPos - 2, caretPos);
            if (prevAnchorPos > caretPos)
              prevAnchorPos = Math.max(prevAnchorPos - 2, caretPos);
          }
        }
        caretPos = prevCaretPos;
        anchorPos = prevAnchorPos;
        continue;
      }

      let newE = { ...e };
      if (newE.processedSelection.length > 0) {
        for (const [sid, spos] of newE.processedSelection.toReversed()) {
          // each individual delete action in the selection is delegated
          caretPos = spos;
          caretId = sid;
          elFromFocusId[sid].act({
            key: "Backspace",
          });
        }
        // caret properties are set inside `act`, but the event's caret properties
        // are not, so we need to manually update them
        newE.caretId = caretId;
        newE.caretPos = caretPos;
        newE.anchorId = caretId;
        newE.anchorPos = caretPos;
        anchorId = caretId;
        anchorPos = caretPos;
        processedSelection = [];
        if (newE.key === "Backspace") continue;
      }
      elFromFocusId[newE.caretId].act(newE);
      anchorId = caretId;
      anchorPos = caretPos;
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

    renderCaret();
    renderAnchor();
    e1.onReduce?.(e1.str.join(""));

    elFromFocusId[caretId].focus();
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
    renderCaret,
    pushHistory: (h) => {
      pushHistory(h);
      bigreduce();
    },
    renderAnchor,
    getCaretId: () => caretId,
    setCaretId: (id) => {
      caretId = id;
      carryId = id;
    },
    getCaretPos: () => caretPos,
    setCaretPos: (p) => {
      caretPos = p;
      carryPos = p;
    },
    setAnchorId: (id) => {
      anchorId = id;
    },
    setAnchorPos: (p) => {
      anchorPos = p;
    },
  });
  e1Wrap.append(e1);
  document.body.append(e1Wrap);
  e1.focus();
  e1.render();
  bigreduce();

  const copy = (e) => {
    if (document.activeElement !== e1) return;
    if (processedSelection.length === 0) return;
    const output = calcSelectionString(processedSelection);

    e.clipboardData.setData("text/plain", output);
    e.preventDefault();

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
  e1.addEventListener("scroll", () => {
    renderAnchor();
    renderCaret();
  });
  document.addEventListener("copy", copy);
  document.addEventListener("cut", copy);
  document.addEventListener("paste", (e) => {
    if (document.activeElement !== e1) return;
    let paste = e.clipboardData.getData("text");
    console.log("paste!", paste, e);

    if (paste) {
      // WARNING: COMMENT DISABLING PASTING EDITORS FOR NOW!!!!
      //const output = pSelectionString(paste).parse;
      const output = paste.split("");

      //when will we receive info about renewal?
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

  let localUndoBase = null;
  e1Wrap.addEventListener("keydown", (e) => {
    if (e.key === "Tab") e.preventDefault();
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

      // const toEval = e1.str.join("");
      e1.onSave?.(
        e1.str.join(""),
        selection.map((s) => s.charEl.innerText).join("")
      );

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
    } else if (e.key === "Tab" && e.shiftKey) {
      pushHistory({
        despacify: true,
        caretId,
        caretPos,
        processedSelection,
        anchorId,
        anchorPos,
        comp: comp([caretId, caretPos], [anchorId, anchorPos]),
      });
      bigreduce();
      calcSelection();
    } else if (e.key === "Tab") {
      pushHistory({
        spacify: true,
        caretId,
        caretPos,
        processedSelection,
        anchorId,
        anchorPos,
        comp: comp([caretId, caretPos], [anchorId, anchorPos]),
      });
      bigreduce();
      calcSelection();
    } else if (e.key === "/" && e.metaKey) {
      pushHistory({
        commentify: true,
        caretId,
        caretPos,
        processedSelection,
        anchorId,
        anchorPos,
        comp: comp([caretId, caretPos], [anchorId, anchorPos]),
      });
      bigreduce();
      calcSelection();
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
      e.preventDefault();
      const res = undo();

      bigreduce();
      // add back selection/carets on undo
      if (res[1]?.processedSelection?.length > 0) {
        anchorId = res[1].anchorId;
        anchorPos = res[1].anchorPos;
        caretPos = res[1].caretPos;
        caretId = res[1].caretId;
        renderCaret();
        renderAnchor();

        calcSelection();
      } else {
        anchorId = res[1].caretId;
        anchorPos = res[1].caretPos;
        caretPos = res[1].caretPos;
        caretId = res[1].caretId;
        renderCaret();
        renderAnchor();
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
    });

    const c = new Caret(getCaretopeSink(caretId, caretPos));
    if (dir === "left" || dir === "right") {
      carryId = null;
    }
    if (dir === "up" || dir === "down") {
      if (carryId === null) {
        carryId = caretId;
        carryPos = caretPos;
      }
    }
    if (carryId) {
      c.carrySink = getCaretopeSink(carryId, carryPos);
    }
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
            (c.caretSink.isFirst() || c.caretSink.isLast())
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
            (c.caretSink.isFirst() || c.caretSink.isLast())
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
    renderCaret();
    renderAnchor();

    calcSelection();
  }

  function calcSelectionString(processedSelection) {
    let balance = 0;
    const inner = processedSelection
      .map((v) => {
        const s = getSink(v);
        if (s.isFirst()) balance++;
        if (s.isAfterEditorSink) {
          balance--;
          return "<)";
        }
        return s.isFirst() ? "(>" : "" + s.charEl.innerText;
      })
      .join("");
    let prefix = balance < 0 ? "(>".repeat(Math.abs(balance)) : "";
    let postfix = balance > 0 ? "<)".repeat(balance) : "";
    return prefix + inner + postfix;
  }

  function calcSelection() {
    selection = selectionSinks();
    processedSelection = [];
    selection.forEach((c) => {
      if (c.charEl.isEditor) {
        const isEditorStartSelected =
          c.charEl.sink.lines[0][0].charEl.classList.contains("selected");
        if (isEditorStartSelected) {
          c.charEl.classList.add("selected");
          if (!c.charEl.isEditorStart) {
            processedSelection.push([c.charEl.parentId, c.charEl.pos]);
            c.charEl.isSelected = true;
          }
        }
      }
      if (!c.charEl.isEditor) {
        c.charEl.classList.add("selected");
        if (!c.charEl.isEditorStart) {
          processedSelection.push([c.charEl.parentId, c.charEl.pos]);
          c.charEl.isSelected = true;
        }
      }
    });
  }

  e1Wrap.prepend(caretEl);
  e1Wrap.prepend(anchorEl);

  return e1;
};
