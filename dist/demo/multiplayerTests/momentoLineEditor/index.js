import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { makeCaretFunctions } from "../../../lib/caret/caret.js";
import { some } from "../../../lib/structure/Iterable.js";
import { not } from "../../../lib/structure/Functions.js";
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
const initCaret = { size: 10, char: "" };
let historyFocus = {
    data: {
        cur: initCaret,
        anchor: null,
        tow: null,
        hosts: [initCaret, { size: 30, char: "b" }, { size: 30, char: "c" }],
    },
    next: null,
    prev: null,
};
const replace = (node) => (data) => {
    const newNode = {
        next: null,
        prev: node?.prev ?? null,
        data,
    };
    if (node?.prev?.next)
        node.prev.next = newNode;
    return newNode;
};
const insertAfter = (after) => (data) => {
    const newNode = {
        next: null,
        prev: after,
        data,
    };
    if (after)
        after.next = newNode;
    return newNode;
};
/**
 * SPATIAL MATH AND CARET
 */
const LEFT = 20;
const TOP = 20;
const MARGIN = 20;
const getBounds = (c) => {
    const offset = historyFocus.data.hosts
        .slice(0, historyFocus.data.hosts.indexOf(c))
        .reduce((prev, cur) => prev + MARGIN + cur.size, LEFT);
    return {
        top: TOP,
        left: offset,
        right: offset + c.size,
        bottom: TOP + c.size,
    };
};
const closestTo = (x) => (data) => data.hosts
    .map((host) => ({ host, bounds: getBounds(host) }))
    .sort((h1, h2) => Math.abs(x - h1.bounds.right) - Math.abs(x - h2.bounds.right))[0].host;
const { to } = makeCaretFunctions({
    getBounds,
});
// TODO BASIC:
// - [x] history redo
// - [x] don't lose cur when backspace first char
// - [x] clicking on characters to focus them
// - [x] find a better way to ensure history entries are immutable
// - [x] selection
//   - [x] port selection
//   - [x] input during selection
// - multiplayer
//   - change history for full momento memory to storing inverse change for undo later
// PUT OFF:
// - nesting
// - lines
// - serializable history?
// - represent hosts as a doubly linked list (no abstraction pls) instead of array
// - multicursor
/**
 * HISTORY!
 */
const moveCaret = (next) => {
    historyFocus = replace(historyFocus)({
        ...historyFocus.data,
        cur: next,
        anchor: next,
        tow: null,
    });
};
const moveCaretSelecting = (next) => {
    historyFocus = replace(historyFocus)({
        ...historyFocus.data,
        anchor: historyFocus.data.anchor ?? next,
        tow: next,
        cur: next,
    });
};
const deleteSelection = () => {
    historyFocus = insertAfter(historyFocus)({
        hosts: historyFocus.data.hosts.filter(not(isSelected)),
        anchor: null,
        tow: null,
        cur: orderedSelectors(historyFocus.data)?.[0] ?? null,
    });
};
const backspaceNoSelection = () => {
    const newHosts = [...historyFocus.data.hosts];
    const index = newHosts.indexOf(historyFocus.data.cur);
    if (index === 0 || index === -1)
        return; //hack so that initial thing cannot be deleted
    newHosts.splice(index, 1);
    historyFocus = insertAfter(historyFocus)({
        hosts: newHosts,
        anchor: null,
        tow: null,
        cur: historyFocus.data.hosts[index - 1],
    });
};
const backspace = () => {
    if (historyFocus.data.anchor)
        deleteSelection();
    else
        backspaceNoSelection();
};
const noop = () => {
    historyFocus = insertAfter(historyFocus)({
        //clone it to replace ontop of
        ...historyFocus.data,
    });
};
const insert = (char) => {
    if (historyFocus.data.tow)
        deleteSelection();
    else
        noop();
    const newHosts = [...historyFocus.data.hosts];
    const newCur = {
        size: 30,
        char,
    };
    const spliceIndex = newHosts.indexOf(historyFocus.data.cur) + 1;
    newHosts.splice(spliceIndex, 0, newCur);
    historyFocus = replace(historyFocus)({
        hosts: newHosts,
        anchor: newCur,
        tow: null,
        cur: newCur,
    });
};
const redo = () => historyFocus.next ? (historyFocus = historyFocus.next) : undefined;
const undo = () => historyFocus.prev ? (historyFocus = historyFocus.prev) : undefined;
/**
 * INPUT!
 */
