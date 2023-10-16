import { find, map } from "../../../lib/structure/Iterable.js";
import { delAt, getCarets, getLineCarets, moveCaret, newLineCaret, } from "./caret.js";
import { getState, ins, loadFromChars, undel } from "./state.js";
import { WSChannel } from "./ws.js";
const serCaret = (caret) => caret.color;
const deserCaret = (color) => find(getCarets(), (c) => c.color === color);
const serCaretSink = (cs) => getState().indexOf(cs);
const deserCaretSink = (i) => getState()[i];
export const ws = new WSChannel();
ws.addEventListener("ins", (e) => {
    const [sat, char] = e.detail;
    ins(char)(deserCaretSink(sat));
});
ws.addEventListener("move", (e) => {
    const [sar, sto, sfrom] = e.detail;
    moveCaret(deserCaret(sar), deserCaretSink(sto));
});
ws.addEventListener("del", (e) => {
    const [sat] = e.detail;
    delAt(deserCaretSink(sat));
});
ws.addEventListener("lineCaret", (e) => {
    const [sat, color1, color2] = e.detail;
    console.log("lineCaret");
    newLineCaret(deserCaretSink(sat), color1, color2);
});
ws.addEventListener("requestState", () => {
    ws.send("state", {
        serLineCarets: [
            ...map(getLineCarets(), (lc) => [
                serCaretSink(lc.caret.at),
                serCaretSink(lc.anchor.at),
                lc.caret.color,
                lc.anchor.color,
            ]),
        ],
        serCaretSinks: getState().map(({ char }) => char),
    });
});
ws.addEventListener("state", (e) => {
    const { serLineCarets, serCaretSinks } = e.detail;
    loadFromChars(serCaretSinks);
    serLineCarets.map(([serCaretS, serAnchorS, caretColor, anchorColor]) => {
        const lc = newLineCaret(deserCaretSink(serCaretS), caretColor, anchorColor);
        moveCaret(lc.anchor, deserCaretSink(serAnchorS));
    });
});
export const apiRequestState = () => {
    ws.send("requestState", undefined);
};
export const apiIns = (at, char) => {
    ws.send("ins", [serCaretSink(at), char]);
    const inserted = ins(char)(at);
    return {
        inserted,
        delta: {
            undo: { f: apiDel, args: [inserted] },
            redo: { f: apiUndel, args: [inserted] },
        },
    };
};
export const apiMoveCaret = (caret, to, from = caret.at) => {
    ws.send("move", [serCaret(caret), serCaretSink(to), serCaretSink(from)]);
    moveCaret(caret, to);
    return {
        undo: { f: apiMoveCaret, args: [caret, from] },
        redo: { f: apiMoveCaret, args: [caret, to] },
    };
};
export const apiDel = (at) => {
    ws.send("del", [serCaretSink(at)]);
    const deleted = delAt(at);
    return {
        undo: { f: apiUndel, args: [deleted] },
        redo: { f: apiDel, args: [deleted] },
    };
};
const apiUndel = (ref) => {
    undel(ref);
    ws.send("ins", [serCaretSink(ref) - 1, ref.char]);
    return ref;
};
export const apiNewLineCaret = (at) => {
    const lc = newLineCaret(at);
    ws.send("lineCaret", [serCaretSink(at), lc.caret.color, lc.anchor.color]);
    return lc;
};
export const apiCarets = () => getCarets();
export const apiState = () => getState();
