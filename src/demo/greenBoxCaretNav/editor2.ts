import { makeCaretLineOpFunctions } from "../../lib/caret/caretLineOps.js";
import { makeCaretFunctions } from "../../lib/caret/caretLines.js";
import { closestElementToPosition } from "../../lib/dom/closestElement.js";
import * as Iter from "../../lib/structure/Iterable.js";
import { makeTreeFunctions } from "../../lib/structure/tree.js";

// Doesn't support selection yet. Traversal would have to be added to makeCaretFunctions

// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element: HTMLElement) => {
  const { top, right, bottom, left, width, height, x, y } =
    element.getBoundingClientRect();
  return { top, right, bottom, left, width, height, x, y };
};

const getBounds = getBoundingClientRect;
export let carryX: number | null = null;

export const { lines } = makeCaretFunctions<EditorElement>({
  getBounds,
});

export const {
  belowInFirstLine,
  aboveInLastLine,
  nextLine,
  curLine,
  prevLine,
  closestInLine,
  after,
  before,
} = makeCaretLineOpFunctions<EditorElement>({
  getBounds,
});

const closestChildToPosition = (e: EditorElement) => (p: [number, number]) =>
  closestElementToPosition(e, e.editorChildren(), p);
export const firstSpatialChild = (e: EditorElement) =>
  lines(e.editorChildren())?.at(0)?.at(0) ?? null;
export const lastSpatialChild = (e: EditorElement) =>
  lines(e.editorChildren())?.at(-1)?.at(-1) ?? null;

// This will be a caret service which manages multicursors and selection and stuff
let CARET: EditorElement | null = null;
export const focus = (el: EditorElement | null) => {
  if (el === null) return null;
  CARET?.setAttribute("isFocused", "false");
  CARET = el;
  el.setAttribute("isFocused", "true");
  el.focus();
  return el;
};

export const parent = (e: EditorElement) => e.editorParent();
export const children = (e: EditorElement) => e.editorChildren();

export const onRightFocusSelf = (e: EditorElement) => () => focus(e);
export const onRightFocusFirstChild = (e: EditorElement) => () =>
  [...children(e)].length > 0
    ? firstSpatialChild(e)!.focusFromRight()
    : focus(e);

export const onLeftFocusSelf = (e: EditorElement) => () => focus(e);
export const onLeftFocusLastChild = (e: EditorElement) => () =>
  [...children(e)].length > 0 ? lastSpatialChild(e)!.focusFromLeft() : focus(e);

export const lastChildOrLeftOrParentLeft =
  (par: EditorElement) => (e: EditorElement) =>
    [...children(e)].length > 0
      ? focus(lastSpatialChild(e)!)
      : leftOrParentLeft(par)(e);

export const lastChildOrLeftOrParent =
  (par: EditorElement) => (e: EditorElement) =>
    [...children(e)].length > 0
      ? focus(lastSpatialChild(e)!)
      : leftOrParent(par)(e);

export const leftOrParentLeft = (par: EditorElement) => (e: EditorElement) => {
  carryX = null;
  const be = before(e, lines(children(par)));
  if (be === null) {
    const grandparent = parent(par);
    return grandparent !== null ? leftOrParentLeft(grandparent)(par) : null; // different than right to sibling
  } else return be.focusFromLeft();
};
export const leftOrParent = (par: EditorElement) => (e: EditorElement) => {
  const be = before(e, lines(children(par)));
  if (be === null) {
    focus(par); // different than right to sibling
  } else return be.focusFromLeft();
};

export const firstChildOrRightOrParent =
  (par: EditorElement) => (e: EditorElement) =>
    [...children(e)].length > 0
      ? focus(firstSpatialChild(e)!)
      : rightOrParent(par)(e);
export const firstChildOrRightOrParentRight = (e: EditorElement) =>
  [...children(e)].length > 0
    ? focus(firstSpatialChild(e)!)
    : rightOrParentRight(e);

