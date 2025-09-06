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
import { serializeHistory, deserializeHistory } from "./historySerial.js";

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

  // ref: https://stackoverflow.com/a/45036752
  function resetAnimation(el) {
    const anim = el.style.animation;
    el.style.animation = "none";
    el.offsetHeight; /* trigger reflow */
    el.style.animation = anim;
  }
  const renderC = (el) => (addr) => {
    try {
      const caretContainerRect = e1.getBoundingClientRect();
      const rect = getElFromAdr(addr).getBoundingClientRect();

      el.style.height = rect.height - 2;
      el.style.transform = `translate(${rect.right - caretContainerRect.x}px, ${
        rect.y - caretContainerRect.y + 1
      }px)`;
      resetAnimation(el);
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
  createCursor();

  const renderCaret = () => {
    cursors.forEach(({ renderCaret }) => renderCaret());
  };

  let selectionSinks = new Map([[cursors[0].getAdr().id, []]]);

  // note: cannot be used inside of bigreduce! Has to be used after a render
  function getElFromAdr([id, pos]) {
    return elFromFocusId[id].querySelector("#" + pos);
  }
  const elFromAdrId = ([id, pos]) => elFromFocusId[id];
  function getCaretopeSinkFromAdrId(adr) {
    return getElFromAdr(adr)?.caretSink;
  }
  const getCaret = (a) => new Caret(getCaretopeSinkFromAdrId(a));

  //========================================================================
  // INIT EDITOR
  //========================================================================
  const e1 = editor("init", undefined, {
    elFromFocusId,
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
  const indexOfAdr = (adr) => getElFromAdr(adr).pos;
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

    const anchorSink = getCaretopeSinkFromAdrId(adr.anchor);
    if (!anchorSink || !getCaretopeSinkFromAdrId(adr.caret)) return [];
    const [min, max] = minAndMax(adr.caret, adr.anchor);
    const selC = getCaret(min);
    const maxSink = getCaretopeSinkFromAdrId(max);
    while (selC.caretSink && selC.caretSink !== maxSink) {
      selC.moveRight();
      result.push(selC.caretSink);
    }
    return result;
  }
  function getFlatSelectionSinks(adr) {
    const result = [];

    const anchorSink = getCaretopeSinkFromAdrId(adr.anchor);
    if (!anchorSink || !getCaretopeSinkFromAdrId(adr.caret)) return [];
    const [min, max] = minAndMax(adr.caret, adr.anchor);
    const selC = getCaret(min);
    const maxSink = getCaretopeSinkFromAdrId(max);
    while (selC.caretSink && selC.caretSink !== maxSink) {
      selC.moveRightFlat();
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
      createDestroyAndSetAdrOfCursors(e.actions);
      for (const action of e.actions) reduceStep(action);
    }

    // Note: sinks are created here! Can't access them in actions!
    // Related: Can't access rendered things in actions! You can access them in listeners though
    //   how to think about this? When to do which?
    createSinks();

    renderCaret();
    elFromAdrId(cursors[0].getAdr().caret).focus();

    e1.onReduce?.(e1.str.join(""));
  }
  function reduceStep({ adr, ob, selectionData }) {
    const { getAdr, setAdr } = cursors.find(
      (cursor) => cursor.getAdr().id === adr.id
    );

    // SELECTION DELETION!
    let newAdr = { ...getAdr() };
    const hasSelected = newAdr.selected.length > 0;
    if (hasSelected) {
      const selectedAdrsRightToLeft = newAdr.selected.toReversed();
      // deletion root is used (awkwardly) so that the caret does not
      // go into editors that being deleted. I think ideally `.selected`
      // should not include entries inside selected editors, then this
      // would not be an issue.
      let deletionRoot = null;
      for (const selCaretAdr of selectedAdrsRightToLeft) {
        if (deletionRoot !== null)
          if (selCaretAdr[0] !== deletionRoot) continue;
          else deletionRoot = null;

        // each individual delete action in the selection is delegated
        setAdr({ ...getAdr(), caret: selCaretAdr });

        const deletedChar = elFromAdrId(selCaretAdr).act({
          adr: getAdr(),
          setAdr,
          getAdr,
          key: "Backspace",
        });
        if (deletedChar?.char?.isEditor) deletionRoot = getAdr().caret[0];
      }
      // caret properties are set inside `act`, but the event's caret properties
      // are not, so we need to manually update them
      newAdr = setAdr({ ...getAdr(), anchor: getAdr().caret });
      setAdr({ ...getAdr(), anchor: getAdr().caret });
      setAdr({ ...getAdr(), selected: [] });

      // don't perform backspace action after deleting selection:
      if (ob.key === "Backspace") return;
    }
    // ACTION!
    const pasteAction = (paction) => {
      if (Array.isArray(paction)) {
        for (const pob of paction) pasteAction(pob);
      } else if (paction.key) {
        elFromAdrId(getAdr().caret).act({
          ...paction,
          setAdr,
          getAdr,
          adr: newAdr,
        });
        setAdr({ ...getAdr(), anchor: getAdr().caret });
      } else if (paction.id) {
        const { id, data: pob } = paction;
        // insert id
        const afterAdr = elFromAdrId(getAdr().caret).act({
          newId: id,
          setAdr,
          getAdr,
          adr: newAdr,
        });
        setAdr({ ...getAdr(), anchor: getAdr().caret });
        // recurse and then move caret to after the recursively inserted stuff
        pasteAction(pob);
        setAdr(afterAdr);
        setAdr({ ...getAdr(), anchor: getAdr().caret });
      }
    };
    if (ob.paste) {
      pasteAction(ob.paste);
    } else {
      // TODO: this should only pass a single address, not caret anchor and carry
      elFromAdrId(getAdr().caret).act({
        ...ob,
        setAdr,
        getAdr,
        adr: newAdr,
      });
      setAdr({ ...getAdr(), anchor: getAdr().caret });
    }

    if (ob.newId) {
      for (const [key, keyId] of selectionData) {
        // TODO: doesn't work for nested editors
        elFromAdrId(getAdr().caret).act({
          newId: undefined,
          key,
          keyId,
          setAdr,
          getAdr,
        });
      }
    }
  }
  function createSinks() {
    for (const [id, containerEl] of Object.entries(elFromFocusId)) {
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
  }

  //========================================================================
  // COPY, PASTE, KEYDOWN, and MOVECARET
  //========================================================================
  const copy = (e) => {
    // TODO: MULTICURSORS
    if (!e1.contains(document.activeElement)) return;
    if (cursors[0].getAdr().selected.length === 0) return;
    const output = calcSelectionString(cursors[0].getAdr().selected);
    console.log("copy!", output);

    e.clipboardData.setData("text/plain", output);
    e.preventDefault();

    if (e.type === "cut") {
      pushHistory({
        actions: cursors.map((cursor) => ({
          adr: cursor.getAdr(),
          ob: { key: "Backspace" },
          selectionData: [],
        })),
      });
      bigreduce();
    }
  };
  function calcSelectionString(selected) {
    let balance = 0;
    const inner = selected
      .map((v) => {
        const s = getCaretopeSinkFromAdrId(v);
        if (s.isFirst()) balance++;
        if (s.isAfterEditorSink) {
          balance--;
          return "<)";
        }
        return s.isFirst()
          ? "(>"
          : "" + (s.charEl.textContent || s.charEl.innerText); // textContent works for spaces, innerText works for newlines
      })
      .join("");
    let prefix = balance < 0 ? "(>".repeat(Math.abs(balance)) : "";
    let postfix = balance > 0 ? "<)".repeat(balance) : "";
    return prefix + inner + postfix;
  }
  function dog(selected) {
    let balance = 0;
    const inner = selected.map((v) => {
      const s = getCaretopeSinkFromAdrId(v);
      if (s.isFirst())
        if (s.isAfterEditorSink) {
          balance--;
          return "<)";
        }
      return s.isFirst() ? "(>" : "" + s.charEl.innerText;
    });
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
      const go = (v) =>
        Array.isArray(v)
          ? {
              id: makeid(7),
              data: v.map(go),
            }
          : { key: v, keyId: makeid(7) };

      // console.log(output.map(go));
      pushHistory({
        actions: cursors.map((cursor) => ({
          adr: cursor.getAdr(),
          ob: { paste: output.map(go) },
          selectionData: [],
        })),
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

    cursors[0].setAdr({ ...cursors[0].getAdr(), caret: [id, picked.id] });

    if (shouldMoveAnchor) {
      cursors[0].setAdr({ ...cursors[0].getAdr(), anchor: [id, picked.id] });
      wrapEl.focus();
    }

    renderCaret();

    for (const cursor of cursors) {
      if (cursor.getAdr().id !== cursors[0].getAdr().id) removeCursor(cursor);
    }
    clearStyleSelectionSinks();
    for (const { setAdr, getAdr } of cursors) {
      setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
    }
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
    // DEBUG KEY!
    if (e.key === "d" && e.metaKey) {
      e.preventDefault();
      console.log(cursors[0].getAdr());
      return;
    }
    const actions = cursors
      .map(({ getAdr }) => ({
        adr: getAdr(),
        ob: elFromAdrId(getAdr().caret).onKey(e),
        selectionData: [...calcSelectionString(getAdr().selected)].map(
          (char) => [char, makeid(7)] // ids for chars to insert must be calculated before history is pushed
        ),
      }))
      .filter(({ adr, ob }) => ob !== undefined);
    if (actions.length > 0) {
      pushHistory({ actions });
      bigreduce();
      // why does this happen here?
      // selection will always be gone after the bigreduce, right?
      // also it causes a bug when there are two cursors currently
      // later reply: no we can't remove this, selection does not get cleared in bigreduce
      //   also, what bug!?!?
      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: [] });
      styleSelectionSinks();
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
      // structural selection experiment. janky! because:
      // - overlapping multiselect causes issues
      e.preventDefault();

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
      const pos = getCaretopeSinkFromAdrId(cursors[0].getAdr().caret).charEl
        .pos;
      const entries = split(traverse(pos)(pp(e1.str.join("")).parse)?.parent);

      if (entries.length > 0) removeCursor(cursors[0]);
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
      // e1.onSave?.(
      //   e1.str.join(""),
      //   selectionSinks.map((s) => s.charEl.innerText).join("")
      // );
      localStorage.setItem(
        "2025_2_history",
        serializeHistory(getHistoryRoot())
      );
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
      createDestroyAndSetAdrOfCursors(res[1].actions);

      clearStyleSelectionSinks();
      for (const { setAdr, getAdr } of cursors)
        setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
      styleSelectionSinks();
      renderCaret();
    }
  });

  function createDestroyAndSetAdrOfCursors(actions) {
    for (const cursor of cursors)
      if (!actions.find(({ adr }) => adr.id === cursor.getAdr().id))
        removeCursor(cursor);
    for (const { adr } of actions)
      if (!cursors.find((cursor) => adr.id === cursor.getAdr().id))
        createCursor().setAdr(adr);
    for (const { adr } of actions)
      cursors.find((cursor) => cursor.getAdr().id === adr.id).setAdr(adr);
  }

  // manages selection, carry, rendering carets, setting addresses
  function moveCaret(dir, isSelecting, isJumping) {
    for (const { getAdr, setAdr } of cursors) {
      const c = getCaret(getAdr().caret);
      if (dir === "left" || dir === "right") {
        setAdr({ ...getAdr(), carry: [null, -1] });
      }
      if (dir === "up" || dir === "down") {
        if (getAdr().carry[0] === null) {
          setAdr({ ...getAdr(), carry: getAdr().caret });
        }
      }
      if (getAdr().carry[0]) {
        // BUG HERE - why is carry sometimes invalid? Its after inserting
        c.carrySink = getCaretopeSinkFromAdrId(getAdr().carry);
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
      setAdr({
        ...getAdr(),
        caret: [c.caretSink.charEl.parentId, c.caretSink.charEl.id],
      });

      if (!isSelecting) {
        setAdr({ ...getAdr(), anchor: getAdr().caret });
      }
    }

    renderCaret();

    clearStyleSelectionSinks();
    for (const { setAdr, getAdr } of cursors)
      setAdr({ ...getAdr(), selected: calcSelection(getAdr()) });
    styleSelectionSinks();
    elFromAdrId(cursors[0].getAdr().caret).focus();
  }

  if (localStorage.getItem("2025_2_history")) {
    setHistory(deserializeHistory(localStorage.getItem("2025_2_history")));
    bigreduce();
  }

  e1Wrap.e = e1;
  return e1Wrap;
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
