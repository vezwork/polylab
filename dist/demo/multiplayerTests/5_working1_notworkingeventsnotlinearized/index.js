import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { map } from "../../../lib/structure/Iterable.js";
import { apiCarets, apiDel, apiIns, apiMoveCaret, apiNewLineCaret, apiRequestState, ws, } from "./api.js";
import { getLineCarets } from "./caret.js";
import { drawScene, drawSelectedCaretHost } from "./draw.js";
import { closestTo, order, prev, thru, to } from "./geom.js";
import { historyGroup, redo, undo } from "./history.js";
import { getState, ins } from "./state.js";
// state setup
ws.addEventListener("open", () => {
    apiRequestState();
    const ref = ins("y")();
    let my = apiNewLineCaret(ref);
    ws.addEventListener("state", () => {
        my = apiNewLineCaret(getState()[0]);
    });
    // input listeners
    let cmd = "";
    addEventListener("mousedown", (e) => {
        const nextFocus = closestTo(e.x * window.devicePixelRatio);
        if (nextFocus) {
            apiMoveCaret(my.caret, nextFocus), apiMoveCaret(my.anchor, my.caret.at);
        }
        cmd = "🐭";
        requestAnimationFrame(anim);
    });
    addEventListener("mousemove", (e) => {
        if (e.buttons === 1) {
            //const closest = closestTo(e.x * window.devicePixelRatio);
            //if (closest && closest !== state.cur) return moveCaretSelecting(closest);
        }
    });
    addEventListener("keydown", (e) => {
        if (e.key.startsWith("Arrow")) {
            const next = to(getState(), my.caret.at, e.key, null, true) ?? my.caret.at;
            if (e.shiftKey) {
                cmd = "⇧" + e.key;
                apiMoveCaret(my.caret, next);
            }
            else {
                cmd = e.key;
                apiMoveCaret(my.caret, next), apiMoveCaret(my.anchor, my.caret.at);
            }
        }
        else if (e.key === "z" && e.metaKey && e.shiftKey) {
            cmd = "redo";
            redo();
        }
        else if (e.key === "z" && e.metaKey) {
            cmd = "undo";
            undo();
        }
        else if (e.key === "Backspace") {
            if ([...thru(my.anchor.at, my.caret.at)].length > 0) {
                cmd = "⌫Selection";
                const anch = my.anchor.at;
                const carat = my.caret.at;
                const [start] = order(my.anchor.at, my.caret.at);
                const dels = [
                    ...map(thru(my.anchor.at, my.caret.at), (cs) => apiDel(cs)),
                ];
                const move1 = apiMoveCaret(my.caret, start, carat);
                const move2 = apiMoveCaret(my.anchor, start, anch); // have to explicity pass "from" because caretDel moves it
                historyGroup(...dels, move1, move2);
            }
            else {
                cmd = "⌫";
                const from = my.caret.at;
                const to = prev(my.caret.at);
                if (to) {
                    historyGroup(apiDel(my.caret.at), apiMoveCaret(my.caret, to, from), apiMoveCaret(my.anchor, to, from));
                }
            }
        }
        else if (e.key.length === 1) {
            if ([...thru(my.anchor.at, my.caret.at)].length > 0) {
                cmd = "ins " + e.key + " over selection";
                const anch = my.anchor.at;
                const carat = my.caret.at;
                const [start] = order(my.anchor.at, my.caret.at);
                const dels = [
                    ...map(thru(my.anchor.at, my.caret.at), (cs) => apiDel(cs)),
                ];
                const { inserted, delta } = apiIns(start, e.key);
                const move1 = apiMoveCaret(my.caret, inserted, carat);
                const move2 = apiMoveCaret(my.anchor, inserted, anch); // have to explicity pass "from" because caretDel moves it
                historyGroup(...dels, delta, move1, move2);
            }
            else {
                cmd = "ins " + e.key;
                const { inserted, delta } = apiIns(my.caret.at, e.key);
                historyGroup(delta, apiMoveCaret(my.caret, inserted), apiMoveCaret(my.anchor, inserted));
            }
        }
        requestAnimationFrame(anim);
    });
    // render
    const bufferCanvas = document.createElement("canvas");
    function copyCanvasRegionToBuffer(canvas, x, y, w, h) {
        bufferCanvas.width = w;
        bufferCanvas.height = h;
        bufferCanvas.getContext("2d")?.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    }
    const ctx = setupFullscreenCanvas("c");
    ws.addEventListener("message", () => {
        cmd = "network";
        anim();
    });
    function anim() {
        copyCanvasRegionToBuffer(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(bufferCanvas, 0, 40);
        ctx.font = "26px sans-serif";
        ctx.fillStyle = "black";
        ctx.fillText(cmd, ctx.canvas.width - 160, 40);
        for (const { caret, anchor } of getLineCarets()) {
            for (const _ of map(thru(anchor.at, caret.at), drawSelectedCaretHost(ctx, caret.color)))
                ;
        }
        drawScene(ctx)([...apiCarets()], getState());
        //requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
});
