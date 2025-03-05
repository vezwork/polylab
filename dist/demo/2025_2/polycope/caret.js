import { CaretSink } from "./caretsink.js";
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
        if (!this.caretSink)
            return;
        //if (this.isVerticalLinear) this.carrySink = null;
        const next = recurseUpMoveLeft(this.caretSink);
        if (next !== null)
            this.caretSink = next;
    }
    moveRight() {
        if (!this.caretSink)
            return;
        //if (this.isVerticalLinear) this.carrySink = null;
        const next = recurseUpMoveRight(this.caretSink);
        if (next !== null)
            this.caretSink = next;
    }
    moveUp() {
        if (!this.caretSink)
            return;
        //if (this.isVerticalLinear) this.carrySink ??= this.caretSink;
        const next = recurseUpMoveUp(this.caretSink, this.carrySink ?? undefined);
        if (next !== null)
            return (this.caretSink = next);
        const leftmost = leftmostSiblingRecursive(this.caretSink);
        if (leftmost !== null)
            return (this.caretSink = leftmost);
    }
    moveDown() {
        if (!this.caretSink)
            return;
        //if (this.isVerticalLinear) this.carrySink ??= this.caretSink;
        const next = recurseUpMoveDown(this.caretSink, this.carrySink ?? undefined);
        if (next !== null)
            return (this.caretSink = next);
    }
    moveToStartOfRootLine() {
        if (!this.caretSink)
            return;
        //if (this.isVerticalLinear) this.carrySink = null;
        this.caretSink =
            recurseUpToChildOfRoot(this.caretSink)?.leftmostSibling() ?? undefined;
    }
    moveToEndOfRootLine() {
        if (!this.caretSink)
            return;
        //if (this.isVerticalLinear) this.carrySink = null;
        this.caretSink =
            recurseUpToChildOfRoot(this.caretSink)?.rightmostSibling() ?? undefined;
    }
    moveToRootStart() {
        if (!this.caretSink)
            return;
        //if (this.isVerticalLinear) this.carrySink = null;
        this.caretSink = recurseUpToRoot(this.caretSink)?.lines[0][0] ?? undefined;
    }
    moveToRootEnd() {
        if (!this.caretSink)
            return;
        //if (this.isVerticalLinear) this.carrySink = null;
        this.caretSink =
            recurseUpToRoot(this.caretSink)?.lines.at(-1)?.at(-1) ?? undefined;
    }
}
const recurseUpToRoot = (sink) => sink.parent ? recurseUpToRoot(sink.parent) : sink;
const recurseUpToChildOfRoot = (sink) => sink.parent?.parent ? recurseUpToChildOfRoot(sink.parent) : sink;
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
    const upSibling = sink.upSibling(from.right);
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
    const downSibling = sink.downSibling(from.right);
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
