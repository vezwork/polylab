import { ContainerSink } from "./caretsink.js";
import { insertAt, deleteAt, makeid } from "./helpers.js";
import { minEditor } from "./minEditor.js";

type WrapElType = HTMLDivElement & {
  lineEls: any[];
  sink: any;
  render: Function;
  isEditor: boolean;
  str: string[];
  rawStr: any[];
  reset: Function;
  act: Function;
};

export const editor = (
  id = Math.random() + "",
  parentContainerSink,
  eContext
) => {
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
  eContext.elFromFocusId[id] = wrapEl;

  wrapEl.onKey = (e) => {
    if (e.key === "Tab") e.preventDefault();
    if (e.key === "Backspace") e.preventDefault();
    if (e.key === " ") e.preventDefault();
    const discrim =
      e.key.length === 1 || e.key === "Enter" || e.key === "Backspace";
    if (discrim && !e.metaKey) {
      return {
        key: e.key,
        keyId: makeid(7),
      };
    } else if (e.key === "b" && e.metaKey) {
      return {
        newId: makeid(7),
      };
    } else if (e.key === "Tab" && e.shiftKey) {
      return {
        despacify: true,
      };
    } else if (e.key === "Tab") {
      return {
        spacify: true,
      };
    } else if (e.key === "/" && e.metaKey) {
      return {
        commentify: true,
      };
    }
  };
  wrapEl.sink = new ContainerSink(() => wrapEl.getBoundingClientRect());
  wrapEl.sink.parent = parentContainerSink ?? null;

  let str = [] as { char: string; id: string }[];
  let lines = [[]] as any[][];

  function reset() {
    str = [];

    wrapEl.str = str.map((s) => s.char);
    wrapEl.rawStr = str;
    wrapEl.innerHTML = "";
  }

  function myInsertAt(pos, char) {
    str = insertAt(str, pos, char);
  }
  const insertAfter = (id, char) => {
    const i = str.findIndex((v) => v.id === id);
    if (i === -1) myInsertAt(0, char);
    else myInsertAt(i + 1, char);

    wrapEl.str = str.map((s) => s.char);
    wrapEl.rawStr = str;
    return i;
  };
  const getAtId = (id) => {
    const i = str.findIndex((v) => v.id === id);
    return str[i];
  };
  const deleteAtId = (id) => {
    const i = str.findIndex((v) => v.id === id);
    if (i === -1) {
      console.log("str", str);
      throw "couldn't find id to delete:" + id + ". inside editor:" + wrapEl.id;
    }
    str = deleteAt(str, i);

    wrapEl.str = str.map((s) => s.char);
    wrapEl.rawStr = str;
    return i;
  };

  function act(e) {
    if (e.newId) {
      const newE = editor(e.newId, wrapEl.sink, eContext);
      newE.render();
      const i = insertAfter(e.getAdr().caret[1], { char: newE, id: e.newId });
      // note: return this to help pasting
      const afterAdr = { ...e.getAdr(), caret: [id, str[i + 1]?.id ?? id] };
      const innerAdr = { ...e.getAdr(), caret: [newE.id, newE.id] };
      e.setAdr(innerAdr);
      return afterAdr;
    } else if (e.key.length === 1) {
      insertAfter(e.getAdr().caret[1], { char: e.key, id: e.keyId });
      e.setAdr({ ...e.getAdr(), caret: [id, e.keyId] });
    }
    if (e.key === "Enter") {
      insertAfter(e.getAdr().caret[1], { char: "\n", id: e.keyId });
      e.setAdr({ ...e.getAdr(), caret: [id, e.keyId] });
    }
    if (e.key === "Backspace") {
      const isFirstSink = e.getAdr().caret[1] === id;
      if (!isFirstSink) {
        const deletedChar = getAtId(e.getAdr().caret[1]);
        const i = deleteAtId(e.getAdr().caret[1]);
        e.setAdr({ ...e.getAdr(), caret: [id, str[i - 1]?.id ?? id] });
        // note: return this to help selection deletion
        return deletedChar;
      } else {
        // TODO?: delete at start of editor
      }
    }
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
  }

  function render() {
    calcLines();
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
            charEl.style.verticalAlign = "text-bottom";
            charEl.style.width = "8px";
            charEl.style.height = "1.22em";
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
  wrapEl.str = str.map((s) => s.char);
  wrapEl.render = render;
  wrapEl.reset = reset;
  wrapEl.act = act;
  wrapEl.isEditor = true;
  return wrapEl;
};

// I feel like this should be more database-y... what do I mean by that?
