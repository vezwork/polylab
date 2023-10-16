import { nexts } from "../../lib/structure/doubleLinkedList.js";
const PAD = 4;
const FONT_SIZE = 54;
const NODE_SIZE = 20;
const PADDING = 1;
export function render(ctx, container, caret, start, renderedBounds, nodeFromSink) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = `${FONT_SIZE}px monospace`;
    let offsetX = 0;
    for (const node of nexts(start)) {
        const { data } = node;
        if (typeof data === "string") {
            ctx.fillText(data, offsetX, FONT_SIZE);
            const { width } = ctx.measureText(data);
            offsetX += width + PADDING;
            renderedBounds.set(node, [offsetX, 0, width, FONT_SIZE]);
        }
        if (typeof data === "object" && data !== null) {
            const width = drawTree(ctx, data, offsetX, 0, renderedBounds);
            offsetX += width + PADDING;
            renderedBounds.set(node, [offsetX, 0, width, 99]);
        }
    }
    //   console.log(
    //     caret.currentCaretSink,
    //     nodeFromSink.get(caret.currentCaretSink),
    //     renderedBounds.get(nodeFromSink.get(caret.currentCaretSink)!)
    //   );
    const [left, top, width, height] = renderedBounds.get(nodeFromSink.get(caret.currentCaretSink));
    //   console.log(caret.currentCaretSink.line());
    ctx.fillStyle = "red";
    ctx.fillRect(left, top, 5, height);
    ctx.fillStyle = "black";
}
export function drawTree(ctx, t, x, y, renderedBounds) {
    const width = treeWidth(t);
    const pos = [x + width / 2 - NODE_SIZE / 2 + PAD, y];
    ctx.fillRect(...pos, NODE_SIZE - PAD, NODE_SIZE - PAD);
    let offsetX = 0;
    for (const st of t.s) {
        const stWidth = drawTree(ctx, st, x + offsetX, y + NODE_SIZE * 2, renderedBounds);
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
