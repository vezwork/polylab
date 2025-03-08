import { ContainerSink } from "./caretsink.js";
import {
  insertAt,
  deleteAt,
  linePos,
  dist,
  distMouseEventToEl,
  elTopAndBottom,
  vertDistPointToLineEl,
  makeid,
} from "./helpers.js";

type WrapElType = HTMLDivElement & {
  lineEls: any[];
  sink: any;
  render: Function;
  lines: any[];
  calcLines: Function;
  isEditor: boolean;
  els: any[];
  str: string[];
  reset: Function;
  act: Function;
};

export const editor = (
  id = Math.random() + "",
  parentContainerSink,
  eContext
) => {
  const {
    elFromFocusId,
    calcAndRenderSelection,
    renderCaret,
    renderAnchor,
    getCaretId,
    setCaretId,
    getCaretPos,
    setCaretPos,
    setAnchorId,
    setAnchorPos,
    pushHistory,
  } = eContext;

  const wrapEl = new DOMParser().parseFromString(
    `<div style="
    padding: 4px 4px 4px 0;
    border: 1px solid black;
    vertical-align: middle;
    user-select: none;
    border-radius: 6px;
    display: inline-block;
  " class="editor" tabIndex="0"></div>`,
    "text/html"
  ).body.firstChild as WrapElType;
  elFromFocusId[id] = wrapEl;
  const mousePick = (shouldMoveAnchor) => (e) => {
    e.stopPropagation();

    const closestLineEl = wrapEl.lineEls.sort(
      (el1, el2) =>
        vertDistPointToLineEl(e, el1) - vertDistPointToLineEl(e, el2)
    )[0];
    const picked = [...closestLineEl.children].sort(
      (el1, el2) => distMouseEventToEl(e, el1) - distMouseEventToEl(e, el2)
    )[0];
    setCaretId(id);
    setCaretPos(picked.id);

    if (shouldMoveAnchor) {
      setAnchorId(id);
      setAnchorPos(picked.id);
      renderAnchor();
      wrapEl.focus();
    }
    renderCaret();
    calcAndRenderSelection();
  };
  wrapEl.addEventListener("mousedown", (e) => {
    requestAnimationFrame(() => mousePick(true)(e));
    e.stopPropagation();
  });
  wrapEl.addEventListener("mousemove", (e) => {
    if (e.buttons === 1) {
      requestAnimationFrame(() => mousePick(false)(e));
      e.stopPropagation();
    }
  });
  wrapEl.addEventListener("keydown", (e) => {
    if (e.key === "Tab") e.preventDefault();
    if (e.key === "Backspace") e.preventDefault();
    if (e.key === " ") e.preventDefault();
    const discrim =
      e.key.length === 1 || e.key === "Enter" || e.key === "Backspace";
    if (discrim && !e.metaKey) {
      pushHistory({
        key: e.key,
        keyId: makeid(7), // MULTICURSOR BUG! same id for both cursors. uh oh.
      });
      e.stopPropagation();
    } else if (e.key === "b" && e.metaKey) {
      pushHistory({
        key: e.key,
        newId: makeid(7), // MULTICURSOR BUG! same id for both cursors. uh oh.
      });
      e.stopPropagation();
    } else if (e.key === "Tab" && e.shiftKey) {
      pushHistory({
        despacify: true,
      });
      e.stopPropagation();
    } else if (e.key === "Tab") {
      pushHistory({
        spacify: true,
      });
      e.stopPropagation();
    } else if (e.key === "/" && e.metaKey) {
      pushHistory({
        commentify: true,
      });
      e.stopPropagation();
    }
  });
  wrapEl.sink = new ContainerSink(() => wrapEl.getBoundingClientRect());
  wrapEl.sink.parent = parentContainerSink ?? null;

  let str = [] as { char: string; id: string }[];
  let lines = [[]] as any[][];

  function reset() {
    str = [];
    lines = [[]];

    wrapEl.str = str.map((s) => s.char);
    wrapEl.lines = lines;
    wrapEl.innerHTML = "";
  }

  function myInsertAt(pos, char) {
    str = insertAt(str, pos, char);
    wrapEl.str = str.map((s) => s.char);
  }

  // char id to pos
  // insertAfter(id, newThing)
  // delete(id)
  const insertAfter = (id, char) => {
    const i = str.findIndex((v) => v.id === id);
    if (i === -1) myInsertAt(0, char);
    else myInsertAt(i + 1, char);
  };
  const deleteAtId = (id) => {
    const i = str.findIndex((v) => v.id === id);
    if (i === -1) throw "couldn't find id to delete";
    str = deleteAt(str, i);
    return i;
  };

  function act(e) {
    if (e.paste) {
      if (e.paste.id) {
        act({ ...e, paste: undefined, newId: e.paste.id });
        // BUG: I think his causes issues, it moves the caret to the wrong spot mid-paste?
        elFromFocusId[getCaretId()]?.act({
          ...e,
          paste: e.paste.data,
        });
      } else if (Array.isArray(e.paste)) {
        for (const entry of e.paste) {
          if (entry.id) act({ ...e, paste: entry });
          else act({ ...e, paste: undefined, key: entry });
        }
      }
    } else if (e.newId) {
      const newE = editor(e.newId, wrapEl.sink, eContext);
      newE.render();
      insertAfter(getCaretPos(), { char: newE, id: e.newId });
      setCaretPos(newE.id);
      setCaretId(newE.id);
    } else if (e.key.length === 1) {
      //const iid = getCaretPos() === 0 ? id : str[getCaretPos() - 1].id;

      insertAfter(getCaretPos(), { char: e.key, id: e.keyId });
      setCaretId(id);
      setCaretPos(e.keyId);
    }
    if (e.key === "Enter") {
      insertAfter(getCaretPos(), { char: "\n", id: e.keyId });
      setCaretId(id);
      setCaretPos(e.keyId);
    }
    if (e.key === "Backspace") {
      if (getCaretPos() !== id) {
        const i = deleteAtId(getCaretPos());
        setCaretId(id);
        setCaretPos(str[i - 1]?.id ?? id);
      } else {
        // TODO?: delete at start of editor
      }
    }

    wrapEl.str = str.map((s) => s.char);
  }

  function calcLines() {
    let curLine = [] as unknown as { char: string; id: string }[] & {
      id: string;
    };
    curLine.id = id;
    lines = [curLine];
    for (const ob of str) {
      if ("\n" === ob.char) {
        curLine = [] as unknown as { char: string; id: string }[] & {
          id: string;
        };
        curLine.id = ob.id;
        lines.push(curLine);
      } else curLine.push(ob);
    }
    wrapEl.lines = lines;
  }
  wrapEl.calcLines = calcLines;

  function render() {
    wrapEl.innerHTML = "";
    let pos = 0;
    wrapEl.lineEls = [];
    return lines.map((line, y) => {
      const lineStartEl = document.createElement("span") as HTMLSpanElement & {
        pos: any;
        parentId: any;
      };
      lineStartEl.style.height = "1.27em"; // magic number makes highlight height the same as 18px letters
      lineStartEl.style.width = "4px";
      lineStartEl.style.display = "inline-block";
      lineStartEl.style.verticalAlign = "text-bottom";
      lineStartEl.pos = pos;
      lineStartEl.parentId = id;
      lineStartEl.id = line.id;

      if (y !== 0) lineStartEl.innerText = "\n";

      pos++;

      let isInCommentBlock = false;
      let isInString = false;
      let isInDoubleString = false;
      let els = line.map(
        (
          { char, id: charId }: { char: WrapElType | string; id: string },
          x
        ) => {
          let charEl;
          // @ts-ignore:
          if (char.isEditor) {
            charEl = char;
          } else if (char === " ") {
            charEl = document.createElement("span");
            charEl.innerText = " ";
            charEl.style.display = "inline-block";
            charEl.style.verticalAlign = "middle";
            charEl.style.width = "8px";
            charEl.style.height = "16px";
            charEl.id = charId;
          } else {
            charEl = document.createElement("span");
            charEl.id = charId;
            if (char === "/" && line[x + 1] === "/") {
              isInCommentBlock = true;
            }
            if (isInString || isInDoubleString)
              charEl.style.color = "orangered";
            if (char === "'") {
              isInString = !isInString;
            }
            if (char === `"`) {
              isInDoubleString = !isInDoubleString;
            }
            if (isInString || isInDoubleString)
              charEl.style.color = "orangered";
            if (
              (char === "(" || char === ")" || char === "[" || char === "]") &&
              !isInCommentBlock &&
              !isInString &&
              !isInDoubleString
            )
              charEl.style.color = "violet";

            if (
              // @ts-ignore:
              !isNaN(char) &&
              // @ts-ignore:
              !isNaN(parseInt(char)) &&
              !isInCommentBlock &&
              !isInString &&
              !isInDoubleString
            )
              charEl.style.color = "purple";
            if (isInCommentBlock) charEl.style.color = "crimson";

            charEl.innerText = char;
          }
          charEl.pos = pos;
          charEl.parentId = id;
          pos++;
          return charEl;
        }
      );
      els = [lineStartEl, ...els];
      const lineEl = document.createElement("div");
      lineEl.style.minHeight = "16px";
      lineEl.append(...els);
      wrapEl.lineEls.push(lineEl);
      wrapEl.append(lineEl);
      return els;
    });
  }

  wrapEl.act = act;
  wrapEl.id = id;
  wrapEl.lines = lines;
  wrapEl.str = str.map((s) => s.char);
  wrapEl.render = render;
  wrapEl.reset = reset;
  wrapEl.act = act;
  wrapEl.isEditor = true;
  return wrapEl;
};

// I feel like this should be more database-y... what do I mean by that?
