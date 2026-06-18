import "./iframed-code.js";
import "./code.js";

// mostly just:
// - syncs iframed-code and my-code
// - syncs this.value with my-code.value
const createEditor = (valueToCode = (v) => v, name) =>
  customElements.define(
    name,
    class extends HTMLElement {
      static get observedAttributes() {
        return ["value"];
      }
      attributeChangedCallback(name, oldValue, newValue) {
        if (this.getAttribute("value") !== this.p.getAttribute("value"))
          this.p.setAttribute("value", this.getAttribute("value"));
      }
      connectedCallback() {
        if (this.getAttribute("value") !== this.p.getAttribute("value"))
          this.p.setAttribute("value", this.getAttribute("value"));
        this.iframe.setAttribute(
          "value",
          valueToCode(this.getAttribute("value"))
        );
      }
      constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        this.shadow = shadow;

        const iframe = document.createElement("iframed-code");
        this.iframe = iframe;
        shadow.append(iframe);

        const p = document.createElement("my-code");
        this.p = p;
        const me = this;
        new MutationObserver(() => {
          if (me.getAttribute("value") !== p.getAttribute("value"))
            me.setAttribute("value", p.getAttribute("value"));
        }).observe(p, { attributes: true });

        p.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            this.iframe.setAttribute(
              "value",
              valueToCode(this.getAttribute("value"))
            );
          }
        });
        shadow.append(p);

        const style = document.createElement("style");
        style.textContent = `
         iframed-code {
            width: calc(100% - 2px);
         }
        `;
        shadow.appendChild(style);
      }
    }
  );

// editor
createEditor(
  (value) => `import { shader } from "./shader.js";

const refresh = () => {
    window?.frameElement?.parentNode?.host?.eval()
}
window.listeners = [refresh] // for cleanup

const get = (name) => {
    const v = window.top.get(name)
    window.top.on(name, refresh)
    return v
}
const val = (name, defaultValue) => {
    const v = window.top.val(name, defaultValue)
    window.top.on(name, refresh)
    return v
}
const seto = (name, value) => {
    return window.top.set(name, value)
}
const dom = (str) => document.body.append(...new DOMParser().parseFromString(
        str,'text/html'
    ).body.childNodes)
const ap = (v) => document.body.append(v)

${value}`,
  "my-editor2"
);
