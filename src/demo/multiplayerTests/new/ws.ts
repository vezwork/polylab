export class WSChannel extends EventTarget {
  ws: WebSocket;

  constructor() {
    super();
    this.ws = new WebSocket("ws://localhost:8000");
    const me = this;
    this.ws.addEventListener("message", (e) =>
      me.dispatchEvent(
        new CustomEvent("message", { detail: JSON.parse(e.data) })
      )
    );
  }
  send(data: any) {
    this.ws.send(JSON.stringify(data));
  }
}

// ws.addEventListener("open", () => {
//   console.log("open!2");
// });