const rightOrParent = (e: EditorElement) => {
  const par = e.editorParent();
  if (!par) throw "no parent rightOrParent";
  carryX = null;
  const af = after(e, lines(children(par)));
  if (af === null)
    return focus(par); // `this.right()` to skip highlighting parent
  else return af.focusFromRight();
};
export const rightOrParentRight =
  (par: EditorElement) => (e: EditorElement) => {
    const af = after(e, lines(children(par)));
    if (af === null) {
      const grandparent = parent(par);
      return grandparent !== null ? rightOrParentRight(grandparent)(par) : null; // different than right to sibling
    } else return af.focusFromRight();
  };

const up = (child: EditorElement) => {
  const par = child.editorParent();
  if (!par) throw "no parent up";
  carryX ??= getBounds(child).right;
  const siblingUp = closestInLine(
    child,
    prevLine(child, lines(children(par))),
    carryX
  );
  if (siblingUp !== null) return siblingUp.focusFromUp();

  const grandparent = parent(par);
  if (grandparent === null) return focusFirstInLine(par)(child);
  const parFocus = up(par);
  if (parFocus) return parFocus;
  else return focusFirstInLine(par)(child);
};
const down = (child: EditorElement) => {
  const par = child.editorParent();
  if (!par) throw "no parent up";
  carryX ??= getBounds(child).right;
  const siblingUp = closestInLine(
    child,
    nextLine(child, lines(children(par))),
    carryX
  );
  if (siblingUp !== null) return siblingUp.focusFromDown();

  const grandparent = parent(par);
  if (grandparent === null) return focusLastInLine(par)(child);
  const parFocus = down(par);
  if (parFocus) return parFocus;
  else return focusLastInLine(par)(child);
};

const focusFirstInLine = (par: EditorElement) => (child: EditorElement) => {
  // for focusing the first in a line once it is found that there is nothing above in any parent
  const cand = curLine(child, lines(children(par))).at(0);
  if (cand && cand !== child) return focus(cand);
  else return null;
};

const focusLastInLine = (par: EditorElement) => (child: EditorElement) => {
  // for focusing the first in a line once it is found that there is nothing above in any parent
  const cand = curLine(child, lines(children(par))).at(-1);
  if (cand && cand !== child) return focus(cand);
  else return null;
};

type Region = "Left" | "Right";
type WrapMode = "Thru" | "Wrap";

/** EditorElement just contains data (some data is functions) */
export class EditorElement extends HTMLElement {
  // these properties should be overwritable data (i.e. canvas editors would have their own way of figuring this out)
  editorParent = (): EditorElement | null =>
    (this.parentElement?.closest("[iseditor=true]") as EditorElement) ?? null;
  editorDescendents = () =>
    this.querySelectorAll(`[iseditor=true]`) as NodeListOf<EditorElement>;
  editorChildren = () =>
    Iter.filter(this.editorDescendents(), (d) => d.editorParent() === this);

  wrapMode: WrapMode = "Thru";
  focusableRegions: Set<Region> = new Set(["Right"]);
  focusedRegion: Region | null = null;

  // these properties should be overwritable data
  up = up(this);
  down = down(this);
  right = () => {
    if (this.focusedRegion === null)
      throw "should not be possible right focusedRegion check";
    if (this.focusedRegion === "Right") {
      //rightOrParent
      const par = this.editorParent();
      if (!par) throw "no parent rightOrParent";
      carryX = null;
      const af = after(this, lines(children(par)));
      if (af === null) return par.focusFromRightChild();
      else return af.focusFromRight();
    }
    if (this.focusedRegion === "Left") {
      if ([...children(this)].length > 0) {
        return focus(firstSpatialChild(this)!);
      } else {
        if (this.focusableRegions.has("Right")) this.focusedRegion = "Right";
        else {
          //rightOrParent
          const par = this.editorParent();
          if (!par) throw "no parent rightOrParent";
          carryX = null;
          const af = after(this, lines(children(par)));
          if (af === null) return par.focusFromRightChild();
          else return af.focusFromRight();
        }
      }
    }
  };
  left = () => {};
  //lastChildOrLeftOrParentLeft(this);

  focusFromRightChild = () => {};
  focusFromRight = onRightFocusFirstChild(this);
  focusFromLeft = onLeftFocusSelf(this);
  focusFromUp = () =>
    [...children(this)].length > 0
      ? aboveInLastLine(carryX!, lines(children(this)))?.focusFromUp() ?? null
      : focus(this);
  focusFromDown = () =>
    [...children(this)].length > 0
      ? belowInFirstLine(carryX!, lines(children(this)))?.focusFromDown() ??
        null
      : focus(this);

