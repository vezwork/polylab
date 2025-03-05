import { ContainerSink } from "./caretsink.js";
export const drawEditor = (id = Math.random() + "", parentContainerSink, eContext) => {
    const { elFromFocusId, pushHistory, renderCaret, renderAnchor, getCaretId, setCaretId, getCaretPos, setCaretPos, setAnchorId, setAnchorPos, } = eContext;
    const wrapEl = document.createElement("div");
    wrapEl.className = "editor";
    elFromFocusId[id] = wrapEl;
    wrapEl.style.display = "inline-block";
    wrapEl.tabIndex = 0;
    wrapEl.style.padding = "unset";
    let ps = [];
    let c = document.createElement("canvas");
    c.width = 100;
    c.height = 100;
    let ctx = c.getContext("2d");
    wrapEl.append(c);
    wrapEl.toString = () => `await new Promise(resolve => {
  const img = new Image()
  img.addEventListener('load', e=>{
    resolve(img)
  })
  img.src = '${c.toDataURL()}'
})`;
    let mouseDown = false;
    const addP = (p) => {
        ctx?.fillRect(Math.floor(p[0] / 10) * 10, Math.floor(p[1] / 10) * 10, 10, 10);
        ps.push(p);
    };
    wrapEl.addEventListener("mousedown", (e) => {
        addP([e.offsetX, e.offsetY]);
        mouseDown = true;
    });
    wrapEl.addEventListener("mouseup", (e) => {
        mouseDown = false;
        pushHistory({
            caretId: id,
            caretPos: 0,
            ps,
            processedSelection: [],
        });
        ps = [];
    });
    wrapEl.addEventListener("mousemove", (e) => {
        if (mouseDown)
            addP([e.offsetX, e.offsetY]);
    });
    // const mousePick = (e) => {
    //   e.stopPropagation();
    //   // pushHistory({
    //   //   caretId: id,
    //   //   caretPos: 0,
    //   //   incValue: true,
    //   //   processedSelection: [],
    //   // });
    // };
    // wrapEl.addEventListener("mousedown", mousePick);
    wrapEl.sink = new ContainerSink(() => wrapEl.getBoundingClientRect());
    wrapEl.sink.parent = parentContainerSink ?? null;
    let str = [];
    let lines = [[]];
    function reset() {
        ps = [];
        str = [];
        lines = [[]];
        wrapEl.str = str;
        wrapEl.lines = lines;
    }
    let finalPs = [];
    function act(e) {
        if (e.caretId !== id)
            return;
        if (e.ps) {
            finalPs = finalPs.concat(e.ps);
        }
        setCaretId(id);
        setCaretPos(0);
        setAnchorPos(0);
        setAnchorId(id);
    }
    function calcLines() { }
    wrapEl.calcLines = calcLines;
    function render() {
        wrapEl.innerHTML = "";
        c = document.createElement("canvas");
        c.width = 100;
        c.height = 100;
        ctx = c.getContext("2d");
        wrapEl.append(c);
        for (const p of finalPs) {
            ctx?.fillRect(Math.floor(p[0] / 10) * 10, Math.floor(p[1] / 10) * 10, 10, 10);
        }
        c.isEditorStart = true;
        c.pos = 0;
        c.parentId = id;
        return [[c]];
    }
    wrapEl.act = act;
    wrapEl.id = id;
    wrapEl.lines = [[]];
    wrapEl.str = [];
    wrapEl.render = render;
    wrapEl.reset = reset;
    wrapEl.act = act;
    wrapEl.isEditor = true;
    return wrapEl;
};
