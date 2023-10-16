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
let carryX: number | null = null;

const { lines } = makeCaretFunctions<EditorElement>({
  getBounds,
});

const {
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
const firstSpatialChild = (e: EditorElement) =>
  lines(e.editorChildren())?.at(0)?.at(0) ?? null;
const lastSpatialChild = (e: EditorElement) =>
  lines(e.editorChildren())?.at(-1)?.at(-1) ?? null;

// This will be a caret service which manages multicursors and selection and stuff
let CARET: EditorElement | null = null;
let FOCUS_SIDE: "left" | "right" | null = null;
export const focus = (
  el: EditorElement | null,
  side: "left" | "right" = "right"
) => {
  if (el === null) return null;
  CARET?.setAttribute("isFocused" + FOCUS_SIDE, "false");
  CARET = el;
  el.setAttribute("isFocused" + side, "true");
  FOCUS_SIDE = side;
  el.focus();
  return el;
};

const parent = (e: EditorElement) => e.editorParent();
const children = (e: EditorElement) => e.editorChildren();

const onRightFocusSelf = (e: EditorElement) => () => focus(e, "left");
const onRightFocusFirstChild = (e: EditorElement) => () =>
  [...children(e)].length > 0
    ? firstSpatialChild(e)!.focusFromRight()
    : focus(e);

const onLeftFocusSelf = (e: EditorElement) => () => focus(e, "right");
const onLeftFocusLastChild = (e: EditorElement) => () =>
  [...children(e)].length > 0 ? lastSpatialChild(e)!.focusFromLeft() : focus(e);

const leftToChild = (e: EditorElement) => () => {
  if ([...children(e)].length > 0) {
    return focus(lastSpatialChild(e)!);
  } else {
    return parent(e)?.focusLeftSibling(e) ?? null;
  }
};
const leftToSibling = (e: EditorElement) => () =>
  parent(e)?.focusLeftSibling(e) ?? null;

const rightToChild = (e: EditorElement) => () => {
  if ([...children(e)].length > 0) {
    return focus(firstSpatialChild(e)!, "left");
  } else {
    return parent(e)?.focusRightSibling(e) ?? null;
  }
};
const rightToSibling = (e: EditorElement) => () =>
  parent(e)?.focusRightSibling(e) ?? null;

/** EditorElement just contains data (some data is functions) */
export class EditorElement extends HTMLElement {
  // these properties should be overwritable data (i.e. canvas editors would have their own way of figuring this out)
  editorParent = (): EditorElement | null =>
    (this.parentElement?.closest("[iseditor=true]") as EditorElement) ?? null;
  editorDescendents = () =>
    this.querySelectorAll(`[iseditor=true]`) as NodeListOf<EditorElement>;
  editorChildren = () =>
    Iter.filter(this.editorDescendents(), (d) => d.editorParent() === this);

  // these properties should be overwritable data
  up() {
    return parent(this)?.focusUpSibling(this) ?? null;
  }
  down() {
    return parent(this)?.focusDownSibling(this) ?? null;
  }
  right = () => {
    // FOCUS_SIDE seems dangerous here because `this` might not even be focused?
    if (FOCUS_SIDE === "left") {
      if ([...children(this)].length > 0) {
        return rightToChild(this)();
      } else {
        focus(this, "right");
      }
    } else {
      return rightToSibling(this)();
    }
  };
  left = leftToSibling(this);

  // this is not really an interface property, its just used for the default implementation
  focusRightSibling(sibling: EditorElement): EditorElement | null {
    carryX = null;
    const af = after(sibling, lines(children(this)));
    if (af === null)
      return focus(this, "right"); // `this.right()` to skip highlighting parent
    else return af.focusFromRight();
  }

  // this should be a "hook" property of the interface. This editor is allowed to decide how it deals with being focused from the right (I think)
  focusFromRight = onRightFocusSelf(this);

  focusLeftSibling(sibling: EditorElement): EditorElement | null {
    carryX = null;
    const af = before(sibling, lines(children(this)));
    if (af === null) return parent(this)?.focusLeftSibling(this) ?? null;
    else return af.focusFromLeft();
  }

  focusFromLeft = onLeftFocusSelf(this);

  focusUpSibling(sibling: EditorElement): EditorElement | null {
    carryX ??= getBounds(sibling).right;
    const up = closestInLine(
      sibling,
      prevLine(sibling, lines(children(this))),
      carryX
    );
    if (up === null) {
      const par = parent(this);
      if (par) {
        const parFocus = par.focusUpSibling(this);
        if (parFocus) return parFocus;
        else return this.focusFirstInLine(sibling);
      } else return this.focusFirstInLine(sibling);
    } else return up.focusFromUp();
  }

  focusFirstInLine(sibling: EditorElement): EditorElement | null {
    // for focusing the first in a line once it is found that there is nothing above in any parent
    const cand = curLine(sibling, lines(children(this))).at(0);
    if (cand && cand !== sibling) return focus(cand);
    else return null;
  }

  focusFromUp(): EditorElement | null {
    if ([...children(this)].length > 0)
      return (
        aboveInLastLine(carryX!, lines(children(this)))?.focusFromUp() ?? null
      );
    else return focus(this);
  }

  // Down is a copy paste of up, with prevLine replaced with nextLine and aboveInLastLine replaced with belowInFirstLine
  focusDownSibling(sibling: EditorElement): EditorElement | null {
    carryX ??= getBounds(sibling).right;
    const down = closestInLine(
      sibling,
      nextLine(sibling, lines(children(this))),
      carryX
    );
    if (down === null) {
      const par = parent(this);
      if (par) {
        const parFocus = par.focusDownSibling(this);
        if (parFocus) return parFocus;
        else return this.focusLastInLine(sibling);
      } else return this.focusLastInLine(sibling);
    } else return down.focusFromDown();
  }

  focusLastInLine(sibling: EditorElement): EditorElement | null {
    const cand = curLine(sibling, lines(children(this))).at(-1);
    if (cand && cand !== sibling) return focus(cand);
    else return null;
  }

  focusFromDown(): EditorElement | null {
    if ([...children(this)].length > 0)
      return (
        belowInFirstLine(carryX!, lines(children(this)))?.focusFromDown() ??
        null
      );
    else return focus(this);
  }

  slotEl: HTMLElement;

  constructor() {
    super();

    // const meta = (this.constructor as typeof EditorElement).meta;

    this.setAttribute("iseditor", "true");
    this.attachShadow({ mode: "open" });

    const baseStyleEl = document.createElement("style");
    baseStyleEl.textContent = `
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
        :host([isFocusedLeft=true]) { /* browser :focus happens if children are focused too :( */
          border-left: 4px solid black;
        }
        :host([isFocusedRight=true]) { /* browser :focus happens if children are focused too :( */
          border-right: 4px solid black;
        }
        :host([isSelected=true]) { /* browser :focus happens if children are focused too :( */
          box-shadow: 2px 0 0 red;
        }
      `;
    this.slotEl = document.createElement("slot");
    (this.shadowRoot as ShadowRoot).append(baseStyleEl, this.slotEl);

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
        if (e.key === "ArrowRight") this.right();
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
      cur = cur.right();
    }
  }
  if (comp === "<") {
    let cur: EditorElement | null | undefined = start;
    while (cur) {
      if (cur === end) return;
      yield cur; // include start when going to the left
      cur = cur.left();
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
