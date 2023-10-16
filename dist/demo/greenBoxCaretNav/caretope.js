import { lerp } from "../../lib/math/Line2.js";
import { make2DLineFunctions } from "../../lib/math/LineT.js";
import { distance } from "../../lib/math/Vec2.js";
import { findIndex2D, least, wrapLinesAddXIndex2D, } from "../../lib/structure/Arrays.js";
import { map } from "../../lib/structure/Iterable.js";
const topVec2 = ({ x, top }) => [x, top];
const bottomVec2 = ({ x, bottom }) => [x, bottom];
function dist(a, b) {
    const lengths = [];
    for (let i = 0; i < 1; i += 0.1) {
        const aP = lerp([topVec2(a), bottomVec2(a)])(i);
        const bP = lerp([topVec2(b), bottomVec2(b)])(i);
        lengths.push(distance(aP, bP));
    }
    return lengths.reduce((prev, cur) => prev + cur / lengths.length, 0); // average of 10 distance measurements across the intervals
    //   const i = seperatingInterval(a.interval, b.interval);
    //   if (i === null) return Math.sqrt((a.n - b.n) ** 2); // intervals overlap so just get 1D distance
    //   return xBiasedDist([a.n, i[0]], [b.n, i[1]]);
}
const { mergeAndSort } = make2DLineFunctions({
    dist,
    toVec2: topVec2,
});
class Sink {
    val;
    name;
    parent = null;
    get x() {
        return this.val().left;
    }
    get left() {
        return this.val().left;
    }
    get right() {
        return this.val().right;
    }
    get top() {
        return this.val().top;
    }
    get bottom() {
        return this.val().bottom;
    }
    constructor(val, name) {
        this.val = val;
        this.name = name;
    }
    leftSibling() {
        if (!this.parent)
            return null;
        const lines = this.parent.cachedLines;
        const index = findIndex2D(lines, (s) => s === this);
        if (this.parent.isLinesWrapped) {
            const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -1);
            return lines[y1]?.[x1] ?? null;
        }
        else {
            return lines[index[0]]?.[index[1] + 1] ?? null;
        }
    }
    leftmostSibling() {
        if (!this.parent)
            return null;
        const lines = this.parent.cachedLines;
        const index = findIndex2D(lines, (s) => s === this);
        return lines[index[0]]?.at(0) ?? null;
    }
    rightSibling() {
        if (!this.parent)
            return null;
        const lines = this.parent.cachedLines;
        const index = findIndex2D(lines, (s) => s === this);
        if (this.parent.isLinesWrapped) {
            const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +1);
            return lines[y1]?.[x1] ?? null;
        }
        else {
            return lines[index[0]]?.[index[1] + 1] ?? null;
        }
    }
    rightmostSibling() {
        if (!this.parent)
            return null;
        const lines = this.parent.cachedLines;
        const index = findIndex2D(lines, (s) => s === this);
        return lines[index[0]]?.at(-1) ?? null;
    }
    upSibling(carryX) {
        if (!this.parent)
            return null;
        const lines = this.parent.cachedLines;
        const prevLine = lines[findIndex2D(lines, (s) => s === this)[0] - 1] ?? [];
        return (least(prevLine, ({ x }) => carryX
            ? Math.abs(carryX - x)
            : Math.min(Math.abs(this.x - x), Math.abs(this.right - x))) ?? null);
    }
    downSibling(carryX) {
        if (!this.parent)
            return null;
        const lines = this.parent.cachedLines;
        const nextLine = lines[findIndex2D(lines, (s) => s === this)[0] + 1] ?? [];
        return (least(nextLine, ({ x }) => carryX
            ? Math.abs(carryX - x)
            : Math.min(Math.abs(this.x - x), Math.abs(this.right - x))) ?? null);
    }
}
export class ContainerSink extends Sink {
    isLinesWrapped = true;
    enterBehaviour = "topLeft"; // should this not be separate from isLinesWrapped?
    children = new Set();
    cachedLines = [];
    addChild(sink) {
        this.children.add(sink);
        sink.parent = this;
    }
    removeChild(sink) {
        this.children.delete(sink);
        sink.parent = null;
    }
    calculateChildLines() {
        this.cachedLines = mergeAndSort(map(this.children, (s) => [s]));
    }
    leftChild(from) {
        if (this.enterBehaviour === "nearest")
            return (least(this.cachedLines, (line) => dist(from, line.at(0)))?.at(0) ??
                null);
        else
            return this.cachedLines.at(0)?.at(0) ?? null;
    }
    rightChild(from) {
        if (this.enterBehaviour === "nearest")
            return (least(this.cachedLines, (line) => dist(from, line.at(-1)))?.at(-1) ??
                null);
        else
            return this.cachedLines.at(-1)?.at(-1) ?? null;
    }
    topChild(from) {
        return (least(this.cachedLines.at(0) ?? [], (sink) => Math.abs(from.x - sink.x)) ?? null // replace this with distance calc in upSibling
        );
    }
    bottomChild(from) {
        return (least(this.cachedLines.at(-1) ?? [], (sink) => Math.abs(from.x - sink.x)) ?? null);
    }
}
export class CaretSink extends Sink {
}
// moves to the left up and down the sink tree until a CaretSink is reached
const recurseUpMoveLeft = (sink, from = sink) => {
    const leftSibling = sink.leftSibling();
    if (leftSibling !== null)
        return recurseDownMoveLeft(from, leftSibling);
    return sink.parent === null ? null : recurseUpMoveLeft(from, sink.parent);
};
const recurseDownMoveLeft = (sink, from) => {
    if (sink instanceof CaretSink)
        return sink;
    const leftChild = sink.leftChild(from);
    return leftChild !== null
        ? recurseDownMoveLeft(from, leftChild)
        : recurseUpMoveLeft(from, sink);
};
// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveRight = (sink, from = sink) => {
    const rightSibling = sink.rightSibling();
    if (rightSibling !== null)
        return recurseDownMoveRight(from, rightSibling);
    return sink.parent === null ? null : recurseUpMoveRight(from, sink.parent);
};
const recurseDownMoveRight = (sink, from) => {
    if (sink instanceof CaretSink)
        return sink;
    const rightChild = sink.rightChild(from);
    return rightChild !== null
        ? recurseDownMoveRight(from, rightChild)
        : recurseUpMoveRight(from, sink);
};
// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveUp = (sink, from = sink) => {
    const upSibling = sink.upSibling();
    if (upSibling !== null)
        return recurseDownMoveUp(from, upSibling);
    return ((sink.parent === null ? null : recurseUpMoveUp(from, sink.parent)) ??
        sink.leftmostSibling());
};
const recurseDownMoveUp = (sink, from) => {
    if (sink instanceof CaretSink)
        return sink;
    const bottomChild = sink.bottomChild(from);
    return bottomChild !== null
        ? recurseDownMoveUp(from, bottomChild)
        : recurseUpMoveUp(from, sink);
};
// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveDown = (sink, from = sink) => {
    const downSibling = sink.downSibling();
    if (downSibling !== null)
        return recurseDownMoveDown(from, downSibling);
    return ((sink.parent === null ? null : recurseUpMoveUp(from, sink.parent)) ??
        sink.rightmostSibling());
};
const recurseDownMoveDown = (sink, from) => {
    if (sink instanceof CaretSink)
        return sink;
    const topChild = sink.topChild(from);
    return topChild !== null
        ? recurseDownMoveDown(from, topChild)
        : recurseUpMoveDown(from, sink);
};
export class Caret {
    caretSink;
    isVerticalLinear = true;
    carrySink = null;
    get currentCaretSink() {
        return this.currentCaretSink;
    }
    constructor(caretSink) {
        this.caretSink = caretSink;
    }
    moveLeft() {
        if (this.isVerticalLinear)
            this.carrySink = null;
        const next = recurseUpMoveLeft(this.caretSink);
        if (next !== null)
            this.caretSink = next;
    }
    moveRight() {
        if (this.isVerticalLinear)
            this.carrySink = null;
        const next = recurseUpMoveRight(this.caretSink);
        if (next !== null)
            this.caretSink = next;
    }
    moveUp() {
        if (this.isVerticalLinear)
            this.carrySink ??= this.caretSink;
        const next = recurseUpMoveUp(this.caretSink, this.carrySink ?? undefined);
        if (next !== null)
            this.caretSink = next;
    }
    moveDown() {
        if (this.isVerticalLinear)
            this.carrySink ??= this.caretSink;
        const next = recurseUpMoveDown(this.caretSink, this.carrySink ?? undefined);
        if (next !== null)
            this.caretSink = next;
    }
}
