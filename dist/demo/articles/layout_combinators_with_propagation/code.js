customElements.define(
  "my-code",
  class extends HTMLElement {
    connectedCallback() {
      this.p.textContent = this.getAttribute("value");
    }
    static get observedAttributes() {
      return ["value"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (this.p.textContent !== this.getAttribute("value"))
        this.p.textContent = this.getAttribute("value");
    }
    constructor() {
      super();

      const shadow = this.attachShadow({ mode: "open" });
      this.shadow = shadow;

      const p = document.createElement("pre");
      this.p = p;
      p.contentEditable = "plaintext-only";
      p.setAttribute("spellcheck", "false");
      const me = this;
      p.addEventListener("input", () => {
        me.setAttribute("value", p.textContent);
      });
      shadow.append(p);

      const style = document.createElement("style");
      style.textContent = `
          pre {
            font-family: "fira code";
            white-space: pre-wrap;
            background: #eee;
            padding: 10px;
            border-radius: 10px;
            font-size: 15px;
            margin: 0;
          }
        `;
      shadow.appendChild(style);
    }
  }
);
