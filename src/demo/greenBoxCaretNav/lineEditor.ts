import { find, some } from "../../lib/structure/Iterable.js";
import {
  EditorElement,
  after,
  before,
  children,
  focus,
  lastChildOrLeftOrParent,
  lastSpatialChild,
  lines,
  onLeftFocusLastChild,
  onRightFocusSelf,
  parent,
  rightOrParentRight,
} from "./editor2.js";
import { SymbolEditor } from "./symbolEditor.js";

export class LineEditor extends EditorElement {
  left = lastChildOrLeftOrParent(this);
  right = rightOrParentRight(this);
  focusFromLeft = onLeftFocusLastChild(this);
  focusFromRight = onRightFocusSelf(this);

  constructor() {
    super();

    this.baseStyleEl.textContent += `
      :host {
        display: block;
        outline: solid 1px #87CEEB
      }
      :host([isFocused=true]) { /* browser :focus happens if children are focused too :( */
          border-left: 4px solid red;
      }
    `;

    this.addEventListener("keydown", (e) => {
      if (e.key.length === 1) {
        const newEl = new SymbolEditor(e.key);
        if (e.target && some(this.editorChildren(), (c) => c === e.target))
          (e.target as HTMLElement).after(newEl);
        else this.appendChild(newEl);
        focus(newEl);
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "Backspace") {
        const childLine = find(this.editorChildren(), (c) =>
          c.contains(e.target as HTMLElement)
        );
        if (childLine === null) return;
        this.left(childLine);
        this.removeChild(childLine);
      }
    });
  }
}
customElements.define("line-editor", LineEditor);
