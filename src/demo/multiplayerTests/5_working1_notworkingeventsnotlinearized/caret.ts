import { randomCssRgb } from "../../../lib/math/Color.js";
import { prev } from "./geom.js"; // TODO: this should be passed in!!!
import { CaretSink, del } from "./state.js";

export type Caret = { at: CaretSink; readonly color: string };
const carets: Set<Caret> = new Set();

export const getCarets = (): ReadonlySet<Caret> => carets;

const newCaret = (at: CaretSink, color = randomCssRgb()) => {
  const newCaret: Caret = { at, color };
  carets.add(newCaret);
  return newCaret;
};
const removeCaret = (caret: Caret) => carets.delete(caret);

export const moveCaret = (caret: Caret, to: CaretSink) => {
  if (!to || to.deleted) return; //throw "moving caret to a deleted caret!";
  caret.at = to;
};

export const delAt = (toDel: CaretSink) => {
  if (!toDel || toDel.deleted) return; //throw "moving caret to a deleted caret!";
  const p = prev(toDel);
  if (!p) throw "!p toDel";
  const ref = del(toDel);
  // move all carets on ref to prev(ref)
  for (const aCaret of carets) if (aCaret.at === toDel) moveCaret(aCaret, p); // may be changed for displacement

  return ref;
};

/**
 *
 */

export type LineCaret = { caret: Caret; anchor: Caret };
const lineCarets: Set<LineCaret> = new Set();

export const getLineCarets = (): ReadonlySet<LineCaret> => lineCarets;
export const newLineCaret = (
  at: CaretSink,
  color1 = randomCssRgb(),
  color2 = randomCssRgb()
) => {
  const caret = newCaret(at, color1);
  const anchor = newCaret(at, color2);
  const lineCaret = { caret, anchor };
  lineCarets.add(lineCaret);
  return lineCaret;
};
