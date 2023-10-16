import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { map } from "../../../lib/structure/Iterable.js";
import { drawScene, drawSelectedCaretHost } from "./draw.js";
import { closestTo, thru, to } from "./geom.js";
import { caretDel, caretIns, getCarets, moveCaret, newCaret, redo, undo, } from "./manager.js";
import { getHosts, ins } from "./state.js";
// state setup
const ref = ins("y")();
const car = newCaret(ref);
const anchor = newCaret(ref);
// input listeners
addEventListener("mousedown", (e) => {
    const nextFocus = closestTo(e.x * window.devicePixelRatio);
    newCaret(nextFocus);
    if (nextFocus) {
        moveCaret(car)(nextFocus);
        moveCaret(anchor)(car.at);
    }
});
addEventListener("mousemove", (e) => {
    if (e.buttons === 1) {
        //const closest = closestTo(e.x * window.devicePixelRatio);
        //if (closest && closest !== state.cur) return moveCaretSelecting(closest);
    }
});
addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
        const next = to(getHosts(), car.at, e.key, null, true) ?? car.at;
        if (e.shiftKey) {
            moveCaret(car)(next);
        }
        else {
            moveCaret(car)(next);
            moveCaret(anchor)(car.at);
        }
    }
    if (e.key === "z" && e.metaKey && e.shiftKey)
        return redo();
    if (e.key === "z" && e.metaKey)
        return undo();
    if (e.key === "Backspace") {
        if ([...thru(anchor.at, car.at)].length > 0) {
        }
        else {
            caretDel(car);
            moveCaret(anchor)(car.at); // hmmmmmmmmm
        }
    }
    if (e.key.length === 1) {
        if ([...thru(anchor.at, car.at)].length > 0) {
        }
        else {
            caretIns(car)(e.key);
            moveCaret(anchor)(car.at); // hmmmmmmmmm
        }
    }
    //if (myCaret.cur) {}
    //return Δap(insertΔ({ newCur: charToCaretHost(e.key), caret: myCaret }));
});
// render
const ctx = setupFullscreenCanvas("c");
function anim() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const _ of map(thru(anchor.at, car.at), drawSelectedCaretHost(ctx)))
        ;
    drawScene(ctx)([...getCarets()], getHosts());
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
