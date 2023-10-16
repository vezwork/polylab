import { makeCaretLineOpFunctions } from "../../lib/caret/caretLineOps.js";
import { makeCaretFunctions } from "../../lib/caret/caretLines.js";
import { closestElementToPosition } from "../../lib/dom/closestElement.js";
import * as Iter from "../../lib/structure/Iterable.js";
import { makeTreeFunctions } from "../../lib/structure/tree.js";
// Doesn't support selection yet. Traversal would have to be added to makeCaretFunctions
// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element) => {
    const { top, right, bottom, left, width, height, x, y } = element.getBoundingClientRect();
    return { top, right, bottom, left, width, height, x, y };
};
const parent = (e) => e.parentElement?.closest("[iseditor=true]") ?? null;
const descendents = (e) => e.querySelectorAll(`[iseditor=true]`);
const children = (e) => Iter.filter(descendents(e), (d) => parent(d) === e);
const closestChildToPosition = (e) => (p) => closestElementToPosition(e, children(e), p);
let carryX = null;
const getBounds = getBoundingClientRect;
const { lines } = makeCaretFunctions({
    getBounds,
});
const { belowInFirstLine, aboveInLastLine, nextLine, curLine, prevLine, closestInLine, after, before, } = makeCaretLineOpFunctions({
    getBounds,
});
const firstSpatialChild = (e) => lines(children(e))?.at(0)?.at(0) ?? null;
const lastSpatialChild = (e) => lines(children(e))?.at(-1)?.at(-1) ?? null;
let CARET;
const focus = (el) => {
    if (el === null)
        return null;
    CARET?.setAttribute("isFocused", "false");
    CARET = el;
    el.setAttribute("isFocused", "true");
    el.focus();
    return el;
};
/** EditorElement just contains data (some data is functions) */
export class EditorElement extends HTMLElement {
    up() {
        return parent(this)?.focusUpSibling(this) ?? null;
    }
    down() {
        return parent(this)?.focusDownSibling(this) ?? null;
    }
    right() {
        return parent(this)?.focusRightSibling(this) ?? null;
    }
    left() {
        if ([...children(this)].length > 0) {
            return focus(lastSpatialChild(this));
        }
        else {
            return parent(this)?.focusLeftSibling(this) ?? null;
        }
    }
    focusRightSibling(sibling) {
        carryX = null;
        const af = after(sibling, lines(children(this)));
        if (af === null)
            return focus(this);
        else
            return af.focusFromRight();
    }
    focusFromRight() {
        if ([...children(this)].length > 0)
            return firstSpatialChild(this).focusFromRight();
        else
            return focus(this);
    }
    focusLeftSibling(sibling) {
        carryX = null;
        const af = before(sibling, lines(children(this)));
        if (af === null)
            return parent(this)?.focusLeftSibling(this) ?? null;
        else
            return focus(af);
    }
    focusUpSibling(sibling) {
        carryX ??= getBounds(sibling).right;
        const up = closestInLine(sibling, prevLine(sibling, lines(children(this))), carryX);
        if (up === null) {
            const par = parent(this);
            if (par) {
                const parFocus = par.focusUpSibling(this);
                if (parFocus)
                    return parFocus;
                else
                    return this.focusFirstInLine(sibling);
            }
            else
                return this.focusFirstInLine(sibling);
        }
        else
            return up.focusFromUp();
    }
    focusFirstInLine(sibling) {
        // for focusing the first in a line once it is found that there is nothing above in any parent
        const cand = curLine(sibling, lines(children(this))).at(0);
        if (cand && cand !== sibling)
            return focus(cand);
        else
            return null;
    }
    focusFromUp() {
        if ([...children(this)].length > 0)
            return (aboveInLastLine(carryX, lines(children(this)))?.focusFromUp() ?? null);
        else
            return focus(this);
    }
    // Down is a copy paste of up, with prevLine replaced with nextLine and aboveInLastLine replaced with belowInFirstLine
    focusDownSibling(sibling) {
        carryX ??= getBounds(sibling).right;
        const down = closestInLine(sibling, nextLine(sibling, lines(children(this))), carryX);
        if (down === null) {
            const par = parent(this);
            if (par) {
                const parFocus = par.focusDownSibling(this);
                if (parFocus)
                    return parFocus;
                else
                    return this.focusLastInLine(sibling);
            }
            else
                return this.focusLastInLine(sibling);
        }
        else
            return down.focusFromDown();
    }
    focusLastInLine(sibling) {
        const cand = curLine(sibling, lines(children(this))).at(-1);
        if (cand && cand !== sibling)
            return focus(cand);
        else
            return null;
    }
    focusFromDown() {
        if ([...children(this)].length > 0)
            return (belowInFirstLine(carryX, lines(children(this)))?.focusFromDown() ??
                null);
        else
            return focus(this);
    }
    slotEl;
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
          /* border-right: 2px solid transparent; */
        }
        :host(:focus) {
          outline: none;
        }
        :host([isFocused=true]) { /* browser :focus happens if children are focused too :( */
          border-right: 2px solid black;
        }
        :host([isSelected=true]) { /* browser :focus happens if children are focused too :( */
          box-shadow: 2px 0 0 red;
        }
      `;
        this.slotEl = document.createElement("slot");
        this.shadowRoot.append(baseStyleEl, this.slotEl);
        if (!this.hasAttribute("tabindex"))
            this.setAttribute("tabindex", "0"); // make tabbable by default
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
                if (e.key === "ArrowRight")
                    this.right();
                if (e.key === "ArrowLeft")
                    this.left();
                if (e.key === "ArrowUp")
                    this.up();
                if (e.key === "ArrowDown")
                    this.down();
                e.preventDefault();
            }
            if (e.key.length === 1) {
                this.appendChild(new EditorElement());
            }
            if (e.key === "Enter") {
                this.appendChild(document.createElement("br"));
            }
            e.stopPropagation();
        });
    }
}
customElements.define("poly-editor", EditorElement);
function isArrowKey(key) {
    return (key === "ArrowUp" ||
        key === "ArrowRight" ||
        key === "ArrowDown" ||
        key === "ArrowLeft");
}
const EdElTree = makeTreeFunctions({
    parent,
    children,
});
function* traverseEditors(start, end) {
    const comp = EdElTree.compareOrder(start, end);
    if (comp === "!")
        return;
    if (comp === ">") {
        let cur = start;
        while (cur) {
            if (cur === end)
                return;
            yield cur; // don't include start when going to the right
            cur = cur.right();
        }
    }
    if (comp === "<") {
        let cur = start;
        while (cur) {
            if (cur === end)
                return;
            yield cur; // include start when going to the left
            cur = cur.left();
        }
    }
}
let SELECTION_ANCHOR = null; //⚓
let SELECTION_END = null;
// when selection changes the old SELECTION span is cleared and the new one is highlighted
// function clearSelection()
function select(editor) {
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
