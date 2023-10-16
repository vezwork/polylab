import { randomCssRgb } from "../../../lib/math/Color.js";
import { prev } from "./geom.js"; // TODO: this should be passed in!!!
import { del, ins, undel } from "./state.js";
let historyHead = {
    next: null,
    prev: null,
    data: {
        redo: { function: () => undefined, args: [] },
        undo: { function: () => undefined, args: [] },
    },
};
const insertAfter = (after) => (data) => {
    const newNode = {
        next: null,
        prev: after,
        data,
    };
    if (after)
        after.next = newNode;
    return newNode;
};
export const redo = () => {
    if (historyHead.next) {
        const re = historyHead.next.data.redo;
        console.log("redo", re);
        re.function(...re.args);
        historyHead = historyHead.next;
    }
};
export const undo = () => {
    if (historyHead.prev) {
        const un = historyHead.data.undo;
        console.log("undo", un);
        un.function(...un.args);
        historyHead = historyHead.prev;
    }
};
let carets = new Set();
export const getCarets = () => carets;
export const newCaret = (at) => {
    const newCaret = { at, color: randomCssRgb() };
    carets.add(newCaret);
    return newCaret;
};
export const removeCaret = (caret) => carets.delete(caret);
export const moveCaret = (caret) => (to) => {
    if (to.deleted)
        throw "moving caret to a deleted caret!";
    caret.at = to;
};
const insAtCaret = (caret) => (char) => {
    const ref = ins(char)(caret.at);
    moveCaret(caret)(ref);
    return ref;
};
const delAt = (toDel) => {
    const p = prev(toDel);
    if (!p)
        throw "!p toDel";
    const ref = del(toDel);
    // move all carets on ref to prev(ref)
    for (const aCaret of carets)
        if (aCaret.at === toDel)
            moveCaret(aCaret)(p); // TODO: take this into account in undo/redo?
    return ref;
};
const delAtWithCaret = (toDel, caret) => {
    const p = prev(toDel);
    if (!p)
        throw "!p delAtWithCaret";
    const ref = del(toDel);
    // move all carets on ref to prev(ref)
    for (const aCaret of carets)
        if (aCaret.at === toDel)
            moveCaret(aCaret)(p); // TODO: take this into account in undo/redo?
    moveCaret(caret)(p);
    return ref;
};
const delAtCaret = (caret) => {
    const toDel = caret.at;
    return delAt(toDel);
};
const undelWithCaret = (unDel, caret) => {
    const ref = undel(unDel);
    moveCaret(caret)(ref);
    return ref;
};
/**
 * HISTORY ENABLED CARET STUFF
 */
export const caretIns = (caret) => (char) => {
    const inserted = insAtCaret(caret)(char);
    historyHead = insertAfter(historyHead)({
        undo: { function: delAtWithCaret, args: [inserted, caret] },
        redo: { function: undelWithCaret, args: [inserted, caret] },
    });
    return inserted;
};
export const caretDel = (caret) => {
    const deleted = delAtCaret(caret);
    historyHead = insertAfter(historyHead)({
        undo: { function: undelWithCaret, args: [deleted, caret] },
        redo: { function: delAtWithCaret, args: [deleted, caret] },
    });
    return;
};
// undo, redo chain
// ins -> del -> undel -> del -> ...
