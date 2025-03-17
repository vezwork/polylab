import { ContainerSink } from "./caretsink.js";
import { makeid } from "./helpers.js";
let cacheImg;
export const minEditor = (id = makeid(7), parentContainerSink, eContext, imageUrl) => {
    const wrapEl = new DOMParser().parseFromString(`<div style="
    padding: 4px 4px 4px 0;
    border: 1px solid black;
    vertical-align: middle;
    user-select: none;
    border-radius: 6px;
    display: inline-block;
  " class="editor" tabIndex="0"></div>`, "text/html").body.firstChild;
    eContext.elFromFocusId[id] = wrapEl;
    wrapEl.onKey = (e) => {
        if (e.key === "Tab")
            e.preventDefault();
        if (e.key === "Backspace")
            e.preventDefault();
        if (e.key === " ")
            e.preventDefault();
    };
    wrapEl.sink = new ContainerSink(() => wrapEl.getBoundingClientRect());
    wrapEl.sink.parent = parentContainerSink ?? null;
    function reset() {
        wrapEl.str = [];
        wrapEl.innerHTML = "";
        wrapEl.lineEls = [];
    }
    function act(e) { }
    function render() {
        //wrapEl.innerHTML = "";
        let img;
        if (!cacheImg) {
            img = document.createElement("img");
            img.src = imageUrl;
            img.width = 200;
            cacheImg = img;
        }
        else {
            img = cacheImg;
        }
        wrapEl.append(img);
        return [[]];
    }
    wrapEl.act = act;
    wrapEl.id = id;
    wrapEl.render = render;
    wrapEl.reset = reset;
    wrapEl.act = act;
    wrapEl.isEditor = true;
    return wrapEl;
};
