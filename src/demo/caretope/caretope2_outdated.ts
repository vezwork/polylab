import { lerp, segXProj } from "../../lib/math/Line2.js";
import { make2DLineFunctions } from "../../lib/math/LineT.js";
import { Vec2, distance } from "../../lib/math/Vec2.js";
import {
  findIndex2D,
  least,
  wrapLinesAddXIndex2D,
} from "../../lib/structure/Arrays.js";
import { map } from "../../lib/structure/Iterable.js";

const topLeftVec2 = (sink: Sink) => ({
  vec2: [sink.left, sink.top] as Vec2,
  sink,
});
const topRightVec2 = (sink: Sink) => ({
  vec2: [sink.right, sink.top] as Vec2,
  sink,
});
const bottomVec2 = ({ x, bottom }: Sink) => [x, bottom] as Vec2;

function dist(a: Sink, b: Sink) {
  const lengths: number[] = [];
  for (let i = 0; i < 1; i += 0.1) {
    const aP = lerp([topLeftVec2(a).vec2, bottomVec2(a)])(i);
    const bP = lerp([topLeftVec2(b).vec2, bottomVec2(b)])(i);
    lengths.push(distance(aP, bP));
  }
  return lengths.reduce((prev, cur) => prev + cur / lengths.length, 0); // average of 10 distance measurements across the intervals
}

const { mergeAndSort } = make2DLineFunctions<{ vec2: Vec2; sink: Sink }>({
  dist: ({ sink: s1, sink: s2 }) => dist(s1, s2),
  toVec2: ({ vec2 }) => vec2,
});

class Sink {
  parent: ContainerSink | null = null;

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

  constructor(
    private val: () => {
      left: number;
      right: number;
      top: number;
      bottom: number;
    },
    public name?: string
  ) {}

  leftSibling(): CaretSink | null {
    if (this.parent === null) return null;
    return this.parent.leftSiblingOf(this);
  }
  leftmostSibling(): CaretSink | null {
    if (this.parent === null) return null;
    return this.parent.leftmostSiblingOf(this);
  }
  rightSibling() {
    if (this.parent === null) return null;
    return this.parent.rightSiblingOf(this);
  }
  rightmostSibling(): CaretSink | null {
    if (this.parent === null) return null;
    return this.parent.rightmostSiblingOf(this);
  }
  upSibling(carryX?: number): CaretSink | null {
    if (this.parent === null) return null;
    return this.parent.upSiblingOf(this, carryX);
  }
  downSibling(carryX?: number): CaretSink | null {
    if (this.parent === null) return null;
    return this.parent.downSiblingOf(this, carryX);
  }
}

export class ContainerSink extends Sink {
  isLinesWrapped: boolean = true;
  enterBehaviour: "nearest" | "topLeft" = "topLeft"; // should this not be separate from isLinesWrapped?

  children: Set<Sink> = new Set();
  cachedLines: Sink[][] = [];

  addChild(sink: Sink) {
    this.children.add(sink);
    sink.parent = this;
  }
  removeChild(sink: Sink) {
    this.children.delete(sink);
    sink.parent = null;
  }

  calculateChildLines() {
    this.cachedLines = mergeAndSort(
      map(this.children, (s) => [topLeftVec2(s)])
    ).map((line) => line.map((v) => v.sink));
  }

  // SIBLING STUFF

