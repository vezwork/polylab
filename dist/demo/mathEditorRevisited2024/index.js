import { MapWithInverse } from "../../lib/structure/data.js";
import { Caret } from "../caretope/caretope_caret.js";
import { CaretSink, ContainerSink } from "../caretope/caretope_sink.js";
// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element) => {
    const { top, right, bottom, left, width, height, x, y } = element.getBoundingClientRect();
    return { top, right, bottom, left, width, height, x, y };
};
const parentContainer = (e) => e.parentElement?.closest("container") ?? null;
const elFromContainerSink = new MapWithInverse();
const containerSinkFromEl = elFromContainerSink.inverse;
const elFromCaretSink = new MapWithInverse();
const Container = (parent) => {
    const div = document.createElement("container");
    parent.append(div);
    const p = parentContainer(div);
    const newChild = new ContainerSink(() => getBoundingClientRect(div));
    newChild.isLinesWrapped = false;
    newChild.enterBehaviour = "nearest";
    if (p !== null) {
        const parentSink = containerSinkFromEl.get(p);
        parentSink.addChild(newChild);
        parentSink.calculateChildLines();
    }
    //caret.caretSink = newChild;
    //parent = newChild;
    elFromContainerSink.set(newChild, div);
    Caretable(div);
    return div;
};
const Caretable = (parent) => {
    const div = document.createElement("caretable");
    parent.append(div);
    const p = parentContainer(div);
    const newChild = new CaretSink(() => {
        const { right, left, top, bottom } = getBoundingClientRect(div);
        return { left: right, right, top, bottom };
    });
    const parentSink = containerSinkFromEl.get(p);
    parentSink.addChild(newChild);
    parentSink.calculateChildLines();
    //   caret.caretSink = newChild;
    elFromCaretSink.set(newChild, div);
    return div;
};
const root = Container(document.body);
const c1 = Caretable(root);
c1.append("@");
const c2 = Caretable(root);
root.append(document.createElement("br"));
const c3 = Caretable(root);
const insider = Container(c3);
const c4 = Caretable(insider);
const c5 = Caretable(insider);
const caret = new Caret(elFromCaretSink.inverse.get(c1));
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
        caret.moveLeft();
    }
    if (e.key === "ArrowRight") {
        caret.moveRight();
    }
    if (e.key === "ArrowUp") {
        caret.moveUp();
    }
    if (e.key === "ArrowDown") {
        caret.moveDown();
    }
    console.log(caret.caretSink, elFromCaretSink.get(caret.caretSink));
});
