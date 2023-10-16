import { EditorElement } from "./editor2.js";

export class SymbolEditor extends EditorElement {
  constructor(symbol: string) {
    super();

    this.append(symbol);
  }
}
customElements.define("symbol-editor", SymbolEditor);
