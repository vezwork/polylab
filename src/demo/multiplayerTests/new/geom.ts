import { makeCaretFunctions } from "../../../lib/caret/caret.js";
import { CaretHost, getHosts } from "./state.js";

const LEFT = 20;
const TOP = 20;
const MARGIN = 20;
const SIZE = 50;
export const getBounds = (c: CaretHost) => {
  const hosts = getHosts();
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
  getHosts()
    .map((host) => ({ host, bounds: getBounds(host) }))
    .sort(
      (h1, h2) => Math.abs(x - h1.bounds.right) - Math.abs(x - h2.bounds.right)
    )[0].host;

export const { to, lines } = makeCaretFunctions<CaretHost>({
  getBounds,
});

export function* thru(a: CaretHost, b: CaretHost) {
  const linear = lines(getHosts()).flat();
  const aIndex = linear.indexOf(a);
  const bIndex = linear.indexOf(b);
  const [startI, endI] = aIndex <= bIndex ? [aIndex, bIndex] : [bIndex, aIndex];
  for (let i = startI + 1; i <= endI; i++) yield linear[i];
}

export const prev = (c: CaretHost) =>
  to(getHosts(), c, "ArrowLeft", null, true);
