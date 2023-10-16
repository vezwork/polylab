import { lerp } from "../../lib/math/Line2.js";
import { make2DLineFunctions } from "../../lib/math/LineT.js";
import { distance } from "../../lib/math/Vec2.js";
import { findIndex2D, least, wrapLinesAddXIndex2D, } from "../../lib/structure/Arrays.js";
import { map } from "../../lib/structure/Iterable.js";
const topLeftVec2 = ({ x, top }) => [x, top];
const topRightVec2 = ({ right, top }) => [right, top];
// approximates the area of the convex quadrilateral between the two vertical intervals
// TODO: use an exact formula like https://www.mathwords.com/a/area_convex_polygon.htm
// TODO: is this even a good sense of distance?
function dist(a, b) {
    const lengths = [];
    for (let i = 0; i < 1; i += 0.1) {
        const aP = lerp([a.vec2, [a.vec2[0], a.s.bottom]])(i);
        const bP = lerp([b.vec2, [b.vec2[0], b.s.bottom]])(i);
        lengths.push(distance(aP, bP));
    }
    return lengths.reduce((prev, cur) => prev + cur / lengths.length, 0); // average of 10 distance measurements across the intervals
}
const leftSinkSide = (s) => ({ vec2: topLeftVec2(s), s });
const rightSinkSide = (s) => ({ vec2: topRightVec2(s), s });
const { mergeAndSort } = make2DLineFunctions({
    dist,
    toVec2: ({ vec2 }) => vec2,
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
        if (this.parent === null)
            return null;
        return this.parent.leftSiblingOf(this);
    }
    leftmostSibling() {
        if (this.parent === null)
            return null;
        return this.parent.leftmostSiblingOf(this);
    }
    rightSibling() {
        if (this.parent === null)
            return null;
        return this.parent.rightSiblingOf(this);
    }
    rightmostSibling() {
        if (this.parent === null)
            return null;
        return this.parent.rightmostSiblingOf(this);
    }
    upSibling(carryX) {
        if (this.parent === null)
            return null;
        return this.parent.upSiblingOf(this, carryX);
    }
    downSibling(carryX) {
        if (this.parent === null)
            return null;
        return this.parent.downSiblingOf(this, carryX);
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
        this.cachedLines = mergeAndSort(map(this.children, (s) => [leftSinkSide(s), rightSinkSide(s)])).map((l) => l.filter((_, i) => i % 2 === 0).map(({ s }) => s));
    }
    // SIBLING STUFF
    leftSiblingOf(child) {
        const lines = this.cachedLines;
        const index = findIndex2D(lines, (s) => s === child);
        if (this.isLinesWrapped) {
            const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -1);
            return lines[y1]?.[x1] ?? null;
        }
        else {
            return lines[index[0]]?.[index[1] - 1] ?? null;
        }
    }
    leftmostSiblingOf(child) {
        const lines = this.cachedLines;
        const index = findIndex2D(lines, (s) => s === child);
        return lines[index[0]]?.at(0) ?? null;
    }
    rightSiblingOf(child) {
        const lines = this.cachedLines;
        const index = findIndex2D(lines, (s) => s === child);
        if (this.isLinesWrapped) {
            const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +1);
            return lines[y1]?.[x1] ?? null;
        }
        else {
            return lines[index[0]]?.[index[1] + 1] ?? null;
        }
    }
    rightmostSiblingOf(child) {
        const lines = this.cachedLines;
        const index = findIndex2D(lines, (s) => s === child);
        return lines[index[0]]?.at(-1) ?? null;
    }
    upSiblingOf(child, carryX) {
        const lines = this.cachedLines;
        const prevLine = lines[findIndex2D(lines, (s) => s === child)[0] - 1] ?? [];
        return (least(prevLine, ({ left, right }) => carryX
            ? Math.max(carryX, left) - Math.min(carryX, right)
            : Math.max(child.left, left) - Math.min(child.right, right)) ?? null);
    }
    downSiblingOf(child, carryX) {
        const lines = this.cachedLines;
        const nextLine = lines[findIndex2D(lines, (s) => s === child)[0] + 1] ?? [];
        return (least(nextLine, ({ left, right }) => carryX
            ? Math.max(carryX, left) - Math.min(carryX, right)
            : Math.max(child.left, left) - Math.min(child.right, right)) ?? null);
    }
    // CHILD STUFF
    leftChild(from) {
        if (this.enterBehaviour === "nearest")
            return (least(this.cachedLines, (line) => dist(rightSinkSide(from), leftSinkSide(line.at(0))))?.at(0) ?? null);
        else
            return this.cachedLines.at(0)?.at(0) ?? null;
    }
    rightChild(from) {
        if (this.enterBehaviour === "nearest")
            return (least(this.cachedLines, (line) => dist(leftSinkSide(from), rightSinkSide(line.at(-1))))?.at(-1) ?? null);
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
        return recurseDownMoveLeft(leftSibling, from);
    return sink.parent === null ? null : recurseUpMoveLeft(sink.parent, from);
};
const recurseDownMoveLeft = (sink, from) => {
    if (sink instanceof CaretSink)
        return sink;
    const rightChild = sink.rightChild(from);
    return rightChild !== null
        ? recurseDownMoveLeft(rightChild, from)
        : recurseUpMoveLeft(sink, from);
};
// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveRight = (sink, from = sink) => {
    const rightSibling = sink.rightSibling();
    if (rightSibling !== null)
        return recurseDownMoveRight(rightSibling, from);
    return sink.parent === null ? null : recurseUpMoveRight(sink.parent, from);
};
const recurseDownMoveRight = (sink, from) => {
    if (sink instanceof CaretSink)
        return sink;
    const leftChild = sink.leftChild(from);
    return leftChild !== null
        ? recurseDownMoveRight(leftChild, from)
        : recurseUpMoveRight(sink, from);
};
// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveUp = (sink, from = sink) => {
    const upSibling = sink.upSibling(from.left);
    if (upSibling !== null)
        return recurseDownMoveUp(upSibling, from);
    const result = sink.parent === null ? null : recurseUpMoveUp(sink.parent, from);
    if (result !== null)
        return result;
    const leftmostSibling = sink.leftmostSibling();
    if (leftmostSibling === null)
        return null;
    return recurseDownMoveRight(leftmostSibling, from);
};
const leftmostSiblingRecursive = (sink) => sink.leftmostSibling() ??
    (sink.parent === null ? null : leftmostSiblingRecursive(sink.parent));
