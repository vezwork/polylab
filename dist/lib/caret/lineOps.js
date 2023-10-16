import { findIndex2D, worst, wrapLinesAddXIndex2D, } from "../structure/Arrays.js";
export function makeLineOpFunctions({ getBounds, lines, }) {
    function after(box, boxes) {
        const index = findIndex2D(lines, (p) => p === box);
        const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +1);
        return lines[y1]?.[x1] ?? null;
    }
    function below(box, boxes, isRoot, carryX) {
        const [y, x] = findIndex2D(lines, (p) => p === box);
        const nextLine = lines[y + 1] ?? [];
        const closestInNextLine = worst(nextLine, (data) => carryX ? numXDist(carryX, data) : xDist(box, data));
        if (closestInNextLine) {
            return closestInNextLine ?? null;
        }
        else if (isRoot) {
            return lines[y].at(-1) ?? null;
        }
        else
            return null;
    }
    function before(box, boxes) {
        const index = findIndex2D(lines, (p) => p === box);
        const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -1);
        return lines[y1]?.[x1] ?? null;
    }
    function above(box, boxes, isRoot, carryX) {
        const [y, x] = findIndex2D(lines, (p) => p === box);
        const prevLine = lines[y - 1] ?? [];
        const closestInPrevLine = worst(prevLine, (data) => carryX ? numXDist(carryX, data) : xDist(box, data));
        if (closestInPrevLine) {
            return closestInPrevLine ?? null;
        }
        else if (isRoot) {
            return lines[y].at(0) ?? null;
        }
        else
            return null;
    }
    function belowInFirstLine(x, boxes) {
        const firstLine = lines.at(0) ?? [];
        const closestInFirstLine = worst(firstLine, (data) => numXDist(x, data));
        return closestInFirstLine ?? null;
    }
    function aboveInLastLine(x, boxes) {
        const lastLine = lines.at(-1) ?? [];
        const closestInLastLine = worst(lastLine, (data) => numXDist(x, data));
        return closestInLastLine ?? null;
    }
    // Why is there dist and xDist?? Shouldn't there just be one? Or one defined in terms of the other?
    function numXDist(n, el) {
        const a = getBounds(el);
        if (n > a.left && n < a.right)
            return 0;
        if (n >= a.right)
            return n - a.right;
        if (n <= a.left)
            return a.left - n;
        return 0;
    }
    function xDist(el1, el2) {
        const a = getBounds(el1);
        const b = getBounds(el2);
        if (a.left > b.left && a.right < b.right)
            return 0;
        if (b.left > a.left && b.right < a.right)
            return 0;
        if (a.left > b.right)
            return a.left - b.right;
        if (b.left < a.right)
            return b.left - a.right;
        return 0;
    }
    return {
        above,
        below,
        after,
        before,
        belowInFirstLine,
        aboveInLastLine,
    };
}
