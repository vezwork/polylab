import { setupFullscreenCanvas } from "../../lib/draw/setupFullscreenCanvas.js";
import { Caret } from "../caretope/caretope_caret.js";
import { CaretSink, ContainerSink } from "../caretope/caretope_sink.js";
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
const container = new ContainerSink(() => ({
    top: 0,
    left: 0,
    right: 100,
    bottom: 0,
}));
const renderedBounds = new Map();
const nodeFromSink = new Map();
const sinkFromNode = new Map();
const insertAfter = (after) => (data) => {
    const newNode = {
        next: after.next,
        prev: after,
        data,
    };
    if (after.next)
        after.next.prev = newNode;
    if (after)
        after.next = newNode;
    const sink = new CaretSink(() => {
        const [left, top, width, height] = renderedBounds.get(newNode);
        return {
            top,
            left,
            right: left + 1,
            bottom: top + height,
        };
    });
    nodeFromSink.set(sink, newNode);
    sinkFromNode.set(newNode, sink);
    container.addChild(sink);
    caret.caretSink = sink;
    return newNode;
};
const remove = (node) => {
    const prev = node.prev;
    prev.next = node.next;
    if (node.next)
        node.next.prev = prev;
    if (caret.caretSink === sinkFromNode.get(node))
        caret.caretSink = sinkFromNode.get(prev);
    container.removeChild(sinkFromNode.get(node));
    renderedBounds.delete(node);
    sinkFromNode.delete(node);
    nodeFromSink.delete(sinkFromNode.get(node));
    return prev;
};
const start = { data: null, prev: null, next: null };
renderedBounds.set(start, [-10, -10, -9, -9]);
const sink = new CaretSink(() => ({
    top: -10,
    left: -10,
    right: -9,
    bottom: -9,
}));
container.addChild(sink);
const caret = new Caret(sink);
nodeFromSink.set(sink, start);
sinkFromNode.set(start, sink);
function* iter(node) {
    let cur = node.next;
    while (cur !== null) {
        yield cur;
        cur = cur.next;
    }
}
const FONT_SIZE = 54;
const NODE_SIZE = 20;
const PADDING = 1;
function render() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = `${FONT_SIZE}px monospace`;
    let offsetX = 0;
    for (const node of iter(start)) {
        const { data } = node;
        if (typeof data === "string") {
            ctx.fillText(data, offsetX, FONT_SIZE);
            const { width } = ctx.measureText(data);
            offsetX += width + PADDING;
            renderedBounds.set(node, [offsetX, 0, width, FONT_SIZE]);
        }
        if (typeof data === "object" && data !== null) {
            const width = drawTree(data, offsetX, 0);
            offsetX += width + PADDING;
            renderedBounds.set(node, [offsetX, 0, width, 99]);
        }
    }
    container.calculateChildLines();
    console.log(caret.currentCaretSink, nodeFromSink.get(caret.currentCaretSink), renderedBounds.get(nodeFromSink.get(caret.currentCaretSink)));
    const [left, top, width, height] = renderedBounds.get(nodeFromSink.get(caret.currentCaretSink));
    console.log(caret.currentCaretSink.line());
    ctx.fillStyle = "red";
    ctx.fillRect(left, top, 5, height);
    ctx.fillStyle = "black";
}
render();
const PAD = 4;
function drawTree(t, x, y) {
    const width = treeWidth(t);
    const pos = [x + width / 2 - NODE_SIZE / 2 + PAD, y];
    ctx.fillRect(...pos, NODE_SIZE - PAD, NODE_SIZE - PAD);
    let offsetX = 0;
    for (const st of t.s) {
        const stWidth = drawTree(st, x + offsetX, y + NODE_SIZE * 2);
        offsetX += stWidth;
        const mid = x + offsetX - stWidth / 2;
        ctx.beginPath(); // Start a new path
        ctx.moveTo(x + width / 2 + 1, y + NODE_SIZE - PAD); // Move the pen to (30, 50)
        ctx.lineTo(mid + 1, y + NODE_SIZE * 2); // Draw a line to (150, 100)
        ctx.stroke();
    }
    renderedBounds.set(t, [pos[0], y, NODE_SIZE, NODE_SIZE]);
    return width;
}
function treeWidth(t) {
    if (t.s.length === 0)
        return NODE_SIZE;
    let width = 0;
    for (const st of t.s)
        width += treeWidth(st);
    return width;
}
document.addEventListener("keydown", (e) => {
    console.log(e.key);
    const curNode = nodeFromSink.get(caret.currentCaretSink);
    if (e.key === "Backspace") {
        if ("s" in curNode)
            1;
        else
            remove(curNode);
    }
    if (e.key === "Shift") {
        if ("s" in curNode)
            curNode.s.push({ s: [] });
        else
            1;
    }
    if (e.key === "Tab")
        if ("s" in curNode) {
            const newNode = { s: [] };
            curNode.s.push(newNode);
            const sink = new CaretSink(() => {
                const [left, top, width, height] = renderedBounds.get(newNode);
                return {
                    top,
                    left,
                    right: left + 1,
                    bottom: top + height,
                };
            });
            nodeFromSink.set(sink, newNode);
            sinkFromNode.set(newNode, sink);
            container.addChild(sink);
            caret.caretSink = sink;
        }
        else {
            const newNode = {
                s: [],
            };
            insertAfter(curNode)(newNode);
            const sink = new CaretSink(() => {
                const [left, top, width, height] = renderedBounds.get(newNode);
                return {
                    top,
                    left,
                    right: left + 1,
                    bottom: top + height,
                };
            });
            nodeFromSink.set(sink, newNode);
            sinkFromNode.set(newNode, sink);
            container.addChild(sink);
            caret.caretSink = sink;
        }
    if (e.key.length === 1) {
        if ("s" in curNode)
            1;
        else
            insertAfter(curNode)(e.key);
    }
    if (e.key === "ArrowLeft")
        caret.moveLeft();
    if (e.key === "ArrowRight")
        caret.moveRight();
    if (e.key === "ArrowUp")
        caret.moveUp();
    if (e.key === "ArrowDown")
        caret.moveDown();
    e.preventDefault();
    render();
    console.log(start);
});
// TODO:
// wrap trees in containerSinks
// want to be able to tune the distance function in the trees so the lines are better (no vertical distance allowed)
