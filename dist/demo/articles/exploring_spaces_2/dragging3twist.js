const mod = (a, n, nL = 0) => ((((a - nL) % (n - nL)) + (n - nL)) % (n - nL)) + nL;
const clamp = (a, n, nL = 0) => Math.min(Math.max(a, n), nL);
function makeDraggable(state, el) {
    // from https://www.redblobgames.com/making-of/draggable/
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        let { x, y } = state.eventToCoordinates(event);
        state.dragging = { dx: state.prevX - x, dy: state.prevY - y };
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
        let { x, y } = state.eventToCoordinates(event);
        if (el.classList.contains("x"))
            state.x = x + state.dragging.dx;
        if (el.classList.contains("y"))
            state.y = y + state.dragging.dy;
    }
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointermove", move);
    el.addEventListener("touchstart", (e) => e.preventDefault());
}
function eventToSvgCoordinates(event, el = event.currentTarget) {
    const svg = el.ownerSVGElement;
    let p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    p = p.matrixTransform(svg.getScreenCTM().inverse());
    return p;
}
export const els = Array.from(document.querySelectorAll("#dragging3twist .draggable"));
let state = {
    eventToCoordinates: eventToSvgCoordinates,
    dragging: null,
    prevX: 50,
    _x: 50,
    prevY: 50,
    _y: 50,
    get x() {
        return this._x;
    },
    set x(n) {
        const delta = n - this.prevX;
        this.prevX = n;
        this._x += delta;
        if (this._x >= 700 || this._x <= 0) {
            this._y = 150 - this._y;
            this._x = mod(this._x, 0, 700);
        }
        for (const el of els) {
            el.setAttribute("cx", this._x);
            el.setAttribute("cy", this._y);
        }
    },
    get y() {
        return this._y;
    },
    set y(n) {
        const delta = n - this.prevY;
        this.prevY = n;
        this._y = clamp(this._y + delta, 0, 150);
        for (const el of els) {
            el.setAttribute("cx", this._x);
            el.setAttribute("cy", this._y);
        }
    },
};
state.x = 50;
state.y = 50;
for (const el of els)
    makeDraggable(state, el);
