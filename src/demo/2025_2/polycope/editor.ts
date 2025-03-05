import { ContainerSink } from "./caretsink.js";
import {
  insertAt,
  deleteAt,
  linePos,
  dist,
  distMouseEventToEl,
  elTopAndBottom,
  vertDistPointToLineEl,
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
    selectionSinks,
    calcSelection,
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
    padding: 6px 6px 6px 2px;
    border: 1px solid black;
    vertical-align: middle;
    user-select: none;
    border-radius: 4px;
    display: inline-block;
  " class="editor" tabIndex="0"></div>`,
    "text/html"
  ).body.firstChild as WrapElType;
  elFromFocusId[id] = wrapEl;
  const mousePick = (shouldMoveAnchor) => (e) => {
    e.stopPropagation();

    selectionSinks().forEach((c) => {
      c.charEl.isSelected = false;
      c.charEl.classList.remove("selected");
    });

    const closestLineEl = wrapEl.lineEls.sort(
      (el1, el2) =>
        vertDistPointToLineEl(e, el1) - vertDistPointToLineEl(e, el2)
    )[0];
    const picked = [...closestLineEl.children].sort(
      (el1, el2) => distMouseEventToEl(e, el1) - distMouseEventToEl(e, el2)
    )[0];
    setCaretId(id);
    setCaretPos(picked.pos);

    if (shouldMoveAnchor) {
      setAnchorId(id);
      setAnchorPos(picked.pos);
      renderAnchor();
    }
    renderCaret();

    calcSelection();
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
  function discrim(e) {
    if (e.key.length === 1) return true;
    if (e.key === "Enter") return true;
    if (e.key === "Backspace") return true;
  }
  wrapEl.addEventListener("keydown", (e) => {
    if (e.key === "Tab") e.preventDefault();
    if (e.key === "Backspace") e.preventDefault();
    if (e.key === " ") e.preventDefault();
    if (discrim(e) && !e.metaKey) {
      pushHistory({
        key: e.key,
      });
    } else if (e.key === "b" && e.metaKey) {
      pushHistory({
        key: e.key,
        newId: Math.random() + "",
      });
    } else if (e.key === "Tab" && e.shiftKey) {
      pushHistory({
        despacify: true,
      });
    } else if (e.key === "Tab") {
      pushHistory({
        spacify: true,
      });
    } else if (e.key === "/" && e.metaKey) {
      pushHistory({
        commentify: true,
      });
    }
  });
  wrapEl.sink = new ContainerSink(() => wrapEl.getBoundingClientRect());
  wrapEl.sink.parent = parentContainerSink ?? null;

  let str = [] as string[];
  let lines = [[]] as any[][];

  function reset() {
    str = [];
    lines = [[]];

    wrapEl.str = str;
    wrapEl.lines = lines;
    wrapEl.innerHTML = "";
  }

  function myInsertAt(pos, char) {
    str = insertAt(str, pos, char);
    wrapEl.str = str;
  }

  function act(e) {
    if (e.paste) {
      if (e.paste.id) {
        act({ ...e, paste: undefined, newId: e.paste.id });
        elFromFocusId[getCaretId()]?.act({
          ...e,
          paste: e.paste.data,
          caretId: getCaretId(),
          caretPos: getCaretPos(),
        });
      } else if (Array.isArray(e.paste)) {
        for (const entry of e.paste) {
          act({ ...e, paste: undefined, key: entry });
        }
      }
    } else if (e.newId) {
      const newE = editor(e.newId, wrapEl.sink, eContext);
      newE.render();
      myInsertAt(getCaretPos(), newE);
      setCaretPos(0);
      setCaretId(newE.id);
    } else if (e.key.length === 1) {
      myInsertAt(getCaretPos(), e.key);
      setCaretPos(getCaretPos() + 1);
    }
    if (e.key === "Enter") {
      myInsertAt(getCaretPos(), "\n");
      setCaretPos(getCaretPos() + 1);
    }
    if (e.key === "Backspace") {
      if (getCaretPos() > 0) {
        str = deleteAt(str, getCaretPos() - 1);
        setCaretPos(getCaretPos() - 1);
      } else {
        // TODO?: delete at start of editor
      }
    }

    wrapEl.str = str;
  }

  function calcLines() {
    let curLine: any[] = [];
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
      const lineStartEl = document.createElement("span") as HTMLSpanElement & {
        pos: any;
        parentId: any;
      };
      lineStartEl.style.height = "1.3em";
      lineStartEl.style.width = "4px";
      lineStartEl.style.display = "inline-block";
      lineStartEl.style.verticalAlign = "middle";
      lineStartEl.pos = pos;
      lineStartEl.parentId = id;
      if (y !== 0) lineStartEl.innerText = "\n";
      pos++;

      let isInCommentBlock = false;
      let isInString = false;
      let isInDoubleString = false;
      let els = line.map((char: WrapElType | string, x) => {
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
        } else {
          charEl = document.createElement("span");
          if (char === "/" && line[x + 1] === "/") {
            isInCommentBlock = true;
          }
          if (isInString || isInDoubleString) charEl.style.color = "orangered";
          if (char === "'") {
            isInString = !isInString;
          }
          if (char === `"`) {
            isInDoubleString = !isInDoubleString;
          }
          if (isInString || isInDoubleString) charEl.style.color = "orangered";
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

  wrapEl.act = act;
  wrapEl.id = id;
  wrapEl.lines = lines;
  wrapEl.str = str;
  wrapEl.render = render;
  wrapEl.reset = reset;
  wrapEl.act = act;
  wrapEl.isEditor = true;
  return wrapEl;
};
