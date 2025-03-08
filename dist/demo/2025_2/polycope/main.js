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
  // -[x] be able to render selections properly
  // -[x] be able create caret anchor pairs on the fly
  // - be able to delete cursors
  // -! be able to act with caret anchor pairs
  //   - other carets should move from insertions/deletions
  //   - match behaviour in a mainstream editor
  // - slider editor
  // - parse selection and replace with slider editor

  const elFromFocusId = {};

  function reset_animation(el) {
    const anim = el.style.animation;
    el.style.animation = "none";
    el.offsetHeight; /* trigger reflow */
    el.style.animation = anim;
  }
  const renderC = (el) => (addr) => {
    const caretContainerRect = e1.getBoundingClientRect();
    const rect = getElFromPos(addr).getBoundingClientRect();

    el.style.height = rect.height - 2;
    el.style.transform = `translate(${rect.right - caretContainerRect.x}px, ${
      rect.y - caretContainerRect.y + 1
    }px)`;
    reset_animation(el);
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
        animation: blink-animation 1.4s steps(2, start) infinite;
        ">
      </span>`;
    const caretEl = new DOMParser().parseFromString(elDef, "text/html").body
      .firstChild;
    e1Wrap.prepend(caretEl);
    // const anchorEl = new DOMParser().parseFromString(elDef, "text/html").body
    //   .firstChild;
    // e1Wrap.prepend(anchorEl);

    // make address
    let cadr = {
      caret: ["init", "init"],
      carry: [null, -1],
      anchor: ["init", "init"],
      selected: [],
      id: "" + Math.random(),
    };
    const setAdr = (adr) => {
      cadr = adr;
    };
    const getAdr = () => cadr;

    // make renderer
    const renderCaret = () => renderC(caretEl)(cadr.caret);
    const renderAnchor = () => {};
    // const renderAnchor = () => renderC(anchorEl)(cadr.anchor);

    // register for rendering
    const cursor = { getAdr, setAdr, renderCaret, renderAnchor };
    cursors.push(cursor);
    return cursor;
  };

  const { setAdr, getAdr } = createCursor();
  const renderCaret = () => {
    cursors.forEach(({ renderCaret }) => renderCaret());
  };
  const renderAnchor = () => {};
  // functional setters for a full adr
  const withCaretAdr = (fullAdr, caret) => ({ ...fullAdr, caret });
  const withCarryAdr = (fullAdr, carry) => ({ ...fullAdr, carry });
  const withAnchorAdr = (fullAdr, anchor) => ({ ...fullAdr, anchor });
  const withPos = ([id, pos], newPos) => [id, newPos];
  const withId = ([id, pos], newId) => [newId, pos];

  let selectionSinks = new Map([[getAdr().id, []]]);

  function getElFromPos([id, pos]) {
    return elFromFocusId[id].querySelector("#" + pos);
  }
  const elFromAdr = ([id, pos]) => elFromFocusId[id];
  function getCaretopeSink(adr) {
    return getElFromPos(adr).caretSink;
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
        adrs: cursors.map((cursor) => cursor.getAdr()),
      });
      bigreduce();
      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
    },
    getSelectionSinks: () => getSelectionSinks(getAdr()),
    calcAndRenderSelection: () => {
      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
    },
    renderCaret: () => renderCaret(getAdr().caret),
    renderAnchor: () => renderAnchor(getAdr().anchor),
    getCaretId: () => getAdr().caret[0],
    setCaretId: (id) => {
      // MULTICURSOR BUG! this won't cut it any more. Need true multicursor support
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
      .map((ed) => indexOfAdr[(ed.parentId, ed.id)]),
    indexOfAdr([id, pos]),
  ];
  const indexOfAdr = (adr) => getElFromPos(adr).pos;
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

  function calcSelection(adr) {
    const ssinks = getSelectionSinks(adr);
    selectionSinks.set(adr.id, ssinks);

    const selected = [];

    ssinks.forEach((c) => {
      if (!c.charEl.isEditorStart) {
        if (c.charEl.isEditor) {
          const isEditorStartSelected = ssinks.includes(
            c.charEl.sink.lines[0][0]
          );
          if (isEditorStartSelected) {
            selected.push([c.charEl.parentId, c.charEl.id]);
          }
        } else {
          selected.push([c.charEl.parentId, c.charEl.id]);
        }
      }
    });
    return selected;
  }
  function clearStyleSelectionSinks() {
    selectionSinks.values().forEach((ssinks) =>
      ssinks.forEach((c) => {
        c.charEl.classList.remove("selected");
        c.charEl.classList.remove("s-l");
        c.charEl.classList.remove("s-r");
      })
    );
  }
  function styleSelectionSinks() {
    selectionSinks.values().forEach((ssinks) => {
      ssinks.forEach((c, i) => {
        if (c.charEl.isEditor) {
          const isEditorStartSelected = ssinks.includes(
            c.charEl.sink.lines[0][0]
          );
          if (isEditorStartSelected) c.charEl.classList.add("selected");
        } else {
          c.charEl.classList.add("selected");
          if (i === 0) c.charEl.classList.add("s-l");
          if (i === ssinks.length - 1) c.charEl.classList.add("s-r");
        }
      });
    });
  }

  //========================================================================
  // BIGREDUCE
  //========================================================================
  function bigreduce() {
    for (const [id, el] of Object.entries(elFromFocusId)) el.reset();
    for (const e of mainline()) {
      for (const adr of e.adrs) {
        // MULTICURSOR BUG! don't even know whats going on here
        // the issue is that we need to act with each cursor individually
        // and let that cursor be updated
        const { setAdr, getAdr } = cursors.find(
          (cursor) => cursor.getAdr().id === adr.id
        );
        setAdr(adr);

        // SELECTION DELEGATION!
        let newAdr = { ...getAdr() };
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
          if (e.key === "Backspace") continue;
        }
        // ACTION!
        elFromAdr(getAdr().caret).act({ ...e, adr: newAdr });
        setAdr(withAnchorAdr(getAdr(), getAdr().caret));
      }
    }

    // CREATE SINKS!
    for (const [id, containerEl] of Object.entries(elFromFocusId)) {
      containerEl.calcLines();
      containerEl.els = containerEl.render();
      containerEl.sink.lines = containerEl.els.map((line) =>
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
            sink.parent = containerEl.sink;
            sink.charEl = charEl;
            charEl.caretSink = sink;
            containerSink.parentContainerSink = containerEl.sink;
            containerSink.charEl = charEl;
            return [containerSink, sink];
          } else {
            const sink = new CaretSink(() => charEl.getBoundingClientRect());
            sink.parent = containerEl.sink;
            sink.charEl = charEl;
            charEl.caretSink = sink;
            return sink;
          }
        })
      );
    }

    renderCaret(getAdr().caret);
    renderAnchor(getAdr().anchor);
    e1.onReduce?.(e1.str.join(""));

    elFromAdr(getAdr().caret).focus();
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
    // console.log("paste!", paste, e);

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

      // console.log(output.map(go));
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
      clearStyleSelectionSinks();
      const newCur = createCursor();
      newCur.setAdr({ ...getAdr(), id: newCur.getAdr().id });
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
      renderCaret();
      renderAnchor();
      return;
    }
    if (e.key === "r" && e.metaKey) {
      e.preventDefault();

      const { setAdr: s, getAdr: g } = createCursor();
      s({ ...getAdr(), id: g().id });
      return;
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
          else res.at(-1).push(a);
        }
        return res;
      };
      const entries = split(
        traverse(getAdr().caret[1])(pp(e1.str.join("")).parse)?.parent
      );
      console.log("entryChars", entries);
      for (const ar of entries) {
        const newCur = createCursor();
        newCur.setAdr({
          ...newCur.getAdr(),
          caret: ["init", ar.at(0).i],
          carry: ["init", ar.at(0).i],
          anchor: ["init", ar.at(-1).i + 1],
        });
      }
      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
      renderCaret();
      renderAnchor();
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
      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
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
      // BUG HERE - why is carry sometimes invalid? Its after inserting
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
        c.caretSink.charEl.id,
      ])
    );

    if (!isSelecting) {
      setAdr(withAnchorAdr(getAdr(), getAdr().caret));
    }
    renderCaret(getAdr().caret);

    clearStyleSelectionSinks();
    for (const { setAdr, getAdr } of cursors)
      setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
    styleSelectionSinks();
    elFromAdr(getAdr().caret).focus();
  }

  return e1;
};

// things I remember removing from 2024_11 polycope:
// - local undo and redo (ctrl+p, ancestorIds)
// - localstorage saved history and serialization/deserialization
// - iframe sandboxed eval
// - history visualizer with sandboxed canvas thumbnails
