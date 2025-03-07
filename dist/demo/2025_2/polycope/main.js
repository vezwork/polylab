import { history } from "./history.js";
import { Caret } from "./caret.js";
import { CaretSink, ContainerSink } from "./caretsink.js";
import { pSelectionString } from "./parse.js";
import { linePos, posFromLinePos, getLine } from "./helpers.js";
import { editor } from "./editor.js";
import { pp } from "./structure_parse.js";

export const createEditorEnv = () => {
  //========================================================================
  // HISTORY, ELEMENT, CARET INIT AND HELPERS
  //========================================================================
  const e1Wrap = document.createElement("div");
  e1Wrap.classList.add("editor-wrapper");

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

  // what is my goal?
  // - multicursors with selection
  // what do I need to do?
  // -[x] be able to create caret anchor pairs
  // -[x] be able to move caret anchor pairs
  // - be able to render selections properly
  // - be able create caret anchor pairs on the fly
  // - be able to act with caret anchor pairs

  const elFromFocusId = {};

  const renderC = (el) => (addr) => {
    const caretContainerRect = e1.getBoundingClientRect();
    const rect = getElFromPos(addr).getBoundingClientRect();

    el.style.height = rect.height;
    el.style.transform = `translate(${rect.right - caretContainerRect.x}px, ${
      rect.y - caretContainerRect.y
    }px)`;
  };

  const cursors = [];
  const createCursor = () => {
    // make element
    const elDef = `<span style="
        display:block;
        position: absolute;
        width: 2px;
        height: 100px;
        background: black;
        pointer-events: none;
        ">
      </span>`;
    const caretEl = new DOMParser().parseFromString(elDef, "text/html").body
      .firstChild;
    e1Wrap.prepend(caretEl);
    const anchorEl = new DOMParser().parseFromString(elDef, "text/html").body
      .firstChild;
    e1Wrap.prepend(anchorEl);

    // make address
    let cadr = {
      caret: ["init", 0],
      carry: [null, -1],
      anchor: ["init", 0],
      selected: [],
    };
    const setAdr = (adr) => {
      cadr = adr;
    };
    const getAdr = () => cadr;

    // make renderer
    const renderCaret = () => renderC(caretEl)(cadr.caret);
    const renderAnchor = () => renderC(anchorEl)(cadr.anchor);

    // register for rendering
    cursors.push({ adr: cadr, renderCaret, renderAnchor });
    return { getAdr, setAdr, renderCaret, renderAnchor };
  };
  // almost there... setting and getting the adr inside of bigreduce is causing me strife though

  const {
    setAdr,
    getAdr,
    renderCaret: rc1,
    renderAnchor: ra1,
  } = createCursor();
  const {
    setAdr: sa2,
    getAdr: ga2,
    renderCaret: rc2,
    renderAnchor: ra2,
  } = createCursor();
  const renderCaret = () => {
    rc1();
    rc2();
  };
  const renderAnchor = () => {
    ra1();
    ra2();
  };
  // functional setters for a full adr
  const withCaretAdr = (fullAdr, caret) => ({ ...fullAdr, caret });
  const withCarryAdr = (fullAdr, carry) => ({ ...fullAdr, carry });
  const withAnchorAdr = (fullAdr, anchor) => ({ ...fullAdr, anchor });
  const withPos = ([id, pos], newPos) => [id, newPos];
  const withId = ([id, pos], newId) => [newId, pos];

  let selectionSinks = [];

  function getElFromPos([id, pos]) {
    const [x, y] = linePos(elFromFocusId[id].str, pos);
    return elFromFocusId[id].els[y][x];
  }

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
  // INIT EDITOR
  //========================================================================
  const e1 = editor("init", undefined, {
    elFromFocusId,
    pushHistory: (h) => {
      pushHistory({
        ...h,
        adrs: [getAdr()],
      });
      bigreduce();
      setAdr({ ...getAdr(), selected: calcAndRenderSelection(getAdr()) });
    },
    getSelectionSinks: () => getSelectionSinks(getAdr()),
    calcAndRenderSelection: () => {
      setAdr({ ...getAdr(), selected: calcAndRenderSelection(getAdr()) });
    },
    renderCaret: () => renderCaret(getAdr().caret),
    renderAnchor: () => renderAnchor(getAdr().anchor),
    getCaretId: () => getAdr().caret[0],
    setCaretId: (id) => {
      setAdr(withCaretAdr(getAdr(), withId(getAdr().caret, id)));
      setAdr(withCarryAdr(getAdr(), withId(getAdr().carry, id)));
    },
    getCaretPos: () => getAdr().caret[1],
    setCaretPos: (p) => {
      setAdr(withCaretAdr(getAdr(), withPos(getAdr().caret, p)));
      setAdr(withCarryAdr(getAdr(), withPos(getAdr().carry, p)));
    },
    setAnchorId: (id) => {
      setAdr(withAnchorAdr(getAdr(), withId(getAdr().anchor, id)));
    },
    setAnchorPos: (p) => {
      setAdr(withAnchorAdr(getAdr(), withPos(getAdr().anchor, p)));
    },
  });
  e1Wrap.append(e1);
  document.body.append(e1Wrap);
  e1.focus();
  bigreduce();

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
  function getSelectionSinks(adr) {
    const result = [];

    const anchorSink = getCaretopeSink(adr.anchor);
    if (!anchorSink || !getCaretopeSink(adr.caret)) return [];
    const [min, max] = minAndMax(adr.caret, adr.anchor);
    const selC = getCaret(min);
    const maxSink = getCaretopeSink(max);
    while (selC.caretSink && selC.caretSink !== maxSink) {
      selC.moveRight();
      result.push(selC.caretSink);
    }
    return result;
  }

  function calcAndRenderSelection(adr) {
    renderSelection(adr);

    const selected = [];
    selectionSinks.forEach((c) => {
      if (!c.charEl.isEditorStart) {
        if (c.charEl.isEditor) {
          const isEditorStartSelected =
            c.charEl.sink.lines[0][0].charEl.classList.contains("selected");
          if (isEditorStartSelected) {
            selected.push([c.charEl.parentId, c.charEl.pos]);
          }
        } else {
          selected.push([c.charEl.parentId, c.charEl.pos]);
        }
      }
    });
    return selected;
  }
  function renderSelection(adr) {
    selectionSinks.forEach((c) => {
      c.charEl.classList.remove("selected");
    });
    // NOTE! GLOBAL VAR `selectionSinks` IS SET HERE
    selectionSinks = getSelectionSinks(adr);
    selectionSinks.forEach((c) => {
      if (c.charEl.isEditor) {
        const isEditorStartSelected =
          c.charEl.sink.lines[0][0].charEl.classList.contains("selected");
        if (isEditorStartSelected) c.charEl.classList.add("selected");
      } else c.charEl.classList.add("selected");
    });
  }

  //========================================================================
  // BIGREDUCE
  //========================================================================
  function bigreduce() {
    for (const [id, el] of Object.entries(elFromFocusId)) el.reset();
    for (const e of mainline()) {
      for (const adr of e.adrs) {
        setAdr(withCaretAdr(getAdr(), adr.caret));
        setAdr(withAnchorAdr(getAdr(), adr.anchor));

        if (e.commentify) {
          const [x, y] = linePosFromAdr(getAdr().caret);
          const lineIndexes = new Set([
            y,
            ...adr.selected.map(linePosFromAdr).map(([x, y]) => y),
          ]);
          let prevCaretPos = getAdr().caret[1];
          let prevAnchorPos = getAdr().anchor[1];
          for (const y of lineIndexes) {
            const pos = posFromAdrAndLinePos(getAdr().caret, [0, y]);
            const line = lineFromAdr(withPos(getAdr().caret, pos));
            if (line.startsWith("//")) {
              setAdr(
                withCaretAdr(
                  getAdr(),
                  withPos(
                    getAdr().caret,
                    posFromAdrAndLinePos(getAdr().caret, [2, y])
                  )
                )
              );
              elFromAdr(getAdr().caret).act({ key: "Backspace" });
              elFromAdr(getAdr().caret).act({ key: "Backspace" });
              // Math.max is used so the caret won't get pushed to the previous line
              if (prevCaretPos > getAdr().caret[1])
                prevCaretPos = Math.max(prevCaretPos - 2, getAdr().caret[1]);
              if (prevAnchorPos > getAdr().caret[1])
                prevAnchorPos = Math.max(prevAnchorPos - 2, getAdr().caret[1]);
            } else {
              setAdr(
                withCaretAdr(
                  getAdr(),
                  withPos(
                    getAdr().caret,
                    posFromAdrAndLinePos(getAdr().caret, [0, y])
                  )
                )
              );
              elFromAdr(getAdr().caret).act({ key: "/" });
              elFromAdr(getAdr().caret).act({ key: "/" });
              if (prevCaretPos > getAdr().caret[1] - 2) prevCaretPos += 2;
              if (prevAnchorPos > getAdr().caret[1] - 2) prevAnchorPos += 2;
            }
          }
          setAdr(withCaretAdr(getAdr(), withPos(getAdr().caret, prevCaretPos)));
          setAdr(
            withAnchorAdr(getAdr(), withPos(getAdr().anchor, prevAnchorPos))
          );
          continue;
        }
        if (e.spacify || e.despacify) {
          const [x, y] = linePosFromAdr(getAdr().caret);
          const lineIndexes = new Set([
            y,
            ...adr.selected.map(linePosFromAdr).map(([x, y]) => y),
          ]);
          let prevCaretPos = getAdr().caret[1];
          let prevAnchorPos = getAdr().anchor[1];
          if (e.spacify) {
            for (const y of lineIndexes) {
              setAdr(
                withCaretAdr(
                  getAdr(),
                  withPos(
                    getAdr().caret,
                    posFromAdrAndLinePos(getAdr().caret, [0, y])
                  )
                )
              );
              elFromAdr(getAdr().caret).act({ key: " " });
              elFromAdr(getAdr().caret).act({ key: " " });
              if (prevCaretPos > getAdr().caret[1] - 2) prevCaretPos += 2;
              if (prevAnchorPos > getAdr().caret[1] - 2) prevAnchorPos += 2;
            }
          }
          if (e.despacify) {
            for (const y of lineIndexes) {
              setAdr(
                withCaretAdr(
                  getAdr(),
                  withPos(
                    getAdr().caret,
                    posFromAdrAndLinePos(getAdr().caret, [2, y])
                  )
                )
              );
              const line = lineFromAdr([getAdr().caret[0], pos]);
              if (!line.startsWith("  ")) continue;
              setAdr(withCaretAdr(getAdr(), withPos(getAdr().caret, pos)));
              elFromAdr(getAdr().caret).act({ key: "Backspace" });
              elFromAdr(getAdr().caret).act({ key: "Backspace" });
              // Math.max is used so the caret won't get pushed to the previous line
              if (prevCaretPos > getAdr().caret[1])
                prevCaretPos = Math.max(prevCaretPos - 2, getAdr().caret[1]);
              if (prevAnchorPos > getAdr().caret[1])
                prevAnchorPos = Math.max(prevAnchorPos - 2, getAdr().caret[1]);
            }
          }
          setAdr(withCaretAdr(getAdr(), withPos(getAdr().caret, prevCaretPos)));
          setAdr(
            withAnchorAdr(getAdr(), withPos(getAdr().anchor, prevAnchorPos))
          );
          continue;
        }

        let newAdr = { ...adr };
        if (newAdr.selected.length > 0) {
          for (const selCaretAdr of newAdr.selected.toReversed()) {
            // each individual delete action in the selection is delegated
            setAdr(withCaretAdr(getAdr(), selCaretAdr));
            elFromAdr(selCaretAdr).act({
              key: "Backspace",
            });
          }
          // caret properties are set inside `act`, but the event's caret properties
          // are not, so we need to manually update them
          newAdr = withAnchorAdr(getAdr(), getAdr().caret);
          setAdr(withAnchorAdr(getAdr(), getAdr().caret));
          setAdr({ ...getAdr(), selected: [] });
        }
        elFromAdr(getAdr().caret).act({ ...e, adr: newAdr });
        setAdr(withAnchorAdr(getAdr(), getAdr().caret));
      }
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

    renderCaret(getAdr().caret);
    renderAnchor(getAdr().anchor);
    e1.onReduce?.(e1.str.join(""));

    elFromAdr(getAdr().caret).focus();

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
    //   traverse(adr.caret[0])(pp(e1.str.join("")).parse)?.parent
    // );
    // now I _just_ need multicursors!
  }

  //========================================================================
  // COPY, PASTE, KEYDOWN, and MOVECARET
  //========================================================================
  const copy = (e) => {
    if (!e1.contains(document.activeElement)) return;
    if (getAdr().selected.length === 0) return;
    const output = calcSelectionString(getAdr().selected);

    e.clipboardData.setData("text/plain", output);
    e.preventDefault();

    if (e.type === "cut") {
      pushHistory({
        key: "Backspace",
        adrs: [getAdr()],
      });
      bigreduce();
    }
  };
  function calcSelectionString(selected) {
    let balance = 0;
    const inner = selected
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
  e1.addEventListener("scroll", () => {
    renderCaret(getAdr().caret);
    renderAnchor(getAdr().anchor);
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
        adrs: [getAdr()],
      });
      bigreduce();
    }
  });

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
    if (e.key === "e" && e.metaKey) {
      e.preventDefault();
      sa2(getAdr());
      sa2({ ...ga2(), selected: calcAndRenderSelection(ga2()) });
      renderCaret(getAdr().caret);
      renderAnchor(getAdr().anchor);
      return;
    }
    if (e.key === "s" && e.metaKey) {
      // eval
      e.preventDefault();

      // const toEval = e1.str.join("");
      e1.onSave?.(
        e1.str.join(""),
        selectionSinks.map((s) => s.charEl.innerText).join("")
      );

      return;
    }

    if (e.key === "c" && e.metaKey) {
    } else if (e.key === "x" && e.metaKey) {
    } else if (e.key === "v" && e.metaKey) {
    } else if (e.key === "z" && e.metaKey && e.shiftKey) {
      redo();
      bigreduce();
    } else if (e.key === "z" && e.metaKey) {
      e.preventDefault();
      const res = undo();

      bigreduce();
      // add back selection/carets on undo
      setAdr(res[1].adrs[0]);
      setAdr({ ...getAdr(), selected: calcAndRenderSelection(getAdr()) });
      renderCaret(getAdr().caret);
      renderAnchor(getAdr().anchor);
    }
  });

  // manages selection, carry, rendering carets, setting addresses
  function moveCaret(dir, isSelecting, isJumping) {
    const c = getCaret(getAdr().caret);
    if (dir === "left" || dir === "right") {
      setAdr(withCarryAdr(getAdr(), withId(getAdr().carry, null)));
    }
    if (dir === "up" || dir === "down") {
      if (getAdr().carry[0] === null) {
        setAdr(withCarryAdr(getAdr(), getAdr().caret));
      }
    }
    if (getAdr().carry[0]) {
      c.carrySink = getCaretopeSink(getAdr().carry);
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
    setAdr(
      withCaretAdr(getAdr(), [
        c.caretSink.charEl.parentId,
        c.caretSink.charEl.pos,
      ])
    );

    if (!isSelecting) {
      setAdr(withAnchorAdr(getAdr(), getAdr().caret));
    }
    renderCaret(getAdr().caret);
    renderAnchor(getAdr().anchor);

    setAdr({ ...getAdr(), selected: calcAndRenderSelection(getAdr()) });
    elFromAdr(getAdr().caret).focus();
  }

  return e1;
};

// things I remember removing from 2024_11 polycope:
// - local undo and redo (ctrl+p, ancestorIds)
// - localstorage saved history and serialization/deserialization
// - iframe sandboxed eval
// - history visualizer with sandboxed canvas thumbnails
