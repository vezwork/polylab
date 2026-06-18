function resizeIframeToFitContent(iframe) {
  // iframe.style.width = iframe.contentWindow.document.body.scrollWidth;
  iframe.style.height = iframe.contentWindow.document.body.scrollHeight;
}

function sandboxedEval(toEval, me, callback = () => {}) {
  const htmlString = `
    <style>
      html, body {
        margin: 0;
        padding: 0;
        display: inline-block;
      }
      canvas {
        margin-bottom: -4px;
      }
    </style>
    <script type="module">
      ${toEval}
    </script>`;
  const iframe = document.createElement("iframe");
  iframe.srcdoc = htmlString;
  iframe.style.height = "30px";
  iframe.style.width = "100%";
  iframe.style.display = "inline-block";
  iframe.style.border = "none";

  iframe.onload = function () {
    resizeIframeToFitContent(iframe);

    const obs = new MutationObserver(() => {
      resizeIframeToFitContent(iframe);
      me.style.height = iframe.style.height;
    });
    obs.observe(iframe.contentDocument.body, {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });

    callback(iframe);
    me.style.height = iframe.style.height;
  };
  return iframe;
}

customElements.define(
  "iframed-code",
  class extends HTMLElement {
    connectedCallback() {
      this.eval();
    }
    static get observedAttributes() {
      return ["value"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
      this.eval();
    }
    constructor() {
      super();

      const shadow = this.attachShadow({ mode: "open" });
      this.shadow = shadow;

      const style = document.createElement("style");
      style.textContent = `
         :host {
          overflow: hidden;
          border-radius: 10px;
          border: 1px solid black;
          display: inline-block;
         }
        `;
      shadow.appendChild(style);
    }
    eval() {
      const oldIframes = this.shadow.querySelectorAll("iframe");
      const newIframe = sandboxedEval(
        this.getAttribute("value"),
        this,
        (iframe) => {
          for (const oldIframe of oldIframes) {
            // clean up listeners
            for (const [k, ls] of window.top.listeners) {
              window.top.listeners.set(
                k,
                ls.filter(
                  (l) => !(oldIframe.contentWindow?.listeners ?? []).includes(l)
                )
              );
            }
            // clean up iframe
            oldIframe?.remove();
          }
        }
      );
      this.shadow.append(newIframe);
    }
  }
);

customElements.define(
  "iframed-code2",
  class extends HTMLElement {
    constructor() {
      super();
    }
  }
);
