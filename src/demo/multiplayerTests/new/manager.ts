import { randomCssRgb } from "../../../lib/math/Color.js";
import { prev } from "./geom.js"; // TODO: this should be passed in!!!
import { CaretHost, del, ins, undel } from "./state.js";

/**
 * LOCAL HISTORY
 */

type DoubleLinkedListNode<T> = {
  next: DoubleLinkedListNode<T> | null;
  readonly prev: DoubleLinkedListNode<T> | null;
  readonly data: T;
};

type Op = { function: Function; args: any[] };
type Δ = {
  redo: Op;
  undo: Op;
};

let historyHead: DoubleLinkedListNode<Δ> = {
  next: null,
  prev: null,
  data: {
    redo: { function: () => undefined, args: [] },
    undo: { function: () => undefined, args: [] },
  },
};

const insertAfter =
  <T>(after: DoubleLinkedListNode<T>) =>
  (data: T) => {
    const newNode = {
      next: null,
      prev: after,
      data,
    };
    if (after) after.next = newNode;
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

/**
 * CARET STATE GLUE
 */

export type Caret = { at: CaretHost; readonly color: string };
let carets: Set<Caret> = new Set();

export const getCarets = (): ReadonlySet<Caret> => carets;

export const newCaret = (at: CaretHost) => {
  const newCaret: Caret = { at, color: randomCssRgb() };
  carets.add(newCaret);
  return newCaret;
};
export const removeCaret = (caret: Caret) => carets.delete(caret);

export const moveCaret = (caret: Caret) => (to: CaretHost) => {
  if (to.deleted) throw "moving caret to a deleted caret!";
  caret.at = to;
};

const insAtCaret = (caret: Caret) => (char: string) => {
  const ref = ins(char)(caret.at);

  moveCaret(caret)(ref);

  return ref;
};

const delAt = (toDel: CaretHost) => {
  const p = prev(toDel);
  if (!p) throw "!p toDel";
  const ref = del(toDel);
  // move all carets on ref to prev(ref)
  for (const aCaret of carets) if (aCaret.at === toDel) moveCaret(aCaret)(p); // TODO: take this into account in undo/redo?

  return ref;
};

const delAtWithCaret = (toDel: CaretHost, caret: Caret) => {
  const p = prev(toDel);
  if (!p) throw "!p delAtWithCaret";
  const ref = del(toDel);
  // move all carets on ref to prev(ref)
  for (const aCaret of carets) if (aCaret.at === toDel) moveCaret(aCaret)(p); // TODO: take this into account in undo/redo?
  moveCaret(caret)(p);

  return ref;
};

const delAtCaret = (caret: Caret) => {
  const toDel = caret.at;
  return delAt(toDel);
};

const undelWithCaret = (unDel: CaretHost, caret: Caret) => {
  const ref = undel(unDel);

  moveCaret(caret)(ref);

  return ref;
};

/**
 * HISTORY ENABLED CARET STUFF
 */

export const caretIns = (caret: Caret) => (char: string) => {
  const inserted = insAtCaret(caret)(char);
  historyHead = insertAfter(historyHead)({
    undo: { function: delAtWithCaret, args: [inserted, caret] },
    redo: { function: undelWithCaret, args: [inserted, caret] },
  });
  return inserted;
};

export const caretDel = (caret: Caret) => {
  const deleted = delAtCaret(caret);
  historyHead = insertAfter(historyHead)({
    undo: { function: undelWithCaret, args: [deleted, caret] },
    redo: { function: delAtWithCaret, args: [deleted, caret] },
  });
  return;
};

// undo, redo chain
// ins -> del -> undel -> del -> ...
