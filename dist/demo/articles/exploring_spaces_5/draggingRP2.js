import { add, angleOf, length, setAngle, setLength, sub, } from "../../../lib/math/Vec2.js";
import { colorPickerSetPos } from "./draggingSphereUsage.js";
const RADIUS = 100;
const circleRevert = (v) => length(v) === 0 // hack so 0 vector doesn't get mapped to [NaN, NaN]
    ? [1e10, 1e10]
    : setLength(RADIUS - length(v), setAngle(angleOf(v) + Math.PI)(v));
function makeDraggable(state, el, ...clones) {
    let pos = [0, 0];
    let dragging = null;
    // modified from https://www.redblobgames.com/making-of/draggable/
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        let { x, y } = state.eventToCoordinates(event);
        dragging = [pos[0] - x, pos[1] - y];
        el.classList.add("dragging");
        for (const clone of clones)
            clone.classList.add("dragging");
        el.setPointerCapture(event.pointerId);
    }
    function end(_event) {
        dragging = null;
        el.classList.remove("dragging");
        for (const clone of clones)
            clone.classList.remove("dragging");
    }
    function move(event) {
        if (dragging === null)
            return;
        let { x, y } = state.eventToCoordinates(event);
        const newPos = [x + dragging[0], y + dragging[1]];
        const diff = sub(newPos, pos);
        pos = newPos;
        state.movePos(diff);
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
const makeCircleAndClone = (svg, show = true, draggable = true, r = "6", fill = "white") => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.append(circle);
    if (draggable)
        circle.classList.add("draggable");
    circle.setAttribute("r", r);
    //circle.setAttribute("mask", "url(#myMask)");
    circle.style.fill = fill;
    circle.style.visibility = show ? "visible" : "hidden";
    const clone = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.append(clone);
    if (draggable)
        clone.classList.add("draggable");
    clone.classList.add("clone");
    clone.setAttribute("r", r);
    clone.setAttribute("cx", "100");
    clone.style.fill = fill;
    //clone.setAttribute("mask", "url(#myMask)");
    return { circle, clone };
};
const createDraggableDot = () => {
    const { circle: ela, clone: clonea } = makeCircleAndClone(document.querySelector("#dragging1"));
    let state = {
        el: ela,
        clone: clonea,
        eventToCoordinates: eventToSvgCoordinates,
        dragging: null,
        pos: [0, 0],
        color(c) {
            ela.style.fill = c;
        },
        movePos(delta) {
            this.pos = add(this.pos, delta);
            let didCircleRevert = false;
            if (length(this.pos) > 50) {
                this.pos = circleRevert(this.pos);
                didCircleRevert = true;
            }
            this.render(true, didCircleRevert);
        },
        render(shouldSetPos = true, didCircleRevert = false) {
            const cpos = circleRevert(this.pos);
            if (!Number.isNaN(cpos[0])) {
                this.clone?.setAttribute("cx", cpos[0] + "");
                this.clone?.setAttribute("cy", cpos[1] + "");
                this.el?.setAttribute("cx", this.pos[0] + "");
                this.el?.setAttribute("cy", this.pos[1] + "");
            }
            try {
                if (shouldSetPos) {
                    colorPickerSetPos(this.pos[0], this.pos[1], didCircleRevert);
                }
            }
            catch (e) { }
        },
    };
    makeDraggable(state, clonea, ela);
    makeDraggable(state, ela, clonea);
    return state;
};
export const dotState = createDraggableDot();
// make the background draw on-top
document
    .querySelector("#dragging1")
    .append(document.getElementById("dragging1_background_rect"));
document
    .querySelector("#dragging1")
    .append(document.getElementById("dragging1_border"));
export const rp2SetPos = (x, y) => {
    dotState.pos = [x, y];
    dotState.render(false);
};
