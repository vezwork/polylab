import { clamp, log } from "../../../lib/math/Number.js";
import { BaseExpNumerals, bigNumberToRadixNumber, changeTrailingZeroesIntoBaseExponent, displayRadixNumeralsBase10OrLess, } from "./numerals.js";
let BASE = 10;
window.setBase = (b) => (BASE = b);
let SPACING = 40;
window.setSpacing = (n) => (SPACING = n);
const SVG_WIDTH_SCALE = 0.8;
function makeDraggable(state, el) {
    const evCache = [];
    let prevDiff = -1;
    function removeEvent(ev) {
        // Remove this event from the target's cache
        const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId);
        evCache.splice(index, 1);
    }
    // from https://www.redblobgames.com/making-of/draggable/
    // modified to use https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        //if (event.target instanceof SVGTextElement) return;
        let { x, y } = state.eventToCoordinates(event);
        state.dragging = { dx: state.pos - x };
        el.classList.add("dragging");
        el.setPointerCapture(event.pointerId);
        //multitouch
        evCache.push(event);
    }
    function end(ev) {
        state.dragging = null;
        el.classList.remove("dragging");
        //multitouch
        removeEvent(ev);
        // If the number of pointers down is less than two then reset diff tracker
        if (evCache.length < 2) {
            prevDiff = -1;
        }
    }
    function move(ev) {
        //multitouch
        // Find this event in the cache and update its record with this event
        const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId);
        evCache[index] = ev;
        // If two pointers are down, check for pinch gestures
        if (evCache.length === 2) {
            // Calculate the distance between the two pointers
            const curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);
            if (prevDiff > 0) {
                const diff = curDiff - prevDiff;
                zoom *= 1.01 ** diff;
            }
            // Cache the distance for the next move event
            prevDiff = curDiff;
            return;
        }
        //single touch
        if (!state.dragging)
            return;
        ev.preventDefault();
        let { x, y } = state.eventToCoordinates(ev);
        state.pos = x + state.dragging.dx;
    }
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointermove", move);
    el.addEventListener("touchstart", (e) => e.preventDefault());
}
export const lines = document.querySelectorAll("#dragging0 .line");
const svg = document.querySelector("#dragging0");
const createLine = () => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("line");
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", "0");
    l.setAttribute("y1", "-10");
    l.setAttribute("x2", "0");
    l.setAttribute("y2", "10");
    l.setAttribute("stroke", "black");
    l.setAttribute("stroke-width", "1");
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", "0");
    t.setAttribute("y", "0");
    t.setAttribute("text-anchor", "middle");
    g.append(l, t);
    svg.prepend(g);
    return g;
};
// caches lines into a pool. If there is an existing line that is unused,
// reuse it to render something new, otherwise create a new line.
// Usage of this results in there being a fixed number of line elements being created
// in the beginning moments of zooming
const getLine = (i) => {
    const lines = document.querySelectorAll("#dragging0 .line");
    const line = lines[i];
    if (line)
        return line;
    else
        return createLine();
};
let zoom = 1;
svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.ctrlKey) {
        // for some reason this is pinch-zoom?
        zoom *= Math.exp(-e.deltaY / 100);
    }
    else {
        zoom *= Math.exp(-e.deltaY / 600);
    }
});
const keysDown = {};
svg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown") {
        e.preventDefault();
    }
    keysDown[e.key] = true;
});
svg.addEventListener("keyup", (e) => {
    keysDown[e.key] = false;
});
function draw() {
    //console.log(keysDown);
    if (keysDown["ArrowLeft"])
        state._pos += 1.5 / zoom;
    if (keysDown["ArrowRight"])
        state._pos -= 1.5 / zoom;
    if (keysDown["ArrowUp"])
        zoom *= Math.exp(1 / 100);
    if (keysDown["ArrowDown"])
        zoom *= Math.exp(-1 / 100);
    // seems to result in better performance than rendering in the input handlers
    requestAnimationFrame(draw);
    state.render();
}
requestAnimationFrame(draw);
let state = {
    eventToCoordinates(event) {
        return { x: event.clientX / zoom, y: event.clientY };
    },
    dragging: null,
    // my coordinates are messed up, so this is the pos value for pi.
    // see the first line of `render()` to see why.
    _pos: -Math.PI * SPACING,
    get pos() {
        return this._pos;
    },
    set pos(x) {
        this._pos = x;
        //this.render();
    },
    render() {
        // scale and negate pos so dragging is in the right direction and not too fast.
        const x = -this._pos / SPACING;
        // NUM, ZOOM, LAYOUT CALC
        const halfWidth = (svg.clientWidth * SVG_WIDTH_SCALE) / 2;
        const halfWidthPerNum = halfWidth / (SPACING * zoom);
        const zoomBaseExponent = log(zoom, BASE);
        const baseExponent = -Math.ceil(zoomBaseExponent);
        const numTickGap = BASE ** baseExponent;
        const startInGapBase = BigInt(Math.round(x / numTickGap));
        const startX = Math.round(x / numTickGap) * numTickGap;
        // SVG INSERTION
        let linei = 0;
        svg.style.border = "none";
        document.getElementById("position_num").textContent = x.toFixed(Math.max(0, -baseExponent));
        // Start in the middle and render out to the right:
        let numInGapBase = startInGapBase;
        let num = startX; // num = numInGapBase * BigInt(gap);
        while (num < x + halfWidthPerNum) {
            renderNumberTick(num, BaseExpNumerals(numInGapBase, BASE, baseExponent));
            numInGapBase++;
            let prevNum = num;
            num += numTickGap;
            if (num === prevNum) {
                svg.style.border = "1px solid red";
                throw "Floating Point Error!";
            }
        }
        // Start one unit left from the middle and render out to the left:
        numInGapBase = startInGapBase - 1n;
        num = startX - numTickGap; // num = numInGapBase * BigInt(gap);
        while (num > x - halfWidthPerNum) {
            renderNumberTick(num, BaseExpNumerals(numInGapBase, BASE, baseExponent));
            numInGapBase--;
            let prevNum = num;
            num -= numTickGap;
            if (num === prevNum) {
                svg.style.border = "1px solid red";
                throw "Floating Point Error!";
            }
        }
        function numberTickX(n) {
            return (n - x) * SPACING * zoom;
        }
        function renderNumberTick(n, big) {
            const radixNum = bigNumberToRadixNumber(big);
            const display = displayRadixNumeralsBase10OrLess(radixNum);
            const pos = numberTickX(n);
            const scale = big.sign === 0n
                ? 1.5
                : clamp(0, 1 +
                    zoomBaseExponent +
                    Number(changeTrailingZeroesIntoBaseExponent(big).baseExponent), 1.5);
            const line = getLine(linei);
            line?.setAttribute("transform", `translate(${pos.toFixed(3)} 0) scale(${scale})`);
            line.querySelector("text").textContent = display;
            const TEXT_HEIGHT = 23; // manually checked this for 16px font
            // make numbers with longer representations smaller, but not too small
            const NOT_TOO_SMALL = 1 / 3;
            const textScale = (1 / display.length) ** NOT_TOO_SMALL;
            let textSize = TEXT_HEIGHT * textScale;
            const textY = 16 + textSize / 2;
            line
                .querySelector("text")
                .setAttribute("transform", `translate(0 ${textY}) scale(${textScale})`);
            linei++;
        }
        // HIDE UNUSED SVG ELEMENTS
        const lines = document.querySelectorAll("#dragging0 .line");
        for (linei; linei < lines.length; linei++) {
            const line = lines[linei];
            // translating out of view should be performant than actually hiding them?
            line?.setAttribute("transform", `translate(60000)`);
        }
    },
};
makeDraggable(state, document.querySelector("#dragging0"));
// make number line viewbox based on window width
// so the number line doesn't get too small on mobile
const el = document.querySelector("#dragging0");
const onSize = () => {
    el?.setAttribute("viewBox", `${(-el.clientWidth * SVG_WIDTH_SCALE) / 2} -27 ${el.clientWidth * SVG_WIDTH_SCALE} 80`);
};
window.addEventListener("resize", onSize);
onSize();
