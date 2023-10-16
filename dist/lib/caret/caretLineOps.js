import { findIndex2D, worst, wrapLinesAddXIndex2D, } from "../structure/Arrays.js";
export function makeCaretLineOpFunctions({ getBounds, }) {
    function after(box, lines) {
        const index = findIndex2D(lines, (p) => p === box);
        const [y1, x1] = wrapLinesAddXIndex2D(lines, index, +1);
        return lines[y1]?.[x1] ?? null;
    }
    function before(box, lines) {
        const index = findIndex2D(lines, (p) => p === box);
        const [y1, x1] = wrapLinesAddXIndex2D(lines, index, -1);
        return lines[y1]?.[x1] ?? null;
    }
    const curLine = (box, lines) => lines[findIndex2D(lines, (p) => p === box)[0]] ?? [];
    const nextLine = (box, lines) => lines[findIndex2D(lines, (p) => p === box)[0] + 1] ?? [];
    const prevLine = (box, lines) => lines[findIndex2D(lines, (p) => p === box)[0] - 1] ?? [];
    const closestInLine = (box, line, carryX) => worst(line, (data) => carryX ? numXDist(carryX, data) : xDist(box, data));
    function belowInFirstLine(x, lines) {
        const firstLine = lines.at(0) ?? [];
        const closestInFirstLine = worst(firstLine, (data) => numXDist(x, data));
        return closestInFirstLine ?? null;
    }
    function aboveInLastLine(x, lines) {
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
        nextLine,
        prevLine,
        curLine,
        closestInLine,
        after,
        before,
        belowInFirstLine,
        aboveInLastLine,
    };
}
