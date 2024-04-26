import { add, angleOf, length, setAngle, setLength, sub, } from "../../../lib/math/Vec2.js";
function makeDraggable(state, el, clone) {
    // from https://www.redblobgames.com/making-of/draggable/
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        let { x, y } = state.eventToCoordinates(event);
        state.dragging = { dx: state.pos.x - x, dy: state.pos.y - y };
        el.classList.add("dragging");
        clone.classList.add("dragging");
        el.setPointerCapture(event.pointerId);
    }
    function end(_event) {
        state.dragging = null;
        el.classList.remove("dragging");
        clone.classList.remove("dragging");
    }
    function move(event) {
        if (!state.dragging)
            return;
        let { x, y } = state.eventToCoordinates(event);
        state.pos = { x: x + state.dragging.dx, y: y + state.dragging.dy };
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
const v2 = ({ x, y }) => [x, y];
const xy = ([x, y]) => ({
    x,
    y,
});
const reverse = (v) => setLength(100 - length(v), setAngle(angleOf(v) + Math.PI)(v));
// Make the circle draggable only to the snap points
const el = document.querySelector("#dragging1 circle.draggable");
const clone = document.querySelector("#dragging1 circle.clone");
let state = {
    eventToCoordinates: eventToSvgCoordinates,
    dragging: null,
    _pos: { x: 0, y: 0 },
    _pos2: { x: 0, y: 0 },
    get pos() {
        return this._pos;
    },
    set pos(p) {
        const delta = sub(v2(p), v2(this._pos));
        this._pos = p;
        this._pos2 = xy(add(v2(this._pos2), delta));
        const v = v2(this._pos2);
        if (length(v) > 50) {
            this._pos2 = xy(reverse(v));
        }
        const cpos = reverse(v2(this._pos2));
        clone?.setAttribute("cx", cpos[0]);
        clone?.setAttribute("cy", cpos[1]);
        el?.setAttribute("cx", this._pos2.x);
        el?.setAttribute("cy", this._pos2.y);
    },
};
makeDraggable(state, el, clone);
makeDraggable(state, clone, el);
