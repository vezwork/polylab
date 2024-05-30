import { sub } from "../../../lib/math/Vec2.js";
// from https://www.redblobgames.com/making-of/draggable/
// modified to use https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
// modified to pass diffs
export function makeDraggable(el, eventToCoordinates, onMove = ([x, y]) => { }, onZoom = (n) => { }) {
    const evCache = [];
    let prevDiff = -1;
    let pos = [0, 0];
    let dragging = null;
    function removeEvent(ev) {
        // Remove this event from the target's cache
        const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === ev.pointerId);
        evCache.splice(index, 1);
    }
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        let { x, y } = eventToCoordinates(event);
        dragging = [pos[0] - x, pos[1] - y];
        el.classList.add("dragging");
        el.setPointerCapture(event.pointerId);
        //multitouch
        evCache.push(event);
    }
    function end(ev) {
        dragging = null;
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
                onZoom(diff * 10);
            }
            // Cache the distance for the next move event
            prevDiff = curDiff;
            return;
        }
        if (dragging === null)
            return;
        let { x, y } = eventToCoordinates(ev);
        ev.preventDefault();
        const newPos = [x + dragging[0], y + dragging[1]];
        const diff = sub(newPos, pos);
        pos = newPos;
        onMove(diff);
    }
    function wheel(e) {
        e.preventDefault();
        if (e.ctrlKey) {
            // for some reason this is pinch-zoom?
            onZoom(-e.deltaY * 6);
        }
        else {
            onZoom(-e.deltaY);
        }
    }
    const keysDown = {};
    function keydown(e) {
        if (e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowDown") {
            e.preventDefault();
        }
        keysDown[e.key] = true;
    }
    function keyup(e) {
        keysDown[e.key] = false;
    }
    function arrowKeyAnimationFrame() {
        // seems to result in better performance than rendering in the input handlers
        requestAnimationFrame(arrowKeyAnimationFrame);
        if (keysDown["ArrowLeft"])
            onMove([1.5, 0]);
        if (keysDown["ArrowRight"])
            onMove([-1.5, 0]);
        if (keysDown["ArrowUp"])
            onZoom(1);
        if (keysDown["ArrowDown"])
            onZoom(-1);
    }
    requestAnimationFrame(arrowKeyAnimationFrame);
    el.addEventListener("keydown", keydown);
    el.addEventListener("keyup", keyup);
    el.addEventListener("wheel", wheel);
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointermove", move);
    el.addEventListener("touchstart", (e) => e.preventDefault());
}
