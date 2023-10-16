import { makeNestedCaretFunctions } from "../../../lib/caret/nestedCaret.js";
import { centerBesideD, justBesideD, textD, translateD, justOverD, transformD, draw, caretable, drawables, getBounds, lineD, } from "../../../lib/draw/draw4.js";
import { scale, translation, _ } from "../../../lib/math/CtxTransform.js";
import { makeTreeFunctions } from "../../../lib/structure/tree.js";
import { drawBoundRight, drawLineBetweenBoundRights, drawNestedCaretLines, } from "../../../lib/draw/draw4Debug.js";
import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { first } from "../../../lib/structure/Iterable.js";
import { onArrowKeyDown, onKeyDown } from "../../../lib/input/onKeyDown.js";
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
const ntD = (text, size = 40) => textD(...measureWidth(text, size));
const tD = (text, size = 40) => caretable(centerBesideD(caretable(textD("", size, 1, size)), ...text
    .split("")
    .map((char) => caretable(textD(...measureWidth(char, size))))));
// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
// https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
const measureWidth = (text, size) => {
    ctx.textBaseline = "alphabetic";
    ctx.font = `${size}px monospace`;
    const measure = ctx.measureText(text);
    return [text, size, measure.width + 4, measure.fontBoundingBoxAscent];
};
const canvasRender = draw(ctx);
// let mouse: Vec2 = [-1, -1];
// c.addEventListener("mousemove", (e) => {
//   mouse = [e.offsetX * dpr, e.offsetY * dpr];
// });
const { parent, children, descendentsBreadthFirst: des, hasChildren, nodeAndAncestors, rootIndexPath, applyRootIndexPath, } = makeTreeFunctions({
    parent: (e) => e.parent,
    children: (e) => e.children,
}).filteredTree((e) => e.caretable === true);
let carryX = null;
const { next, lines } = makeNestedCaretFunctions({
    getBounds,
    getCarryX: () => carryX,
    setCarryX: () => (newCarryX) => (carryX = newCarryX),
    parent,
    children,
});
const linesFromChildren = (t) => lines(children(t));
const main = caretable(drawables(justOverD(tD("A Caret for your thoughts", 100), justBesideD(tD("Adapting Caret (", 50), tD(") Navigation to Visual Editors", 50)))));
const rend = canvasRender(main);
const goToPath = applyRootIndexPath(rend);
let curFocus = first(children(rend));
onArrowKeyDown((key) => {
    const nextFocus = next(curFocus, key);
    if (nextFocus)
        curFocus = nextFocus;
    console.log("path address system works", goToPath(rootIndexPath(curFocus)) === curFocus);
});
let drawSinks = false;
let drawLineOutlines = false;
let drawAboveAndBelow = false;
let drawBlueLines = false;
onKeyDown("a")(() => (drawSinks = !drawSinks));
onKeyDown("s")(() => (drawLineOutlines = !drawLineOutlines));
onKeyDown("d")(() => (drawBlueLines = !drawBlueLines));
onKeyDown("f")(() => (drawAboveAndBelow = !drawAboveAndBelow));
const offset = [200, 400];
const yLineD = lineD([
    [0, 0],
    [0, 1],
]);
function anim() {
    ctx.clearRect(0, 0, c.width, c.height);
    if (drawBlueLines) {
        ctx.fillStyle = "blue";
        canvasRender(translateD([c.width - 1050, c.height - 150])(ntD("Nesting", 150)));
    }
    if (drawLineOutlines) {
        ctx.fillStyle = "blue";
        canvasRender(translateD([c.width - 1050, c.height - 350])(ntD("Lines", 150)));
    }
    if (drawSinks) {
        ctx.fillStyle = "green";
        canvasRender(translateD([c.width - 1050, c.height - 550])(ntD("Caret Sinks", 150)));
    }
    if (drawAboveAndBelow) {
        ctx.fillStyle = "red";
        canvasRender(translateD([c.width - 1050, c.height - 750])(ntD("Above/", 150)));
        ctx.fillStyle = "purple";
        canvasRender(translateD([c.width - 520, c.height - 750])(ntD("Below", 150)));
    }
    ctx.fillStyle = "black";
    ctx.translate(...offset);
    if (drawSinks)
        for (const t of des(rend))
            drawBoundRight(ctx, t);
    if (drawAboveAndBelow) {
        const nexter = next(curFocus, "ArrowUp");
        if (nexter)
            drawLineBetweenBoundRights(ctx, curFocus, nexter, "red");
        const belower = next(curFocus, "ArrowDown");
        if (belower)
            drawLineBetweenBoundRights(ctx, belower, curFocus, "purple");
    }
    if (drawBlueLines)
        drawNestedCaretLines(ctx, linesFromChildren, hasChildren, rend);
    if (drawLineOutlines)
        drawNestedCaretLines(ctx, linesFromChildren, hasChildren, parent(curFocus) ?? rend, 1);
    ctx.resetTransform();
    ctx.strokeStyle = "black";
    const { x, y, width, height } = getBounds(curFocus);
    const caretTransform = _(scale([height, height]))(translation([x - 4 + width, y - 4]));
    canvasRender(translateD(offset)(main));
    canvasRender(translateD(offset)(transformD(caretTransform)(yLineD)));
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
