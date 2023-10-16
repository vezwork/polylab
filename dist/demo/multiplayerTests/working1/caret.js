import { randomCssRgb } from "../../../lib/math/Color.js";
import { prev } from "./geom.js"; // TODO: this should be passed in!!!
import { del } from "./state.js";
const carets = new Set();
export const getCarets = () => carets;
const newCaret = (at, color = randomCssRgb()) => {
    const newCaret = { at, color };
    carets.add(newCaret);
    return newCaret;
};
const removeCaret = (caret) => carets.delete(caret);
export const moveCaret = (caret, to) => {
    if (!to || to.deleted)
        return; //throw "moving caret to a deleted caret!";
    caret.at = to;
};
export const delAt = (toDel) => {
    if (!toDel || toDel.deleted)
        return; //throw "moving caret to a deleted caret!";
    const p = prev(toDel);
    if (!p)
        throw "!p toDel";
    const ref = del(toDel);
    // move all carets on ref to prev(ref)
    for (const aCaret of carets)
        if (aCaret.at === toDel)
            moveCaret(aCaret, p); // may be changed for displacement
    return ref;
};
const lineCarets = new Set();
export const getLineCarets = () => lineCarets;
export const newLineCaret = (at, color1 = randomCssRgb(), color2 = randomCssRgb()) => {
    const caret = newCaret(at, color1);
    const anchor = newCaret(at, color2);
    const lineCaret = { caret, anchor };
    lineCarets.add(lineCaret);
    return lineCaret;
};
