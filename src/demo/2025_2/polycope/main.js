import { history } from "./history.js";
import { Caret } from "./caret.js";
import { CaretSink, ContainerSink } from "./caretsink.js";
import { pSelectionString } from "./parse.js";
import { linePos, posFromLinePos, getLine } from "./helpers.js";
import { editor } from "./editor.js";
import { pp } from "./structure_parse.js";

export const createEditorEnv = () => {
  //========================================================================
  // CARET ELEMENTS
  //========================================================================
  const caretEl = new DOMParser().parseFromString(
    `<span style="
      display:block;
      position: absolute;
      width: 2px;
      height: 100px;
      background: purple;
      pointer-events: none;
      ">
    </span>`,
    "text/html"
  ).body.firstChild;
  document.body.prepend(caretEl);
  const anchorEl = new DOMParser().parseFromString(
    `<span style="
      display:block;
      position: absolute;
      width: 2px;
      height: 100px;
      background: rgb(227, 137, 150);
      pointer-events: none;
      ">
    </span>`,
    "text/html"
  ).body.firstChild;
  document.body.prepend(anchorEl);

  //========================================================================
  // HISTORY, CARET INIT AND HELPERS
  //========================================================================
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

  const elFromFocusId = {};

  let caretAdr = ["init", 0];
  let carryAdr = [null, -1];
  let anchorAdr = ["init", 0];
  const withPos = ([id, pos], newPos) => [id, newPos];
  const withId = ([id, pos], newId) => [newId, pos];

  let selection = [];
  let processedSelection = [];

  function getElFromPos([id, pos]) {
    const [x, y] = linePos(elFromFocusId[id].str, pos);
    return elFromFocusId[id].els[y][x];
  }
  const renderC = (el) => (addr) => {
    const caretContainerRect = e1.getBoundingClientRect();
    const rect = getElFromPos(addr).getBoundingClientRect();

    el.style.height = rect.height;
    el.style.transform = `translate(${rect.right - caretContainerRect.x}px, ${
      rect.y - caretContainerRect.y
    }px)`;
  };
  const renderCaret = renderC(caretEl);
  const renderAnchor = renderC(anchorEl);
  const lineFromAdr = ([id, pos]) => getLine(elFromFocusId[id].str, pos);
  const linePosFromAdr = ([id, pos]) => linePos(elFromFocusId[id].str, pos);
  const posFromAdrAndLinePos = ([id, pos], linePos) =>
    posFromLinePos(elFromFocusId[id].str, linePos);
  const elFromAdr = ([id, pos]) => elFromFocusId[id];
  function getCaretopeSink(adr) {
    const [x, y] = linePosFromAdr(adr);
    // remove container sinks so they don't throw off the indexing
    const caretSinkLine = elFromAdr(adr).sink.lines[y].filter((s) => !s.lines);
    return caretSinkLine[x];
  }
  const getCaret = (a) => new Caret(getCaretopeSink(a));

  //========================================================================
  // SELECTION STUFF
  //========================================================================
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
  const selectionSinks = () => {
    const result = [];

    const anchorSink = getCaretopeSink(anchorAdr);
    if (!anchorSink || !getCaretopeSink(caretAdr)) return [];
    const [min, max] = minAndMax(caretAdr, anchorAdr);
    const selC = getCaret(min);
    const maxSink = getCaretopeSink(max);
    while (selC.caretSink && selC.caretSink !== maxSink) {
      selC.moveRight();
      result.push(selC.caretSink);
    }
    return result;
  };
  function calcSelectionString(processedSelection) {
    let balance = 0;
    const inner = processedSelection
      .map((v) => {
        const s = getCaretopeSink(v);
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

  //========================================================================
  // INIT EDITOR
  //========================================================================
  const e1Wrap = document.createElement("div");
  e1Wrap.classList.add("editor-wrapper");
  const e1 = editor("init", undefined, {
    elFromFocusId,
    selectionSinks,
    calcSelection,
    renderCaret: () => renderCaret(caretAdr),
    pushHistory: (h) => {
      pushHistory({
        ...h,
        caretAdr,
        anchorAdr,
        processedSelection,
        comp: comp(caretAdr, anchorAdr),
      });
      bigreduce();
      calcSelection();
    },
    renderAnchor: () => renderAnchor(anchorAdr),
    getCaretId: () => caretAdr[0],
    setCaretId: (id) => {
      caretAdr = withId(caretAdr, id);
      carryAdr = withId(carryAdr, id);
    },
    getCaretPos: () => caretAdr[1],
    setCaretPos: (p) => {
      caretAdr = withPos(caretAdr, p);
      carryAdr = withPos(carryAdr, p);
    },
    setAnchorId: (id) => {
      anchorAdr = withId(anchorAdr, id);
    },
    setAnchorPos: (p) => {
      anchorAdr = withPos(anchorAdr, p);
    },
  });
  e1Wrap.append(e1);
  document.body.append(e1Wrap);
  e1.focus();
  e1.render();
  bigreduce();
  e1Wrap.prepend(caretEl);
  e1Wrap.prepend(anchorEl);

  //========================================================================
  // BIGREDUCE
  //========================================================================
  function bigreduce() {
    for (const [id, el] of Object.entries(elFromFocusId)) el.reset();
    for (const e of mainline()) {
      caretAdr = e.caretAdr;
      anchorAdr = e.anchorAdr;

      if (e.commentify) {
        const [x, y] = linePosFromAdr(caretAdr);
        const lineIndexes = new Set([
          y,
          ...e.processedSelection.map(linePosFromAdr).map(([x, y]) => y),
        ]);
        let prevCaretPos = caretAdr[1];
        let prevAnchorPos = anchorAdr[1];
        for (const y of lineIndexes) {
          const pos = posFromAdrAndLinePos(caretAdr, [0, y]);
          const line = lineFromAdr(withPos(caretAdr, pos));
          if (line.startsWith("//")) {
            caretAdr = withPos(
              caretAdr,
              posFromAdrAndLinePos(caretAdr, [2, y])
            );
            elFromAdr(caretAdr).act({ key: "Backspace" });
            elFromAdr(caretAdr).act({ key: "Backspace" });
            // Math.max is used so the caret won't get pushed to the previous line
            if (prevCaretPos > caretAdr[1])
              prevCaretPos = Math.max(prevCaretPos - 2, caretAdr[1]);
            if (prevAnchorPos > caretAdr[1])
              prevAnchorPos = Math.max(prevAnchorPos - 2, caretAdr[1]);
          } else {
            caretAdr = withPos(
              caretAdr,
              posFromAdrAndLinePos(caretAdr, [0, y])
            );
            elFromAdr(caretAdr).act({ key: "/" });
            elFromAdr(caretAdr).act({ key: "/" });
            if (prevCaretPos > caretAdr[1] - 2) prevCaretPos += 2;
            if (prevAnchorPos > caretAdr[1] - 2) prevAnchorPos += 2;
          }
        }
        caretAdr = withPos(caretAdr, prevCaretPos);
        anchorAdr = withPos(anchorAdr, prevAnchorPos);
        continue;
      }
      if (e.spacify || e.despacify) {
        const [x, y] = linePosFromAdr(caretAdr);
        const lineIndexes = new Set([
          y,
          ...e.processedSelection.map(linePosFromAdr).map(([x, y]) => y),
        ]);
        let prevCaretPos = caretAdr[1];
        let prevAnchorPos = anchorAdr[1];
        if (e.spacify) {
          for (const y of lineIndexes) {
            caretAdr = withPos(
              caretAdr,
              posFromAdrAndLinePos(caretAdr, [0, y])
            );
            elFromAdr(caretAdr).act({ key: " " });
            elFromAdr(caretAdr).act({ key: " " });
            if (prevCaretPos > caretAdr[1] - 2) prevCaretPos += 2;
            if (prevAnchorPos > caretAdr[1] - 2) prevAnchorPos += 2;
          }
        }
        if (e.despacify) {
          for (const y of lineIndexes) {
            const pos = posFromAdrAndLinePos(caretAdr, [2, y]);
            const line = lineFromAdr([caretAdr[0], pos]);
            if (!line.startsWith("  ")) continue;
            caretAdr = withPos(caretAdr, pos);
            elFromAdr(caretAdr).act({ key: "Backspace" });
            elFromAdr(caretAdr).act({ key: "Backspace" });
            // Math.max is used so the caret won't get pushed to the previous line
            if (prevCaretPos > caretAdr[1])
              prevCaretPos = Math.max(prevCaretPos - 2, caretAdr[1]);
            if (prevAnchorPos > caretAdr[1])
              prevAnchorPos = Math.max(prevAnchorPos - 2, caretAdr[1]);
          }
        }
        caretAdr = withPos(caretAdr, prevCaretPos);
        anchorAdr = withPos(anchorAdr, prevAnchorPos);
        continue;
      }

      let newE = { ...e };
      if (newE.processedSelection.length > 0) {
        for (const adr of newE.processedSelection.toReversed()) {
          // each individual delete action in the selection is delegated
          caretAdr = adr;
          elFromAdr(adr).act({
            key: "Backspace",
          });
        }
        // caret properties are set inside `act`, but the event's caret properties
        // are not, so we need to manually update them
        newE.caretAdr = caretAdr;
        newE.anchorAdr = caretAdr;
        anchorAdr = caretAdr;
        processedSelection = [];
        if (newE.key === "Backspace") continue;
      }
      elFromAdr(caretAdr).act(newE);
      anchorAdr = caretAdr;
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

    renderCaret(caretAdr);
    renderAnchor(anchorAdr);
    e1.onReduce?.(e1.str.join(""));

    elFromAdr(caretAdr).focus();

    // structural parsing experiment
    const traverse = (i) => (ob) =>
      Array.isArray(ob)
        ? ob.flatMap(traverse(i)).filter((a) => a !== null)[0]
        : ob.i === i || ob.i === i - 1
        ? ob
        : null;
    const split = (ar = []) => {
      let res = [[]];
      for (const a of ar) {
        if (a.char === ",") res.push([]);
        else res.at(-1).push(a.char);
      }
      return res;
    };
    // const otherEntriesParse = split(
    //   traverse(caretAdr[0])(pp(e1.str.join("")).parse)?.parent
    // );
    // now I _just_ need multicursors!
  }

  //========================================================================
  // COPY, PASTE, KEYDOWN, and MOVECARET
  //========================================================================
  const copy = (e) => {
    if (!e1.contains(document.activeElement)) return;
    if (processedSelection.length === 0) return;
    const output = calcSelectionString(processedSelection);

    e.clipboardData.setData("text/plain", output);
    e.preventDefault();

    if (e.type === "cut") {
      pushHistory({
        key: "Backspace",
        caretAdr,
        anchorAdr,
        processedSelection,
        comp: comp(caretAdr, anchorAdr),
      });
      bigreduce();
    }
  };
  e1.addEventListener("scroll", () => {
    renderCaret(caretAdr);
    renderAnchor(anchorAdr);
  });
  document.addEventListener("copy", copy);
  document.addEventListener("cut", copy);
  document.addEventListener("paste", (e) => {
    if (!e1.contains(document.activeElement)) return;
    let paste = e.clipboardData.getData("text");
    console.log("paste!", paste, e);

    if (paste) {
      const output = pSelectionString(paste).parse;
      //const output = paste.split("");

      const go = (v) =>
        Array.isArray(v)
          ? {
              id: Math.random() + "",
              data: v.map(go),
            }
          : v;

      console.log(output.map(go));
      pushHistory({
        paste: output.map(go),
        caretAdr,
        anchorAdr,
        processedSelection,
        comp: comp(caretAdr, anchorAdr),
      });
      bigreduce();
    }
  });

  let localUndoBase = null;
  e1Wrap.addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      if (e.key === "ArrowDown") moveCaret("down", e.shiftKey, e.metaKey);
      if (e.key === "ArrowUp") moveCaret("up", e.shiftKey, e.metaKey);
      if (e.key === "ArrowLeft") moveCaret("left", e.shiftKey, e.metaKey);
      if (e.key === "ArrowRight") moveCaret("right", e.shiftKey, e.metaKey);
      return;
    }
    if (e.key === "a" && e.metaKey) {
      e.preventDefault();
      moveCaret("up", false, true);
      moveCaret("down", true, true);
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

    if (e.key === "c" && e.metaKey) {
    } else if (e.key === "x" && e.metaKey) {
    } else if (e.key === "v" && e.metaKey) {
    } else if (e.key === "p" && e.metaKey && e.shiftKey) {
      const restoredAction = restoreFirstThat((d) =>
        ancestorIds(d.caretAdr[0]).includes(localUndoBase)
      );
      e.preventDefault();
      bigreduce();
      // TODO: BUGFIX: I need to set these to the values after acting on the restored action
      // so I need a way to access those...
      // I could make bigreduce an iterable and detect when that history item appears
      if (restoredAction) {
        bigreduce();
        anchorAdr = restoredAction.anchorAdr;
        caretAdr = restoredAction.caretAdr;
        renderCaret(caretAdr);
        renderAnchor(anchorAdr);
      }
    } else if (e.key === "p" && e.metaKey) {
      localUndoBase = localUndoBase ?? caretAdr[0];
      const removedAction = removeLastThat((d) =>
        ancestorIds(d.caretAdr[0]).includes(localUndoBase)
      );
      e.preventDefault();

      if (removedAction) {
        bigreduce();
        anchorAdr = removedAction.anchorAdr;
        caretAdr = removedAction.caretAdr;
        renderCaret(caretAdr);
        renderAnchor(anchorAdr);
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
        anchorAdr = res[1].anchorAdr;
        caretAdr = res[1].caretAdr;
        renderCaret(caretAdr);
        renderAnchor(anchorAdr);

        calcSelection();
      } else {
        anchorAdr = res[1].anchorAdr;
        caretAdr = res[1].caretAdr;
        renderCaret(caretAdr);
        renderAnchor(anchorAdr);
      }
    }
  });

  function moveCaret(dir, isSelecting, isJumping) {
    selectionSinks().forEach((c) => {
      c.charEl.isSelected = false;
      c.charEl.classList.remove("selected");
    });

    const c = getCaret(caretAdr);
    if (dir === "left" || dir === "right") {
      carryAdr = withId(carryAdr, null);
    }
    if (dir === "up" || dir === "down") {
      if (carryAdr[0] === null) {
        carryAdr = caretAdr;
      }
    }
    if (carryAdr[0]) {
      c.carrySink = getCaretopeSink(carryAdr);
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
    caretAdr = [c.caretSink.charEl.parentId, c.caretSink.charEl.pos];
    if (!isSelecting) {
      anchorAdr = caretAdr;
    }
    renderCaret(caretAdr);
    renderAnchor(anchorAdr);

    calcSelection();
    elFromAdr(caretAdr).focus();
  }

  return e1;
};
