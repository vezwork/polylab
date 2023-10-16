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

  return {
    lines,
  };
}
