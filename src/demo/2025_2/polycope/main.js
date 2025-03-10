import { history } from "./history.js";
import { Caret } from "./caret.js";
import { CaretSink, ContainerSink } from "./caretsink.js";
import { pSelectionString } from "./parse.js";
import {
  linePos,
  posFromLinePos,
  getLine,
  vertDistPointToLineEl,
  distMouseEventToEl,
  makeid,
} from "./helpers.js";
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
    try {
      const caretContainerRect = e1.getBoundingClientRect();
      const rect = getElFromPos(addr).getBoundingClientRect();

      el.style.height = rect.height - 2;
      el.style.transform = `translate(${rect.right - caretContainerRect.x}px, ${
        rect.y - caretContainerRect.y + 1
      }px)`;
      reset_animation(el);
    } catch (e) {
      console.error("caret render fail", el, addr, e);
    }
  };

  let cursors = [];
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
    const removeCaretEl = () => caretEl.remove();

    // register for rendering
    const cursor = { getAdr, setAdr, renderCaret, removeCaretEl };
    cursors.push(cursor);
    return cursor;
  };
  const removeCursor = (cursor) => {
    cursors = cursors.filter((c) => c !== cursor);
    cursor.removeCaretEl();
  };

  const mainCursor = createCursor();
  const renderCaret = () => {
    cursors.forEach(({ renderCaret }) => renderCaret());
  };
  // functional setters for a full adr
  const withCaretAdr = (fullAdr, caret) => ({ ...fullAdr, caret });
  const withCarryAdr = (fullAdr, carry) => ({ ...fullAdr, carry });
  const withAnchorAdr = (fullAdr, anchor) => ({ ...fullAdr, anchor });
  const withPos = ([id, pos], newPos) => [id, newPos];
  const withId = ([id, pos], newId) => [newId, pos];

  let selectionSinks = new Map([[mainCursor.getAdr().id, []]]);

  function getElFromPos([id, pos]) {
    return elFromFocusId[id].querySelector("#" + pos);
  }
  const elFromAdr = ([id, pos]) => elFromFocusId[id];
  function getCaretopeSink(adr) {
    return getElFromPos(adr)?.caretSink;
  }
  const getCaret = (a) => new Caret(getCaretopeSink(a));

  //========================================================================
  // INIT EDITOR
  //========================================================================
  const e1 = editor("init", undefined, {
    getCursors: () => cursors,
    elFromFocusId,
    calcAndRenderSelection: () => {
      renderCaret();
      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
    },
    setCaretId: (id) => {
      for (const cursor of cursors) {
        if (cursor.getAdr().id !== mainCursor.getAdr().id) removeCursor(cursor);
      }
      // MULTICURSOR BUG! this won't cut it any more. Need true multicursor support
      mainCursor.setAdr(
        withCaretAdr(mainCursor.getAdr(), withId(mainCursor.getAdr().caret, id))
      );
      mainCursor.setAdr(
        withCarryAdr(mainCursor.getAdr(), withId(mainCursor.getAdr().carry, id))
      );
    },
    setCaretPos: (p) => {
      mainCursor.setAdr(
        withCaretAdr(mainCursor.getAdr(), withPos(mainCursor.getAdr().caret, p))
      );
      mainCursor.setAdr(
        withCarryAdr(mainCursor.getAdr(), withPos(mainCursor.getAdr().carry, p))
      );
    },
    setAnchorId: (id) => {
      mainCursor.setAdr(
        withAnchorAdr(
          mainCursor.getAdr(),
          withId(mainCursor.getAdr().anchor, id)
        )
      );
    },
    setAnchorPos: (p) => {
      mainCursor.setAdr(
        withAnchorAdr(
          mainCursor.getAdr(),
          withPos(mainCursor.getAdr().anchor, p)
        )
      );
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
      .map((ed) => indexOfAdr([ed.parentId, ed.id])),
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
      // CREATE AND DELETE CURSORS
      // if cursors have ids that actions does not
      for (const cursor of cursors) {
        if (!e.actions.find(({ adr }) => adr.id === cursor.getAdr().id))
          removeCursor(cursor);
      }
      // if actions has id that cursors does not
      for (const { adr } of e.actions) {
        if (!cursors.find((cursor) => adr.id === cursor.getAdr().id)) {
          const newCursor = createCursor();
          newCursor.setAdr({ ...newCursor.getAdr(), id: adr.id });
        }
      }

      // PERFORM ACTIONS
      for (const { adr, ob } of e.actions) {
        const { getAdr, setAdr } = cursors.find(
          (cursor) => cursor.getAdr().id === adr.id
        );
        setAdr(adr);
      }
      for (const { adr, ob } of e.actions) {
        const { getAdr, setAdr } = cursors.find(
          (cursor) => cursor.getAdr().id === adr.id
        );

        // SELECTION DELEGATION!
        let newAdr = { ...getAdr() };
        if (newAdr.selected.length > 0) {
          for (const selCaretAdr of newAdr.selected.toReversed()) {
            // each individual delete action in the selection is delegated
            setAdr({ ...getAdr(), caret: selCaretAdr });
            elFromAdr(selCaretAdr).act({
              adr: getAdr(),
              setAdr,
              getAdr,
              key: "Backspace",
            });
          }
          // caret properties are set inside `act`, but the event's caret properties
          // are not, so we need to manually update them
          newAdr = withAnchorAdr(getAdr(), getAdr().caret);
          setAdr(withAnchorAdr(getAdr(), getAdr().caret));
          setAdr({ ...getAdr(), selected: [] });
          if (ob.key === "Backspace") continue;
        }
        // ACTION!
        elFromAdr(getAdr().caret).act({
          ...ob,
          setAdr,
          cursors,
          getAdr,
          adr: newAdr,
        });
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

    renderCaret();
    e1.onReduce?.(e1.str.join(""));

    elFromAdr(mainCursor.getAdr().caret).focus();
  }

  //========================================================================
  // COPY, PASTE, KEYDOWN, and MOVECARET
  //========================================================================
  const copy = (e) => {
    // TODO: MULTICURSORS
    if (!e1.contains(document.activeElement)) return;
    if (mainCursor.getAdr().selected.length === 0) return;
    const output = calcSelectionString(mainCursor.getAdr().selected);
    console.log("copy!", output);

    e.clipboardData.setData("text/plain", output);
    e.preventDefault();

    if (e.type === "cut") {
      pushHistory({
        key: "Backspace",
        adrs: [mainCursor.getAdr()],
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
    renderCaret();
  });
  document.addEventListener("copy", copy);
  document.addEventListener("cut", copy);
  document.addEventListener("paste", (e) => {
    if (!e1.contains(document.activeElement)) return;
    let paste = e.clipboardData.getData("text");
    // console.log("paste!", paste, e);

    if (paste) {
      // TODO: MULTICURSORS
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
        adrs: [mainCursor.getAdr()],
      });
      bigreduce();
    }
  });

  const mousePick = (shouldMoveAnchor) => (e) => {
    const wrapEl = e.target.closest(".editor");
    const id = wrapEl?.id;
    if (id === undefined) return;

    const closestLineEl = wrapEl.lineEls.sort(
      (el1, el2) =>
        vertDistPointToLineEl(e, el1) - vertDistPointToLineEl(e, el2)
    )[0];
    const picked = [...closestLineEl.children].sort(
      (el1, el2) => distMouseEventToEl(e, el1) - distMouseEventToEl(e, el2)
    )[0];

    mainCursor.setAdr({ ...mainCursor.getAdr(), caret: [id, picked.id] });

    if (shouldMoveAnchor) {
      mainCursor.setAdr({ ...mainCursor.getAdr(), anchor: [id, picked.id] });
      wrapEl.focus();
    }
    renderCaret();
    clearStyleSelectionSinks();
    for (const { setAdr, getAdr } of cursors)
      setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
    styleSelectionSinks();
  };
  e1Wrap.addEventListener("mousedown", (e) => {
    requestAnimationFrame(() => mousePick(true)(e));
  });
  e1Wrap.addEventListener("mousemove", (e) => {
    if (e.buttons === 1) {
      requestAnimationFrame(() => mousePick(false)(e));
    }
  });
  e1Wrap.addEventListener("keydown", (e) => {
    const actions = cursors
      .map(({ getAdr }) => ({
        adr: getAdr(),
        ob: elFromAdr(getAdr().caret).onKey(e),
      }))
      .filter(({ adr, ob }) => ob !== undefined);
    if (actions.length > 0) {
      pushHistory({ actions });
      bigreduce();
      // why does this happen here?
      // selection will always be gone after the bigreduce, right?
      // also it causes a bug when there are two cursors currently
      // clearStyleSelectionSinks();
      // for (const { setAdr, getAdr } of cursors)
      //   setAdr({ ...getAdr(), selected: [] });
      // styleSelectionSinks();
      return;
    }

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
      newCur.setAdr({ ...mainCursor.getAdr(), id: newCur.getAdr().id });
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
      renderCaret();
      return;
    }
    if (e.key === "g" && e.metaKey) {
      e.preventDefault();
      for (const cursor of cursors) {
        const str = getSelectionSinks(cursor.getAdr())
          .map((s) => s.charEl.innerText)
          .join("");
        if (str.length > 0) {
          const newId = makeid(7);
          pushHistory({
            actions: [{ adr: cursor.getAdr(), ob: { newId } }],
          });
          bigreduce();
          mainCursor.setAdr({ ...mainCursor.getAdr(), caret: [newId, newId] });
          for (const char of str) {
            pushHistory({
              actions: [
                {
                  adr: mainCursor.getAdr(),
                  ob: { key: char, keyId: makeid(7) },
                },
              ],
            });
          }
          bigreduce();
        }
      }
    }
    if (e.key === "r" && e.metaKey) {
      e.preventDefault();

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
      const pos = getCaretopeSink(mainCursor.getAdr().caret).charEl.pos;
      const entries = split(traverse(pos)(pp(e1.str.join("")).parse)?.parent);

      for (const ar of entries) {
        const newCur = createCursor();
        newCur.setAdr({
          ...newCur.getAdr(),
          caret: ["init", e1.rawStr[ar.at(-1).i].id],
          carry: ["init", e1.rawStr[ar.at(-1).i].id],
          anchor: ["init", e1.rawStr[ar.at(0).i - 1].id],
        });
      }
      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
      renderCaret();
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
      // BUG: THIS DONT WORK FOR MULTICURSORS
      mainCursor.setAdr(res[1].actions[0].adr);
      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
      renderCaret();
    }
  });

  // manages selection, carry, rendering carets, setting addresses
  function moveCaret(dir, isSelecting, isJumping) {
    for (const { getAdr, setAdr } of cursors) {
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
    }

    renderCaret();

    clearStyleSelectionSinks();
    for (const { setAdr, getAdr } of cursors)
      setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
    styleSelectionSinks();
    elFromAdr(mainCursor.getAdr().caret).focus();
  }

  return e1;
};

// things I remember removing from 2024_11 polycope:
// - local undo and redo (ctrl+p, ancestorIds)
// - localstorage saved history and serialization/deserialization
// - iframe sandboxed eval
// - history visualizer with sandboxed canvas thumbnails

// Monday March 10 - just finishing up multicursor + lifting
// - multicursors are complicating things... Its getting hard to reason about the code here
// - I don't have to manually maintain so many invariants
// - I don't know how to deal with what happens when multicursors/multicursor selection overlap
//   - I'm tempted to use this as excuse to figure out multiplayer
// - is it time to rewrite some stuff?
// - if it is --- I need to actually figure out the concrete reasons why I want to rewrite first
//   and judge whether they can rather be fixed here