  slotEl: HTMLElement;
  baseStyleEl: HTMLStyleElement;

  constructor() {
    super();

    // const meta = (this.constructor as typeof EditorElement).meta;

    this.setAttribute("iseditor", "true");
    this.attachShadow({ mode: "open" });

    this.baseStyleEl = document.createElement("style");
    this.baseStyleEl.textContent = `
        :host {
          contain: paint; 

          display: inline-block;
  
          user-select: none;
  
          min-height: 1.5rem;
          min-width: 0.4rem;

          padding: 5px;
          margin: 5px;
          border: 2px solid YellowGreen;
          border-radius: 5px;
          /* border-right: 2px solid transparent; */
        }
        :host(:focus) {
          outline: none;
        }
        :host([isFocused=true]) { /* browser :focus happens if children are focused too :( */
          border-right: 4px solid black;
        }
        :host([isSelected=true]) { /* browser :focus happens if children are focused too :( */
          box-shadow: 2px 0 0 red;
        }
      `;
    this.slotEl = document.createElement("slot");
    (this.shadowRoot as ShadowRoot).append(this.baseStyleEl, this.slotEl);

    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0"); // make tabbable by default

    this.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      focus(closestChildToPosition(this)([e.clientX, e.clientY]));
      carryX = null;
      clearSelection();
    });
    this.addEventListener("mousemove", (e) => {
      if (e.buttons === 1) {
        e.preventDefault();
        e.stopPropagation();
        const closest = closestChildToPosition(this)([e.clientX, e.clientY]);
        if (closest) {
          select(closest);
          focus(closest);
        }
        carryX = null;
      }
    });
    this.addEventListener("keydown", (e) => {
      if (isArrowKey(e.key)) {
        if (e.key === "ArrowRight") this.left();
        if (e.key === "ArrowLeft") this.left();
        if (e.key === "ArrowUp") this.up();
        if (e.key === "ArrowDown") this.down();
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
}
customElements.define("poly-editor", EditorElement);

function isArrowKey(
  key: KeyboardEvent["key"]
): key is "ArrowUp" | "ArrowRight" | "ArrowDown" | "ArrowLeft" {
  return (
    key === "ArrowUp" ||
    key === "ArrowRight" ||
    key === "ArrowDown" ||
    key === "ArrowLeft"
  );
}

const EdElTree = makeTreeFunctions<EditorElement>({
  parent,
  children,
});
function* traverseEditors(start: EditorElement, end: EditorElement) {
  const comp = EdElTree.compareOrder(start, end);
  if (comp === "!") return;
  if (comp === ">") {
    let cur: EditorElement | null | undefined = start;
    while (cur) {
      if (cur === end) return;
      yield cur; // don't include start when going to the right
      cur = parent(cur)?.right(cur);
    }
  }
  if (comp === "<") {
    let cur: EditorElement | null | undefined = start;
    while (cur) {
      if (cur === end) return;
      yield cur; // include start when going to the left
      cur = parent(cur)?.left(cur);
    }
  }
}

let SELECTION_ANCHOR: EditorElement | null = null; //⚓
let SELECTION_END: EditorElement | null = null;
// when selection changes the old SELECTION span is cleared and the new one is highlighted
// function clearSelection()
function select(editor: EditorElement) {
  if (SELECTION_ANCHOR === null) {
    SELECTION_ANCHOR = editor;
    return;
  }
  clearExistingSelection();

  SELECTION_END = editor;
  for (const e of traverseEditors(SELECTION_ANCHOR, SELECTION_END))
    e?.setAttribute("isSelected", "true");
}

function clearSelection() {
  clearExistingSelection();
  SELECTION_ANCHOR = null;
  SELECTION_END = null;
}

function clearExistingSelection() {
  if (SELECTION_ANCHOR && SELECTION_END) {
    for (const e of traverseEditors(SELECTION_ANCHOR, SELECTION_END))
      e?.setAttribute("isSelected", "false");
  }
}
