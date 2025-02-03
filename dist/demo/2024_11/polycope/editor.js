import { ContainerSink } from "./caretsink.js";
import { emptyEditor } from "./emptyEditor.js";
import { insertAt, deleteAt, distMouseEventToEl, vertDistPointToLineEl, } from "./helpers.js";
export const editor = (id = Math.random() + "", parentContainerSink, eContext) => {
    const { elFromFocusId, selectionSinks, calcSelection, renderCaret, renderAnchor, getCaretId, setCaretId, getCaretPos, setCaretPos, setAnchorId, setAnchorPos, } = eContext;
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
        const closestLineEl = wrapEl.lineEls.sort((el1, el2) => vertDistPointToLineEl(e, el1) - vertDistPointToLineEl(e, el2))[0];
        const picked = [...closestLineEl.children].sort((el1, el2) => distMouseEventToEl(e, el1) - distMouseEventToEl(e, el2))[0];
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
    wrapEl.addEventListener("mousedown", (e) => requestAnimationFrame(() => mousePick(true)(e)));
    wrapEl.addEventListener("mousemove", (e) => {
        if (e.buttons === 1)
            requestAnimationFrame(() => mousePick(false)(e));
    });
    wrapEl.sink = new ContainerSink(() => wrapEl.getBoundingClientRect());
    wrapEl.sink.parent = parentContainerSink ?? null;
    let str = [];
    let lines = [[]];
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
            }
            else if (Array.isArray(e.paste)) {
                for (const entry of e.paste) {
                    act({ ...e, paste: undefined, key: entry });
                }
            }
        }
        else if (e.newId) {
            const newE = emptyEditor(e.newId, wrapEl.sink, eContext);
            newE.render();
            myInsertAt(getCaretPos(), newE);
            setCaretPos(0);
            setCaretId(newE.id);
        }
        else if (e.key.length === 1) {
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
            }
            else {
                // TODO?: delete at start of editor
            }
        }
        wrapEl.str = str;
    }
    function calcLines() {
        let curLine = [];
        lines = [curLine];
        for (const charOrEditor of str) {
            if ("\n" === charOrEditor) {
                curLine = [];
                lines.push(curLine);
            }
            else
                curLine.push(charOrEditor);
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
            if (y === 0)
                lineStartEl.isEditorStart = true;
            else
                lineStartEl.isNewLine = true;
            pos++;
            let isInCommentBlock = false;
            let isInString = false;
            let isInDoubleString = false;
            let els = line.map((char, x) => {
                let charEl;
                // @ts-ignore:
                if (char.isEditor) {
                    charEl = char;
                }
                else if (char === " ") {
                    charEl = document.createElement("span");
                    charEl.innerText = " ";
                    charEl.style.display = "inline-block";
                    charEl.style.verticalAlign = "middle";
                    charEl.style.width = "8px";
                    charEl.style.height = "16px";
                }
                else {
                    charEl = document.createElement("span");
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
                    if ((char === "(" || char === ")" || char === "[" || char === "]") &&
                        !isInCommentBlock &&
                        !isInString &&
                        !isInDoubleString)
                        charEl.style.color = "violet";
                    if (
                    // @ts-ignore:
                    !isNaN(char) &&
                        // @ts-ignore:
                        !isNaN(parseInt(char)) &&
                        !isInCommentBlock &&
                        !isInString &&
                        !isInDoubleString)
                        charEl.style.color = "purple";
                    if (isInCommentBlock)
                        charEl.style.color = "crimson";
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