const recurseDownMoveUp = (sink, from) => {
    if (sink instanceof CaretSink)
        return sink;
    const bottomChild = sink.bottomChild(from);
    return bottomChild !== null
        ? recurseDownMoveUp(bottomChild, from)
        : recurseUpMoveUp(sink, from);
};
// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveDown = (sink, from = sink) => {
    const downSibling = sink.downSibling(from.left);
    if (downSibling !== null)
        return recurseDownMoveDown(downSibling, from);
    const result = sink.parent === null ? null : recurseUpMoveDown(sink.parent, from);
    if (result !== null)
        return result;
    const rightmostSibling = sink.rightmostSibling();
    if (rightmostSibling === null)
        return null;
    return recurseDownMoveLeft(rightmostSibling, from);
};
const recurseDownMoveDown = (sink, from) => {
    if (sink instanceof CaretSink)
        return sink;
    const topChild = sink.topChild(from);
    return topChild !== null
        ? recurseDownMoveDown(topChild, from)
        : recurseUpMoveDown(sink, from);
};
export class Caret {
    caretSink;
    isVerticalLinear = true;
    carrySink = null;
    get currentCaretSink() {
        return this.caretSink;
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
            return (this.caretSink = next);
        const leftmost = leftmostSiblingRecursive(this.caretSink);
        if (leftmost !== null)
            return (this.caretSink = leftmost);
    }
    moveDown() {
        if (this.isVerticalLinear)
            this.carrySink ??= this.caretSink;
        const next = recurseUpMoveDown(this.caretSink, this.carrySink ?? undefined);
        if (next !== null)
            return (this.caretSink = next);
    }
}
