import { find, some } from "../../lib/structure/Iterable.js";
import { EditorElement, focus } from "./editor2.js";
import { SymbolEditor } from "./symbolEditor.js";

export class LineEditor extends EditorElement {
  constructor() {
    super();

    this.style.display = "block";
    this.style.outline = "solid 1px #87CEEB";

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
        childLine.left();
        this.removeChild(childLine);
      }
    });
  }
}
customElements.define("line-editor", LineEditor);
