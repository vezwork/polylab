export class WSChannel extends EventTarget {
    ws;
    constructor() {
        super();
        this.ws = new WebSocket("ws://192.168.0.111:8000");
        const me = this;
        this.ws.addEventListener("open", () => me.dispatchEvent(new CustomEvent("open")));
        this.ws.addEventListener("message", (e) => {
            const { type, data } = JSON.parse(e.data);
            me.dispatchEvent(new CustomEvent(type, { detail: data }));
            me.dispatchEvent(new CustomEvent("message"));
        });
    }
    send(type, data) {
        const ws = this.ws;
        ws.send(JSON.stringify({ type, data }));
    }
}
// ws.addEventListener("open", () => {
//   console.log("open!2");
// });
