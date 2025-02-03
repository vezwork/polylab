import { ContainerSink } from "./caretsink.js";
export const emptyEditor = (id = Math.random() + "", parentContainerSink, eContext) => {
    const { elFromFocusId, pushHistory, renderCaret, renderAnchor, getCaretId, setCaretId, getCaretPos, setCaretPos, setAnchorId, setAnchorPos, } = eContext;
    const wrapEl = document.createElement("div");
    wrapEl.className = "editor";
    elFromFocusId[id] = wrapEl;
    wrapEl.style.display = "inline-block";
    wrapEl.tabIndex = 0;
    let value = 0;
    const mousePick = (e) => {
        e.stopPropagation();
        pushHistory({
            caretId: id,
            caretPos: 0,
            incValue: true,
            processedSelection: [],
        });
    };
    wrapEl.addEventListener("mousedown", mousePick);
    wrapEl.sink = new ContainerSink(() => wrapEl.getBoundingClientRect());
    wrapEl.sink.parent = parentContainerSink ?? null;
    wrapEl.style.cursor = "pointer";
    let str = [];
    let lines = [[]];
    function reset() {
        str = [];
        lines = [[]];
        wrapEl.str = str;
        wrapEl.lines = lines;
        wrapEl.innerHTML = "";
    }
    function act(e) {
        if (e.caretId !== id)
            return;
        if (e.incValue || e.key.length === 1) {
            value++;
        }
        if (e.key === "Backspace")
            value--;
        setCaretId(id);
        setCaretPos(0);
        setAnchorPos(0);
        setAnchorId(id);
    }
    function calcLines() { }
    wrapEl.calcLines = calcLines;
    function render() {
        wrapEl.innerHTML = "";
        const lineStartEl = document.createElement("span");
        // what even is `isEditorStart`?
        lineStartEl.isEditorStart = true;
        lineStartEl.style.height = "1.3em";
        lineStartEl.style.display = "inline-block";
        lineStartEl.style.verticalAlign = "middle";
        lineStartEl.pos = 0;
        lineStartEl.parentId = id;
        lineStartEl.style.color = "pink";
        lineStartEl.innerText = value + "";
        wrapEl.append(lineStartEl);
        return [[lineStartEl]];
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