addEventListener("mousedown", (e) => {
    const nextFocus = closestTo(e.x * window.devicePixelRatio)(historyFocus.data);
    if (nextFocus)
        moveCaret(nextFocus);
});
addEventListener("mousemove", (e) => {
    if (e.buttons === 1) {
        const closest = closestTo(e.x * window.devicePixelRatio)(historyFocus.data);
        if (closest)
            return moveCaretSelecting(closest);
    }
});
addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
        if (historyFocus.data.cur) {
            const nextFocus = to(historyFocus.data.hosts, historyFocus.data.cur, e.key, null, true);
            if (e.shiftKey)
                moveCaretSelecting(nextFocus);
            else
                moveCaret(nextFocus);
        }
    }
    if (e.key === "z" && e.metaKey && e.shiftKey)
        return redo();
    if (e.key === "z" && e.metaKey)
        return undo();
    if (e.key === "Backspace")
        return backspace();
    if (e.key.length === 1)
        if (historyFocus.data.cur)
            return insert(e.key);
});
/**
 * DRAW!
 */
const drawCaretHost = (ctx) => (c) => {
    const { top, right, bottom, left } = getBounds(c);
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.stroke();
    ctx.font = "20px sans-serif";
    ctx.fillText(c.char, left + 10, top + 20);
};
function anim() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    const { hosts, cur } = historyFocus.data;
    hosts.map(drawCaretHost(ctx));
    ctx.strokeStyle = "YellowGreen";
    hosts.filter(isSelected).map(drawCaretHost(ctx));
    ctx.strokeStyle = "red";
    if (cur)
        ctx.strokeRect(getBounds(cur).right, getBounds(cur).top, 3, cur.size);
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
/**
 * SELECTION!
 */
// when selection changes the old SELECTION span is cleared and the new one is highlighted
// function clearSelection()
const orderOfCaretHosts = (a, b) => historyFocus.data.hosts.indexOf(a) < historyFocus.data.hosts.indexOf(b);
const orderedSelectors = (state) => !state.anchor || !state.tow
    ? null
    : state.hosts.indexOf(state.anchor) < state.hosts.indexOf(state.tow)
        ? [state.anchor, state.tow]
        : [state.tow, state.anchor];
function* traverseHosts(state) {
    if (state.anchor === null || state.tow === null)
        return;
    if (state.anchor === state.tow) {
        return;
    }
    if (orderOfCaretHosts(state.anchor, state.tow)) {
        let cur = state.anchor;
        while (cur !== null) {
            const next = to(state.hosts, cur, "ArrowRight", null, true);
            if (next === cur)
                break;
            if (next === null)
                break;
            cur = next;
            yield cur;
            if (cur === state.tow) {
                break;
            }
        }
    }
    else {
        let cur = state.anchor;
        while (cur !== null) {
            yield cur;
            const next = to(state.hosts, cur, "ArrowLeft", null, true);
            if (next === cur)
                break;
            if (next === null)
                break;
            cur = next;
            if (cur === state.tow) {
                break;
            }
        }
    }
}
const isSelected = (host) => some(traverseHosts(historyFocus.data), (h) => h === host);
// history sketch
// Δ+a Δ+b Δ+c Δ+a Δ< Δ>
// Δ> Δ< = _
// ΔselectN ΔselectM = ΔselectNM
// how to compose events?
// - matcher: Δselect_ Δselect_ => new select
//  - default: any any => do a then b
// dependent changes vs overwrites
