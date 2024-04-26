import { subAngles } from "../../../lib/math/Number.js";
import { angleOf } from "../../../lib/math/Vec2.js";
function makeDraggable(state, el) {
    // from https://www.redblobgames.com/making-of/draggable/
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        //if (event.target instanceof SVGTextElement) return;
        let { x, y } = state.eventToCoordinates(event);
        state.dragging = { dx: 0, dy: 0 };
        state._pos = { x, y };
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
const v2 = ({ x, y }) => [x, y];
const xy = ([x, y]) => ({
    x,
    y,
});
function eventToSvgCoordinates(event, el = event.currentTarget) {
    const svg = el;
    let p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    p = p.matrixTransform(svg.getScreenCTM().inverse());
    return p;
}
export const lines = document.querySelectorAll("#dragging2 .line");
let state = {
    eventToCoordinates: eventToSvgCoordinates,
    dragging: null,
    _pos: undefined,
    _rot: 0,
    get pos() {
        return this._pos;
    },
    set pos(p) {
        if (this._pos)
            this._rot += subAngles(angleOf(v2(p)), angleOf(v2(this._pos ?? { x: 0, y: 0 })));
        this._pos = { x: p.x, y: p.y };
        this.render();
    },
    render() {
        const RATE = 1 / 2;
        const x = (this._rot / RATE) % 1;
        const cx = -this._rot / RATE;
        const width = 180;
        // smooth partial geometric series formula ref: https://activecalculus.org/single/sec-8-2-geometric.html
        const geomSeries = (a, r) => (n) => (a * (1 - r ** n)) / (1 - r);
        const approachOne = (ratio) => geomSeries(ratio, 1 - ratio);
        const f = (n) => approachOne(1 / 7)(Math.abs(n)) * (n < 0 ? -1 : 1);
        const MAXSIZE = 2.7;
        const FALLOFF = width * 0.613;
        const bump = (n) => Math.max(0, -((n / FALLOFF) ** 2) + MAXSIZE);
        let i = Math.floor(-lines.length / 2);
        for (const line of lines) {
            const pos = f(x + i) * width;
            const size = bump(pos);
            line?.setAttribute("transform", `rotate(${(-pos).toFixed(3)}) translate(0 200) scale(${size.toFixed(3)})`);
            i++;
            line.querySelector("text").textContent = (i + Math.trunc(cx) - 1).toFixed(0);
        }
        //console.log("value:", cx);
    },
};
state.render();
//state.pos = { x: 0, y: 0 };
makeDraggable(state, document.querySelector("#dragging2"));
