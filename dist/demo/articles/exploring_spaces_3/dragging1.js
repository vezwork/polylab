function makeDraggable(state, el) {
    // from https://www.redblobgames.com/making-of/draggable/
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        if (event.target instanceof SVGTextElement)
            return;
        let { x, y } = state.eventToCoordinates(event);
        state.dragging = { dx: state.pos.x - x, dy: state.pos.y - y };
        el.classList.add("dragging");
        el.setPointerCapture(event.pointerId);
    }
    function end(_event) {
        state.dragging = null;
        el.classList.remove("dragging");
    }
    function move(event) {
        if (!state.dragging)
            return;
        event.preventDefault();
        let { x, y } = state.eventToCoordinates(event);
        state.pos = { x: x + state.dragging.dx, y: y + state.dragging.dy };
    }
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointermove", move);
    el.addEventListener("touchstart", (e) => e.preventDefault());
}
export const lines = document.querySelectorAll("#dragging1 .line");
let state = {
    eventToCoordinates(event) {
        return { x: event.clientX, y: event.clientY };
    },
    dragging: null,
    _pos: undefined,
    get pos() {
        return this._pos;
    },
    set pos(p) {
        this._pos = { x: p.x, y: p.y };
        const RATE = 50;
        const x = (p.x / RATE) % 1;
        const cx = -p.x / RATE;
        const width = 280;
        // smooth partial geometric series formula ref: https://activecalculus.org/single/sec-8-2-geometric.html
        const geomSeries = (a, r) => (n) => (a * (1 - r ** n)) / (1 - r);
        const approachOne = (ratio) => geomSeries(ratio, 1 - ratio);
        const f = (n) => approachOne(1 / 5)(Math.abs(n)) * (n < 0 ? -1 : 1);
        const MAXSIZE = 1.5;
        const FALLOFF = width * 0.833;
        const bump = (n) => Math.max(0, -((n / FALLOFF) ** 2) + MAXSIZE);
        let i = Math.floor(-lines.length / 2);
        for (const line of lines) {
            const pos = f(x + i) * width;
            const size = bump(pos);
            line?.setAttribute("transform", `translate(${pos.toFixed(3)} 0) scale(${size.toFixed(3)})`);
            i++;
            line.querySelector("text").textContent = (i + Math.trunc(cx) - 1).toFixed(0);
        }
        console.log("value:", cx);
    },
};
state.pos = { x: 0, y: 0 };
makeDraggable(state, document.querySelector("#dragging1"));
