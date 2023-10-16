import { find, indexOf, some } from "../../lib/structure/Iterable.js";
import {
  EditorElement,
  children,
  firstChildOrRightOrParent,
  focus,
  leftOrParent,
} from "./editor2.js";
import { LineEditor } from "./lineEditor.js";

export class MultiLineEditor extends EditorElement {
  left = leftOrParent(this);
  right = firstChildOrRightOrParent(this);

  lines: LineEditor[] = [];

  constructor() {
    super();

    this.lines = [new LineEditor()];
    this.render();

    this.style.outline = "solid 1px #87CEEB";

    this.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (e.target) {
          const childLine = find(this.lines, (c) =>
            c.contains(e.target as HTMLElement)
          );
          if (childLine === null) return;
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
        const childLine = indexOf(this.lines, (c) =>
          c.contains(e.target as HTMLElement)
        );
        if (childLine === null) return;
        const line = this.lines.at(childLine);
        if (!line) return;
        const abover = this.lines.at(childLine - 1);
        if (!abover) return;
        abover?.append(...children(line));
        focus(abover ?? null);

        this.lines = this.lines.filter((ed, i) => i !== childLine);
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
