import { makeNestedCaretFunctions } from "../../lib/caret/nestedCaret.js";
import { closestElementToPosition } from "../../lib/dom/closestElement.js";
import * as Iter from "../../lib/structure/Iterable.js";
// Doesn't support selection yet. Traversal would have to be added to makeCaretFunctions
// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element) => {
    const { top, right, bottom, left, width, height, x, y } = element.getBoundingClientRect();
    return { top, right, bottom, left, width, height, x, y };
};
const parent = (e) => e.parentElement?.closest("[isEditor=true]") ?? null;
const descendents = (e) => e.querySelectorAll(`[isEditor=true]`);
const children = (e) => Iter.filter(descendents(e), (d) => parent(d) === e);
const closestChildToPosition = (e) => (p) => closestElementToPosition(e, children(e), p);
// const setCarryX = (e: EditorElement) => (carryX: number | null) =>
//   (e.carryX = carryX);
let carryX = null;
const { next, traverseEditors } = makeNestedCaretFunctions({
    getBounds: (e) => getBoundingClientRect(e),
    parent,
    children,
    getCarryX: (e) => carryX,
    setCarryX: (_) => (v) => (carryX = v),
});
/** EditorElement just contains data (some data is functions) */
export class EditorElement extends HTMLElement {
    constructor() {
        super();
        // const meta = (this.constructor as typeof EditorElement).meta;
        this.setAttribute("isEditor", "true");
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
          outline: 2px solid yellow;
        }
      `;
        this.shadowRoot.append(baseStyleEl, document.createElement("slot"));
        if (!this.hasAttribute("tabindex"))
            this.setAttribute("tabindex", "0"); // make tabbable by default
        // focus
        this.addEventListener("focusout", (e) => this.makeUnfocused());
        this.addEventListener("focus", (e) => {
            e.stopPropagation();
            this.makeFocused();
        });
        this.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closestChildToPosition(this)([e.clientX, e.clientY])?.makeFocused();
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
                    closest.makeFocused();
                }
                carryX = null;
            }
        });
        this.addEventListener("keydown", (e) => {
            if (isArrowKey(e.key)) {
                next(this, e.key)?.makeFocused();
                e.stopPropagation();
            }
        });
    }
    makeFocused() {
        this.focus({ preventScroll: true });
        this.setAttribute("isFocused", "true");
        parent(this)?.makeUnfocused();
    }
    makeUnfocused() {
        this.setAttribute("isFocused", "false");
    }
}
customElements.define("poly-editor", EditorElement);
function isArrowKey(key) {
    return (key === "ArrowUp" ||
        key === "ArrowRight" ||
        key === "ArrowDown" ||
        key === "ArrowLeft");
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
        e.setAttribute("isSelected", "true");
}
function clearSelection() {
    clearExistingSelection();
    SELECTION_ANCHOR = null;
    SELECTION_END = null;
}
function clearExistingSelection() {
    if (SELECTION_ANCHOR && SELECTION_END) {
        for (const e of traverseEditors(SELECTION_ANCHOR, SELECTION_END))
            e.setAttribute("isSelected", "false");
    }
}