  leftSiblingOf(child: CaretSink): CaretSink | null {
    const lines = this.cachedLines;

    const index = findIndex2D(lines, (s) => s === child);
    if (this.isLinesWrapped) {
      const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -1);
      return lines[y1]?.[x1] ?? null;
    } else {
      return lines[index[0]]?.[index[1] - 1] ?? null;
    }
  }
  leftmostSiblingOf(child: CaretSink): CaretSink | null {
    const lines = this.cachedLines;

    const index = findIndex2D(lines, (s) => s === child);
    return lines[index[0]]?.at(0) ?? null;
  }
  rightSiblingOf(child: CaretSink) {
    const lines = this.cachedLines;

    const index = findIndex2D(lines, (s) => s === child);
    if (this.isLinesWrapped) {
      const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +1);
      return lines[y1]?.[x1] ?? null;
    } else {
      return lines[index[0]]?.[index[1] + 1] ?? null;
    }
  }
  rightmostSiblingOf(child: CaretSink): CaretSink | null {
    const lines = this.cachedLines;

    const index = findIndex2D(lines, (s) => s === child);
    return lines[index[0]]?.at(-1) ?? null;
  }
  upSiblingOf(child: CaretSink, carryX?: number): CaretSink | null {
    const lines = this.cachedLines;

    const prevLine = lines[findIndex2D(lines, (s) => s === child)[0] - 1] ?? [];
    return (
      least(prevLine, ({ left, right }: CaretSink) =>
        carryX
          ? Math.max(carryX, left) - Math.min(carryX, right)
          : Math.max(child.left, left) - Math.min(child.right, right)
      ) ?? null
    );
  }
  downSiblingOf(child: CaretSink, carryX?: number): CaretSink | null {
    const lines = this.cachedLines;

    const nextLine = lines[findIndex2D(lines, (s) => s === child)[0] + 1] ?? [];
    return (
      least(nextLine, ({ left, right }: CaretSink) =>
        carryX
          ? Math.max(carryX, left) - Math.min(carryX, right)
          : Math.max(child.left, left) - Math.min(child.right, right)
      ) ?? null
    );
  }

  // CHILD STUFF

  leftChild(from: Sink): Sink | null {
    if (this.enterBehaviour === "nearest")
      return (
        least(this.cachedLines, (line) => dist(from, line.at(0)!))?.at(0) ??
        null
      );
    else return this.cachedLines.at(0)?.at(0) ?? null;
  }
  rightChild(from: Sink): Sink | null {
    if (this.enterBehaviour === "nearest")
      return (
        least(this.cachedLines, (line) => dist(from, line.at(-1)!))?.at(-1) ??
        null
      );
    else return this.cachedLines.at(-1)?.at(-1) ?? null;
  }
  topChild(from: Sink): Sink | null {
    return (
      least(this.cachedLines.at(0) ?? [], (sink) =>
        Math.abs(from.x - sink.x)
      ) ?? null // replace this with distance calc in upSibling
    );
  }
  bottomChild(from: Sink): Sink | null {
    return (
      least(this.cachedLines.at(-1) ?? [], (sink) =>
        Math.abs(from.x - sink.x)
      ) ?? null
    );
  }
}
export class CaretSink extends Sink {}

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
  const upSibling = sink.upSibling(from.left);
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
  const downSibling = sink.downSibling(from.left);
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

export class Caret {
  isVerticalLinear: boolean = true;
  private carrySink: CaretSink | null = null;

  get currentCaretSink() {
    return this.caretSink;
  }

  constructor(private caretSink: CaretSink) {}

  moveLeft() {
    if (this.isVerticalLinear) this.carrySink = null;
    const next = recurseUpMoveLeft(this.caretSink);
    if (next !== null) this.caretSink = next;
  }

  moveRight() {
    if (this.isVerticalLinear) this.carrySink = null;
    const next = recurseUpMoveRight(this.caretSink);
    if (next !== null) this.caretSink = next;
  }
  moveUp() {
    if (this.isVerticalLinear) this.carrySink ??= this.caretSink;
    const next = recurseUpMoveUp(this.caretSink, this.carrySink ?? undefined);
    if (next !== null) return (this.caretSink = next);
    const leftmost = leftmostSiblingRecursive(this.caretSink);
    if (leftmost !== null) return (this.caretSink = leftmost);
  }
  moveDown() {
    if (this.isVerticalLinear) this.carrySink ??= this.caretSink;
    const next = recurseUpMoveDown(this.caretSink, this.carrySink ?? undefined);
    if (next !== null) return (this.caretSink = next);
  }
}
