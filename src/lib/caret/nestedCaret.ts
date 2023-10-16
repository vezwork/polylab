import { Bounds, makeCaretFunctions } from "./caretLines.js";
import { makeTreeFunctions } from "../structure/tree.js";
import { makeCaretLineOpFunctions } from "./caretLineOps.js";

export function makeNestedCaretFunctions<CaretHost>({
  getBounds,
  parent,
  children,
  getCarryX,
  setCarryX,
}: {
  parent: (c: CaretHost) => CaretHost | null;
  children: (c: CaretHost) => Iterable<CaretHost>;
  getBounds: (c: CaretHost) => Bounds;
  getCarryX: (c: CaretHost) => number | null;
  setCarryX: (c: CaretHost) => (carryX: number | null) => void;
}) {
  const { lines } = makeCaretFunctions<CaretHost>({
    getBounds,
  });

  const {
    belowInFirstLine,
    aboveInLastLine,
    nextLine,
    prevLine,
    closestInLine,
    after,
    before,
  } = makeCaretLineOpFunctions<CaretHost>({
    getBounds,
  });

  const EdElTree = makeTreeFunctions<CaretHost>({
    parent,
    children,
  });

  const firstSpatialChild = (e: CaretHost) =>
    lines(children(e))?.at(0)?.at(0) ?? null;
  const lastSpatialChild = (e: CaretHost) =>
    lines(children(e))?.at(-1)?.at(-1) ?? null;

  // if `right` returns null, simply focus parent
  // else focus recursive (return value): case parent then `firstSpatialChild(recursive case)`, else base case
  const right = (e: CaretHost) => {
    setCarryX(e)(null);

    const par = parent(e);
    if (par === null) return null;

    return after(e, lines(children(par)));
  };
  // if I don't have children, use `left`
  // - if `left` returns null, call `left` on parent recursively until non null
  //   - if recursive calls are never non null, then dont change focus
  // - else focus `left` return
  // else focus `lastSpatialChild(me)`
  const left = (e: CaretHost) => {
    setCarryX(e)(null);

    const par = parent(e);
    if (par === null) return null;

    return before(e, lines(children(par)));
  };
  // If `up` returns null, call `up` on parent recursively until non null, then focus non null value or `aboveInLastLine(non null value)`
  // - if recursive calls are never non null, then focus first in my line
  // else focus return value or `aboveInLastLine(return value)`
  const up = (e: CaretHost) => {
    setCarryX(e)(getCarryX(e) ?? getBounds(e).right);

    const par = parent(e);
    if (par === null) return null;

    return closestInLine(e, prevLine(e, lines(children(par))), getCarryX(par));
  };

  // If `down` returns null, call `down` on parent recursively until non null, then focus non null value or `belowInFirstLine(non null value)`
  // - if recursive calls are never non null, then focus last in my line
  // else focus return value or `belowInFirstLine(return value)`
  const down = (e: CaretHost) => {
    setCarryX(e)(getCarryX(e) ?? getBounds(e).right);

    const par = parent(e);
    if (par === null) return null;

    return closestInLine(e, nextLine(e, lines(children(par))), getCarryX(par));
  };

  const next = (
    e: CaretHost,
    direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
  ): CaretHost | null => {
    if (direction === "ArrowDown" || direction === "ArrowUp")
      setCarryX(e)(getCarryX(e) ?? getBounds(e).right);

    if (direction === "ArrowLeft" || direction === "ArrowRight")
      setCarryX(e)(null);

    return direction === "ArrowLeft" && EdElTree.hasChildren(e)
      ? lastSpatialChild(e)
      : broadenView(e, direction);
  };

  const broadenView = (
    e: CaretHost,
    direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
  ): CaretHost | null => {
    const par = parent(e);
    if (par === null) return null;

    const chs = children(par);
    const eNext =
      "ArrowUp" === direction
        ? closestInLine(e, prevLine(e, lines(chs)), getCarryX(par))
        : "ArrowRight" === direction
        ? after(e, lines(chs))
        : "ArrowDown" === direction
        ? closestInLine(e, nextLine(e, lines(chs)), getCarryX(par))
        : before(e, lines(chs));

    return eNext
      ? zoomIn(eNext, direction)
      : direction === "ArrowRight"
      ? par
      : broadenView(par, direction);
  };
  const zoomIn = (
    editor: CaretHost | null,
    direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
  ): CaretHost | null => {
    if (editor === null) return null;
    if (EdElTree.isLeaf(editor)) return editor;

    if (direction === "ArrowLeft") return editor;
    else if (direction === "ArrowRight")
      return zoomIn(firstSpatialChild(editor), direction);
    else if (direction === "ArrowDown" || direction === "ArrowUp") {
      const x = getCarryX(editor) ?? 0; // This is guaranteed to be defined in `next` if ArrowDown or ArrowUp was pressed
      const myBound = getBounds(editor);
      const closestIn =
        direction === "ArrowDown"
          ? belowInFirstLine(x, lines(children(editor)))
          : direction === "ArrowUp"
          ? aboveInLastLine(x, lines(children(editor)))
          : null;
      if (
        closestIn &&
        Math.abs(getBounds(closestIn).right - x) <= Math.abs(myBound.right - x)
      )
        return zoomIn(closestIn, direction);
      else return editor;
    }
    return null;
  };

  function* traverseEditors(start: CaretHost, end: CaretHost) {
    const comp = EdElTree.compareOrder(start, end);

    if (comp === "!") return;
    if (comp === ">") {
      let cur: CaretHost | null | undefined = start;
      while (cur) {
        if (cur === end) return;
        cur = next(cur, "ArrowRight");
        yield cur; // don't include start when going to the right
      }
    }
    if (comp === "<") {
      let cur: CaretHost | null | undefined = start;
      while (cur) {
        if (cur === end) return;
        yield cur; // include start when going to the left
        cur = next(cur, "ArrowLeft");
      }
    }
  }

  return {
    next,
    lines,
    traverseEditors,
  };
}
