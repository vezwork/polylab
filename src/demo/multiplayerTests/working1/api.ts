import { find, map } from "../../../lib/structure/Iterable.js";
import {
  Caret,
  delAt,
  getCarets,
  getLineCarets,
  moveCaret,
  newLineCaret,
} from "./caret.js";
import { CaretSink, getState, ins, loadFromChars, undel } from "./state.js";
import { WSChannel } from "./ws.js";

const serCaret = (caret: Caret) => caret.color;
const deserCaret = (color: string) =>
  find(getCarets(), (c) => c.color === color)!;
const serCaretSink = (cs: CaretSink) => getState().indexOf(cs);
const deserCaretSink = (i: number) => getState()[i]!;

export const ws = new WSChannel();
ws.addEventListener("ins", (e: Event) => {
  const [sat, char] = (e as CustomEvent).detail;
  ins(char)(deserCaretSink(sat));
});
ws.addEventListener("move", (e: Event) => {
  const [sar, sto, sfrom] = (e as CustomEvent).detail;
  moveCaret(deserCaret(sar), deserCaretSink(sto));
});
ws.addEventListener("del", (e: Event) => {
  const [sat] = (e as CustomEvent).detail;
  delAt(deserCaretSink(sat));
});
ws.addEventListener("lineCaret", (e: Event) => {
  const [sat, color1, color2] = (e as CustomEvent).detail;
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
  const { serLineCarets, serCaretSinks } = (e as CustomEvent).detail;
  loadFromChars(serCaretSinks);
  serLineCarets.map(([serCaretS, serAnchorS, caretColor, anchorColor]) => {
    const lc = newLineCaret(deserCaretSink(serCaretS), caretColor, anchorColor);
    moveCaret(lc.anchor, deserCaretSink(serAnchorS));
  });
});

export const apiRequestState = () => {
  ws.send("requestState", undefined);
};

export const apiIns = (at: CaretSink, char: string) => {
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
export const apiMoveCaret = (
  caret: Caret,
  to: CaretSink,
  from: CaretSink = caret.at
) => {
  ws.send("move", [serCaret(caret), serCaretSink(to), serCaretSink(from)]);
  moveCaret(caret, to);
  return {
    undo: { f: apiMoveCaret, args: [caret, from] },
    redo: { f: apiMoveCaret, args: [caret, to] },
  };
};
export const apiDel = (at: CaretSink) => {
  ws.send("del", [serCaretSink(at)]);
  const deleted = delAt(at);
  return {
    undo: { f: apiUndel, args: [deleted] },
    redo: { f: apiDel, args: [deleted] },
  };
};
const apiUndel = (ref: CaretSink) => {
  undel(ref);
  ws.send("ins", [serCaretSink(ref) - 1, ref.char]);
  return ref;
};

export const apiNewLineCaret = (at: CaretSink) => {
  const lc = newLineCaret(at);
  ws.send("lineCaret", [serCaretSink(at), lc.caret.color, lc.anchor.color]);
  return lc;
};

export const apiCarets = (): ReadonlySet<Caret> => getCarets();

export const apiState = () => getState();
