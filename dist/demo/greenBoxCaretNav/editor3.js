import * as Iter from "../../lib/structure/Iterable.js";
import { CaretSink } from "./caretope.js";
// Doesn't support selection yet. Traversal would have to be added to makeCaretFunctions
// necessary because `Object.assign` does not see DOMRect properties.
const getBoundingClientRect = (element) => {
    const { top, right, bottom, left, width, height, x, y } = element.getBoundingClientRect();
    return { top, right, bottom, left, width, height, x, y };
};
let caret;
export class EditorElement extends HTMLElement {
    // these properties should be overwritable data (i.e. canvas editors would have their own way of figuring this out)
    editorParent = () => this.parentElement?.closest("[iseditor=true]") ?? null;
    editorDescendents = () => this.querySelectorAll(`[iseditor=true]`);
    editorChildren = () => Iter.filter(this.editorDescendents(), (d) => d.editorParent() === this);
    slotEl;
    baseStyleEl;
    caretSink = new CaretSink(() => this.bounds);
    bounds = getBoundingClientRect(this);
    constructor() {
        super();
        const ro = new ResizeObserver(() => {
            this.bounds = getBoundingClientRect(this);
        });
        ro.observe(this);
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
        this.shadowRoot.append(this.baseStyleEl, this.slotEl);
        if (!this.hasAttribute("tabindex"))
            this.setAttribute("tabindex", "0"); // make tabbable by default
        this.addEventListener("keydown", (e) => {
            if (isArrowKey(e.key)) {
                if (e.key === "ArrowRight")
                    this.left();
                if (e.key === "ArrowLeft")
                    this.left();
                if (e.key === "ArrowUp")
                    this.up();
                if (e.key === "ArrowDown")
                    this.down();
                e.preventDefault();
                e.stopPropagation();
            }
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
