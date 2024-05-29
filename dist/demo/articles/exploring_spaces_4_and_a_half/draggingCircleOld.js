import { saxis } from "./draggingSphereUsage.js";
const mod = (a, n, nL = 0) => ((((a - nL) % (n - nL)) + (n - nL)) % (n - nL)) + nL;
function makeDraggable(state, el) {
    // from https://www.redblobgames.com/making-of/draggable/
    let pos = 0;
    let dragging = null;
    // modified from https://www.redblobgames.com/making-of/draggable/
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        let { x, y } = state.eventToCoordinates(event);
        dragging = pos - y;
        el.classList.add("dragging");
        // for (const clone of clones) clone.classList.add("dragging");
        el.setPointerCapture(event.pointerId);
    }
    function end(_event) {
        dragging = null;
        el.classList.remove("dragging");
        // for (const clone of clones) clone.classList.remove("dragging");
    }
    function move(event) {
        if (dragging === null)
            return;
        let { x, y } = state.eventToCoordinates(event);
        const newPos = y + dragging;
        const diff = newPos - pos;
        pos = newPos;
        state.movey(diff);
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
const makeIt = (el, width, f) => {
    let state = {
        eventToCoordinates: eventToSvgCoordinates,
        dragging: null,
        _y: undefined,
        _pos: undefined,
        get y() {
            return this._y;
        },
        movey(n) {
            this.sety(this._y + n);
        },
        sety(n) {
            this._y = n;
            el.setAttribute("cy", mod(this._y, 0, width));
            try {
                f(this._y);
            }
            catch (e) { }
        },
    };
    state.sety(20);
    makeDraggable(state, el);
    return state;
};
const s1 = makeIt(document
    .querySelector(".circle-input-old")
    .querySelector(".draggable-circle-old"), 200, (y) => {
    try {
        saxis.radius(Math.abs(mod(y + 100, -100, 100)) / 2 + 6);
    }
    catch (e) { }
});
