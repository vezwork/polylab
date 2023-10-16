import {
  findIndex2D,
  worst,
  wrapLinesAddXIndex2D,
} from "../structure/Arrays.js";
import { lerp, segXProj } from "../math/Line2.js";
import { make2DLineFunctions } from "../math/LineT.js";
import { distance } from "../math/Vec2.js";
import * as Iter from "../structure/Iterable.js";

export type YInterval<CaretHost> = {
  n: number;
  interval: [number, number];
  data?: CaretHost;
};

export type Bounds = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export function makeCaretFunctions<CaretHost>({
  getBounds,
}: {
  getBounds: (c: CaretHost) => Bounds;
}) {
  const to = (
    children: Iterable<CaretHost>,
    child: CaretHost,
    direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
    carryX: number | null,
    isRoot: boolean = false
  ) => {
    if ("ArrowUp" === direction)
      return childAbove(children, carryX, isRoot)(child);
    if ("ArrowRight" === direction) return childAfter(children)(child);
    if ("ArrowDown" === direction)
      return childBelow(children, carryX, isRoot)(child);
    if ("ArrowLeft" === direction) return childBefore(children)(child);
    return null;
  };

  const childAbove =
    (
      children: Iterable<CaretHost>,
      carryX: number | null,
      isRoot: boolean = false
    ) =>
    (childEditor: CaretHost): CaretHost | null =>
      above(childEditor, children, isRoot, carryX);
  const childBelow =
    (
      children: Iterable<CaretHost>,
      carryX: number | null,
      isRoot: boolean = false
    ) =>
    (childEditor: CaretHost): CaretHost | null =>
      below(childEditor, children, isRoot, carryX);
  const childAfter =
    (children: Iterable<CaretHost>) =>
    (childEditor: CaretHost): CaretHost | null =>
      after(childEditor, children);
  const childBefore =
    (children: Iterable<CaretHost>) =>
    (childEditor: CaretHost): CaretHost | null =>
      before(childEditor, children);

  const top = ({
    n,
    interval: [top, _],
  }: YInterval<CaretHost>): [number, number] => [n, top]; // assuming interval[0] is top, which is not enforced
  const yIntervalFromTop = ([n, top]: [
    number,
    number
  ]): YInterval<CaretHost> => ({
    n,
    interval: [top, top],
  });

  function after(box: CaretHost, boxes: Iterable<CaretHost>): CaretHost | null {
    const ls = lines(boxes);
    const index = findIndex2D(ls, (p) => p === box);
    const [y1, x1] = wrapLinesAddXIndex2D(ls, index, +1);
    return ls[y1]?.[x1] ?? null;
  }

  function below(
    box: CaretHost,
    boxes: Iterable<CaretHost>,
    isRoot: boolean,
    carryX: number | null
  ): CaretHost | null {
    const ls = lines(boxes);
    const [y, x] = findIndex2D(ls, (p) => p === box);
    const nextLine = ls[y + 1] ?? [];
    const closestInNextLine = worst(nextLine, (data) =>
      carryX ? numXDist(carryX, data!) : xDist(box, data!)
    );
    if (closestInNextLine) {
      return closestInNextLine ?? null;
    } else if (isRoot) {
      return ls[y].at(-1) ?? null;
    } else return null;
  }

  function before(
    box: CaretHost,
    boxes: Iterable<CaretHost>
  ): CaretHost | null {
    const ls = lines(boxes);
    const index = findIndex2D(ls, (p) => p === box);
    const [y1, x1] = wrapLinesAddXIndex2D(ls, index, -1);
    return ls[y1]?.[x1] ?? null;
  }

  function above(
    box: CaretHost,
    boxes: Iterable<CaretHost>,
    isRoot: boolean,
    carryX: number | null
  ): CaretHost | null {
    const ls = lines(boxes);
    const [y, x] = findIndex2D(ls, (p) => p === box);
    const prevLine = ls[y - 1] ?? [];
    const closestInPrevLine = worst(prevLine, (data) =>
      carryX ? numXDist(carryX, data!) : xDist(box, data!)
    );
    if (closestInPrevLine) {
      return closestInPrevLine ?? null;
    } else if (isRoot) {
      return ls[y].at(0) ?? null;
    } else return null;
  }
  function belowInFirstLine(
    x: number,
    boxes: Iterable<CaretHost>
  ): CaretHost | null {
    const ls = lines(boxes);
    const firstLine = ls.at(0) ?? [];
    const closestInFirstLine = worst(firstLine, (data) => numXDist(x, data!));

    return closestInFirstLine ?? null;
  }
  function aboveInLastLine(
    x: number,
    boxes: Iterable<CaretHost>
  ): CaretHost | null {
    const ls = lines(boxes);
    const lastLine = ls.at(-1) ?? [];
    const closestInLastLine = worst(lastLine, (data) => numXDist(x, data!));

    return closestInLastLine ?? null;
  }

  const { mergeAndSort } = make2DLineFunctions<YInterval<CaretHost>>({
    dist,
    // wish these could be editors/polygons that get deconstructed, projected, then reconstructed somehow
    xProj:
      ([p1, p2]) =>
      (p) =>
        yIntervalFromTop(segXProj([top(p1), top(p2)])(top(p))),
    isPointLeft: (p1) => (p2) => p1.n < p2.n,
    isPointBelow: (p1) => (p2) => top(p1)[1] > top(p2)[1],
  });

  function leftAndRightYIntervalsFromEditorElement(
    el: CaretHost
  ): [YInterval<CaretHost>, YInterval<CaretHost>] {
    const r = getBounds(el);
    const yInterval = {
      interval: [r.top, r.bottom] as [number, number],
      data: el,
    };
    return [
      { ...yInterval, n: r.left },
      { ...yInterval, n: r.right },
    ];
  }

  function lines(els: Iterable<CaretHost>): CaretHost[][] {
    const done = new Set<CaretHost | undefined>([undefined]);
    return yIntervalLines(els).map((line) =>
      (
        line.filter(({ data }) => {
          if (done.has(data)) return false;

          done.add(data);
          return true;
        }) as {
          n: number;
          interval: [number, number];
          data: CaretHost;
        }[]
      ).map(({ data }) => data)
    );
  }

  function yIntervalLines(els: Iterable<CaretHost>): YInterval<CaretHost>[][] {
    const caretSinks = Iter.map(els, leftAndRightYIntervalsFromEditorElement);

    return mergeAndSort(caretSinks);
  }

  function dist(a: YInterval<CaretHost>, b: YInterval<CaretHost>) {
    const lengths: number[] = [];
    for (let i = 0; i < 1; i += 0.1) {
      const aP = lerp([
        [a.n, a.interval[0]],
        [a.n, a.interval[1]],
      ])(i);
      const bP = lerp([
        [b.n, b.interval[0]],
        [b.n, b.interval[1]],
      ])(i);
      lengths.push(distance(aP, bP));
    }
    return lengths.reduce((prev, cur) => prev + cur / lengths.length, 0); // average of 10 distance measurements across the intervals
    //   const i = seperatingInterval(a.interval, b.interval);
    //   if (i === null) return Math.sqrt((a.n - b.n) ** 2); // intervals overlap so just get 1D distance
    //   return xBiasedDist([a.n, i[0]], [b.n, i[1]]);
  }
  // Why is there dist and xDist?? Shouldn't there just be one? Or one defined in terms of the other?

  function numXDist(n: number, el: CaretHost): number {
    const a = getBounds(el);
    if (n > a.left && n < a.right) return 0;
    if (n >= a.right) return n - a.right;
    if (n <= a.left) return a.left - n;
    return 0;
  }

  function xDist(el1: CaretHost, el2: CaretHost): number {
    const a = getBounds(el1);
    const b = getBounds(el2);
    if (a.left > b.left && a.right < b.right) return 0;
    if (b.left > a.left && b.right < a.right) return 0;
    if (a.left > b.right) return a.left - b.right;
    if (b.left < a.right) return b.left - a.right;
    return 0;
  }
  return {
    lines,
    to,
    childAbove,
    childAfter,
    childBefore,
    childBelow,
    belowInFirstLine,
    aboveInLastLine,
  };
}
