import { find } from "../../lib/structure/Iterable.js";
import { EditorElement, focus } from "./editor2.js";
import { LineEditor } from "./lineEditor.js";
export class MultiLineEditor extends EditorElement {
    lines = [];
    constructor() {
        super();
        this.lines = [new LineEditor()];
        this.render();
        this.style.outline = "solid 1px #87CEEB";
        this.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                if (e.target) {
                    const childLine = find(this.lines, (c) => c.contains(e.target));
                    if (childLine === null)
                        return;
                    const newEl = new LineEditor();
                    const i = this.lines.indexOf(childLine);
                    this.lines.splice(i + 1, 0, newEl);
                    this.render();
                    focus(newEl);
                }
                e.preventDefault();
                e.stopPropagation();
            }
            if (e.key === "Backspace") {
                const childLine = find(this.lines, (c) => c.contains(e.target));
                if (childLine === null)
                    return;
                childLine.up();
                this.lines = this.lines.filter((ed) => ed !== childLine);
                if (this.lines.length === 0)
                    this.lines = [new LineEditor()];
                this.render();
            }
        });
    }
    render() {
        this.innerHTML = "";
        this.append(...this.lines);
    }
}
customElements.define("multiline-editor", MultiLineEditor);
