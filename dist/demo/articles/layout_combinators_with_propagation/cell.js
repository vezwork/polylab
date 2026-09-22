customElements.define(
  "my-cell",
  class extends HTMLElement {
    constructor() {
      super();

      const shadow = this.attachShadow({ mode: "open" });
      this.shadow = shadow;

      const style = document.createElement("style");
      style.textContent = `

:host {
    display: grid;
    grid-template-columns: auto 1fr;
    margin: 10px 0;  
}

.bar {
    color: gray;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 10px 0 0;

    button {
        border: none;
        border-radius: 5px;  
        color: gray;
    }
}

        `;
      shadow.appendChild(style);

      shadow.append(
        ...new DOMParser().parseFromString(
          `

<div class="bar">
    <button id="b1">+</button>
    <div id="dragHandle" style="cursor: grab; user-select: none;">⠇</div>
    <button id="remove">⊗</button>
    <!--<button id="b3">[]</button>-->
    <button id="b2">+</button>
</div>
<slot></slot>


`,
          "text/html"
        ).body.childNodes
      );
      const me = this;
      // shadow.querySelector("#b3").addEventListener("click", (e) => {
      //   const d = document.createElement("div");
      //   const iframeHTML = me
      //     .querySelector("my-editor2")
      //     .shadowRoot.querySelector("iframed-code")
      //     .shadowRoot.querySelector("iframe").contentDocument.body.innerHTML;

      //   d.innerHTML = iframeHTML;
      //   this.after(d);
      //   this.remove();
      // });
      shadow.querySelector("#b1").addEventListener("click", (e) => {
        const cellEl = document.createElement("my-cell");
        cellEl.append(document.createElement("my-editor2"));
        this.before(cellEl);
      });
      shadow.querySelector("#b2").addEventListener("click", (e) => {
        const cellEl = document.createElement("my-cell");
        cellEl.append(document.createElement("my-editor2"));
        this.after(cellEl);
      });
      shadow.querySelector("#remove").addEventListener("click", (e) => {
        this.remove();
      });
      const handle = shadow.querySelector("#dragHandle");
      handle.onmousedown = (e) => this.setAttribute("draggable", "true");

      this.addEventListener("dragstart", (event) => {
        this.id = "dragged-cell";
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("cell", "");

        // this makes it so you can drag the cell out into other apps!
        event.dataTransfer.setData(
          "text/plain",
          me.querySelector("my-editor2").getAttribute("value")
        );

        event.stopPropagation();
      });
      this.addEventListener("dragend", (event) => {
        console.log("yo", event);
        this.removeAttribute("id");
        this.removeAttribute("draggable");
        event.stopPropagation();
      });
    }
  }
);
