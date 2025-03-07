import { lerp } from "../../../lib/math/Line2.js";
import { Vec2, distance } from "../../../lib/math/Vec2.js";
import {
  findIndex2D,
  least,
  wrapLinesAddXIndex2D,
} from "../../../lib/structure/Arrays.js";

export abstract class Sink {
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
  line(): CaretSink[] {
    if (this.parent === null) return [];
    return this.parent.lineOf(this);
  }

  isFirst(): boolean | null {
    if (this.parent === null) return null;
    return this.parent.lines[0][0] === this;
  }
  isLast(): boolean | null {
    if (this.parent === null) return null;
    return this.parent.lines.at(-1)?.at(-1) === this;
  }
}

export class ContainerSink extends Sink {
  isLinesWrapped: boolean = true;
  enterBehaviour: "nearest" | "topLeft" = "topLeft";

  lines: Sink[][] = [];

  // SIBLING STUFF

  lineOf(child: CaretSink): CaretSink[] {
    const [y] = findIndex2D(this.lines, (s) => s === child);
    return this.lines[y] ?? [];
  }

  leftSiblingOf(child: CaretSink): CaretSink | null {
    const lines = this.lines;

    const index = findIndex2D(lines, (s) => s === child);
    if (this.isLinesWrapped) {
      const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -1);
      return lines[y1]?.[x1] ?? null;
    } else {
      return lines[index[0]]?.[index[1] - 1] ?? null;
    }
  }
  leftmostSiblingOf(child: CaretSink): CaretSink | null {
    const lines = this.lines;

    const index = findIndex2D(lines, (s) => s === child);
    return lines[index[0]]?.at(0) ?? null;
  }
  rightSiblingOf(child: CaretSink) {
    const lines = this.lines;

    const index = findIndex2D(lines, (s) => s === child);
    if (this.isLinesWrapped) {
      const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +1);
      return lines[y1]?.[x1] ?? null;
    } else {
      return lines[index[0]]?.[index[1] + 1] ?? null;
    }
  }
  rightmostSiblingOf(child: CaretSink): CaretSink | null {
    const lines = this.lines;

    const index = findIndex2D(lines, (s) => s === child);
    return lines[index[0]]?.at(-1) ?? null;
  }
  upSiblingOf(child: CaretSink, carryX?: number): CaretSink | null {
    const lines = this.lines;

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
    const lines = this.lines;

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
        least(this.lines, (line) =>
          dist(rightSinkSide(from), leftSinkSide(line.at(0)!))
        )?.at(0) ?? null
      );
    else return this.lines.at(0)?.at(0) ?? null;
  }
  rightChild(from: Sink): Sink | null {
    if (this.enterBehaviour === "nearest")
      return (
        least(this.lines, (line) =>
          dist(leftSinkSide(from), rightSinkSide(line.at(-1)!))
        )?.at(-1) ?? null
      );
    else return this.lines.at(-1)?.at(-1) ?? null;
  }
  topChild(from: Sink): Sink | null {
    // WARNING: changed something here
    return (
      least(
        this.lines.at(0) ?? [],
        ({ left, right }: CaretSink) =>
          Math.max(from.left, left) - Math.min(from.right, right)
      ) ?? null
    );
  }
  bottomChild(from: Sink): Sink | null {
    return (
      least(
        this.lines.at(-1) ?? [],
        ({ left, right }: CaretSink) =>
          Math.max(from.left, left) - Math.min(from.right, right)
      ) ?? null
    );
  }
}
export class CaretSink extends Sink {}

const topLeftVec2 = ({ x, top }: Sink) => [x, top] as Vec2;
const topRightVec2 = ({ right, top }: Sink) => [right, top] as Vec2;

// approximates the area of the convex quadrilateral between the two vertical intervals
// TODO: use an exact formula like https://www.mathwords.com/a/area_convex_polygon.htm
// TODO: is this even a good sense of distance?
function dist(a: SinkSide, b: SinkSide) {
  const lengths: number[] = [];
  for (let i = 0; i < 1; i += 0.1) {
    const aP = lerp([a.vec2, [a.vec2[0], a.s.bottom]])(i);
    const bP = lerp([b.vec2, [b.vec2[0], b.s.bottom]])(i);
    lengths.push(distance(aP, bP));
  }
  return lengths.reduce((prev, cur) => prev + cur / lengths.length, 0); // average of 10 distance measurements across the intervals
}

type SinkSide = { vec2: Vec2; s: Sink };
const leftSinkSide = (s: Sink) => ({ vec2: topLeftVec2(s), s });
const rightSinkSide = (s: Sink) => ({ vec2: topRightVec2(s), s });
