import { some } from "../../lib/structure/Iterable.js";
import { EditorElement, focus } from "./editor2.js";
import { SymbolEditor } from "./symbolEditor.js";
export class LineEditor extends EditorElement {
    constructor() {
        super();
        this.style.outline = "solid 2px blue";
        this.addEventListener("keydown", (e) => {
            if (e.key.length === 1) {
                const newEl = new SymbolEditor(e.key);
                if (e.target && some(this.editorChildren(), (c) => c === e.target))
                    e.target.after(newEl);
                else
                    this.appendChild(newEl);
                focus(newEl);
                e.preventDefault();
            }
            e.stopPropagation();
        });
    }
}
customElements.define("line-editor", LineEditor);
