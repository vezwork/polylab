import { CaretSink, ContainerSink, Sink } from "./caretsink.js";

export class Caret {
  isVerticalLinear: boolean = true;
  private carrySink: CaretSink | null = null;

  get currentCaretSink() {
    return this.caretSink;
  }

  constructor(public caretSink?: CaretSink) {}

  moveLeft() {
    if (!this.caretSink) return;
    //if (this.isVerticalLinear) this.carrySink = null;
    const next = recurseUpMoveLeft(this.caretSink);
    if (next !== null) this.caretSink = next;
  }

  moveRight() {
    if (!this.caretSink) return;
    //if (this.isVerticalLinear) this.carrySink = null;
    const next = recurseUpMoveRight(this.caretSink);
    if (next !== null) this.caretSink = next;
  }
  moveRightFlat() {
    if (!this.caretSink) return;
    let next = this.caretSink.rightSibling();
    if (next !== null) this.caretSink = next;
  }
  moveUp() {
    if (!this.caretSink) return;
    //if (this.isVerticalLinear) this.carrySink ??= this.caretSink;
    const next = recurseUpMoveUp(this.caretSink, this.carrySink ?? undefined);
    if (next !== null) return (this.caretSink = next);
    const leftmost = leftmostSiblingRecursive(this.caretSink);
    if (leftmost !== null) return (this.caretSink = leftmost);
  }
  moveDown() {
    if (!this.caretSink) return;
    //if (this.isVerticalLinear) this.carrySink ??= this.caretSink;
    const next = recurseUpMoveDown(this.caretSink, this.carrySink ?? undefined);
    if (next !== null) return (this.caretSink = next);
  }

  moveToStartOfRootLine() {
    if (!this.caretSink) return;
    //if (this.isVerticalLinear) this.carrySink = null;
    this.caretSink =
      recurseUpToChildOfRoot(this.caretSink)?.leftmostSibling() ?? undefined;
  }
  moveToEndOfRootLine() {
    if (!this.caretSink) return;
    //if (this.isVerticalLinear) this.carrySink = null;
    this.caretSink =
      recurseUpToChildOfRoot(this.caretSink)?.rightmostSibling() ?? undefined;
  }

  moveToRootStart() {
    if (!this.caretSink) return;
    //if (this.isVerticalLinear) this.carrySink = null;
    this.caretSink = recurseUpToRoot(this.caretSink)?.lines[0][0] ?? undefined;
  }
  moveToRootEnd() {
    if (!this.caretSink) return;
    //if (this.isVerticalLinear) this.carrySink = null;
    this.caretSink =
      recurseUpToRoot(this.caretSink)?.lines.at(-1)?.at(-1) ?? undefined;
  }
}

const recurseUpToRoot = (sink: Sink): ContainerSink | null =>
  sink.parent ? recurseUpToRoot(sink.parent) : (sink as ContainerSink);
const recurseUpToChildOfRoot = (sink: Sink): Sink | null =>
  sink.parent?.parent ? recurseUpToChildOfRoot(sink.parent) : sink;

// moves to the left up and down the sink tree until a CaretSink is reached
const recurseUpMoveLeft = (sink: Sink, from: Sink = sink): Sink | null => {
  const leftSibling = sink.leftSibling();
  if (leftSibling !== null) return recurseDownMoveLeft(leftSibling, from);

  return sink.parent === null ? null : recurseUpMoveLeft(sink.parent, from);
};
const recurseDownMoveLeft = (sink: Sink, from: Sink): Sink | null => {
  if (sink instanceof CaretSink) return sink;

  const rightChild = (sink as ContainerSink).rightChild(from);
  return rightChild !== null
    ? recurseDownMoveLeft(rightChild, from)
    : recurseUpMoveLeft(sink, from);
};

// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveRight = (sink: Sink, from: Sink = sink): Sink | null => {
  const rightSibling = sink.rightSibling();
  if (rightSibling !== null) return recurseDownMoveRight(rightSibling, from);

  return sink.parent === null ? null : recurseUpMoveRight(sink.parent, from);
};
const recurseDownMoveRight = (sink: Sink, from: Sink): Sink | null => {
  if (sink instanceof CaretSink) return sink;

  const leftChild = (sink as ContainerSink).leftChild(from);
  return leftChild !== null
    ? recurseDownMoveRight(leftChild, from)
    : recurseUpMoveRight(sink, from);
};

// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveUp = (sink: Sink, from: Sink = sink): Sink | null => {
  const upSibling = sink.upSibling(from.right);
  if (upSibling !== null) return recurseDownMoveUp(upSibling, from);

  const result =
    sink.parent === null ? null : recurseUpMoveUp(sink.parent, from);
  if (result !== null) return result;

  const leftmostSibling = sink.leftmostSibling();
  if (leftmostSibling === null) return null;
  return recurseDownMoveRight(leftmostSibling, from);
};
const leftmostSiblingRecursive = (sink: Sink): Sink | null =>
  sink.leftmostSibling() ??
  (sink.parent === null ? null : leftmostSiblingRecursive(sink.parent));
const recurseDownMoveUp = (sink: Sink, from: Sink): Sink | null => {
  if (sink instanceof CaretSink) return sink;

  const bottomChild = (sink as ContainerSink).bottomChild(from);
  return bottomChild !== null
    ? recurseDownMoveUp(bottomChild, from)
    : recurseUpMoveUp(sink, from);
};

// moves to the right up and down the sink tree until a CaretSink is reached
const recurseUpMoveDown = (sink: Sink, from: Sink = sink): Sink | null => {
  const downSibling = sink.downSibling(from.right);
  if (downSibling !== null) return recurseDownMoveDown(downSibling, from);

  const result =
    sink.parent === null ? null : recurseUpMoveDown(sink.parent, from);
  if (result !== null) return result;

  const rightmostSibling = sink.rightmostSibling();
  if (rightmostSibling === null) return null;
  return recurseDownMoveLeft(rightmostSibling, from);
};

const recurseDownMoveDown = (sink: Sink, from: Sink): Sink | null => {
  if (sink instanceof CaretSink) return sink;

  const topChild = (sink as ContainerSink).topChild(from);
  return topChild !== null
    ? recurseDownMoveDown(topChild, from)
    : recurseUpMoveDown(sink, from);
};
