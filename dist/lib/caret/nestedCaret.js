import { makeCaretFunctions } from "./caret.js";
import { makeTreeFunctions } from "../structure/tree.js";
export function makeNestedCaretFunctions({ getBounds, parent, children, getCarryX, setCarryX, }) {
    const { lines, belowInFirstLine, aboveInLastLine, to } = makeCaretFunctions({
        getBounds,
    });
    const EdElTree = makeTreeFunctions({
        parent,
        children,
    });
    const firstSpatialChild = (e) => lines(children(e))?.at(0)?.at(0) ?? null;
    const lastSpatialChild = (e) => lines(children(e))?.at(-1)?.at(-1) ?? null;
    const toChild = (parent, child, direction) => to(children(parent), child, direction, getCarryX(parent), EdElTree.isRoot(parent));
    const next = (e, direction) => {
        if (direction === "ArrowDown" || direction === "ArrowUp")
            setCarryX(e)(getCarryX(e) ?? getBounds(e).right);
        if (direction === "ArrowLeft" || direction === "ArrowRight")
            setCarryX(e)(null);
        return direction === "ArrowLeft" && EdElTree.hasChildren(e)
            ? lastSpatialChild(e)
            : broadenView(e, direction);
    };
    const broadenView = (e, direction) => {
        const par = parent(e);
        if (par === null)
            return null;
        let eNext = toChild(par, e, direction);
        return eNext
            ? zoomIn(eNext, direction)
            : direction === "ArrowRight"
                ? par
                : broadenView(par, direction);
    };
    const zoomIn = (editor, direction) => {
        if (editor === null)
            return null;
        if (EdElTree.isLeaf(editor))
            return editor;
        if (direction === "ArrowLeft")
            return editor;
        else if (direction === "ArrowRight")
            return zoomIn(firstSpatialChild(editor), direction);
        else if (direction === "ArrowDown" || direction === "ArrowUp") {
            const x = getCarryX(editor) ?? 0; // This is guaranteed to be defined in `next` if ArrowDown or ArrowUp was pressed
            const myBound = getBounds(editor);
            const closestIn = direction === "ArrowDown"
                ? belowInFirstLine(x, children(editor))
                : direction === "ArrowUp"
                    ? aboveInLastLine(x, children(editor))
                    : null;
            if (closestIn &&
                Math.abs(getBounds(closestIn).right - x) <= Math.abs(myBound.right - x))
                return zoomIn(closestIn, direction);
            else
                return editor;
        }
        return null;
    };
    function* traverseEditors(start, end) {
        const comp = EdElTree.compareOrder(start, end);
        if (comp === "!")
            return;
        if (comp === ">") {
            let cur = start;
            while (cur) {
                yield cur; // don't include start when going to the right
                if (cur === end)
                    return;
                cur = next(cur, "ArrowRight");
            }
        }
        if (comp === "<") {
            let cur = start;
            while (cur) {
                if (cur === end)
                    return;
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
