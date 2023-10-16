import { makeCaretFunctions } from "../../../lib/caret/caret.js";
import { CaretSink, getState } from "./state.js";

const LEFT = 10;
const TOP = 10;
const MARGIN = 10;
const SIZE = 30;
export const getBounds = (c: CaretSink) => {
  const hosts = getState();
  const offset = hosts
    .slice(0, hosts.indexOf(c))
    .reduce((prev, cur) => prev + MARGIN + SIZE, LEFT);
  return {
    top: TOP,
    left: offset,
    right: offset + SIZE,
    bottom: TOP + SIZE,
  };
};
export const closestTo = (x: number) =>
  getState()
    .map((host) => ({ host, bounds: getBounds(host) }))
    .sort(
      (h1, h2) => Math.abs(x - h1.bounds.right) - Math.abs(x - h2.bounds.right)
    )[0].host;

export const { to, lines } = makeCaretFunctions<CaretSink>({
  getBounds,
});

export function order(a: CaretSink, b: CaretSink) {
  const linear = lines(getState()).flat();
  const aIndex = linear.indexOf(a);
  const bIndex = linear.indexOf(b);
  return aIndex <= bIndex ? [a, b] : [b, a];
}

export function* thru(a: CaretSink, b: CaretSink) {
  const linear = lines(getState()).flat();
  const aIndex = linear.indexOf(a);
  const bIndex = linear.indexOf(b);
  const [startI, endI] = aIndex <= bIndex ? [aIndex, bIndex] : [bIndex, aIndex];
  for (let i = startI + 1; i <= endI; i++) yield linear[i];
}

export const prev = (c: CaretSink) =>
  to(getState(), c, "ArrowLeft", null, true);
