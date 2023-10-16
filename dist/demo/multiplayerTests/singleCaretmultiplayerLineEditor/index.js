import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { makeCaretFunctions } from "../../../lib/caret/caret.js";
import { some } from "../../../lib/structure/Iterable.js";
import { not } from "../../../lib/structure/Functions.js";
const ws = new WebSocket("ws://localhost:8000");
ws.addEventListener("open", () => {
    console.log("open!");
});
ws.addEventListener("message", (e) => {
    const { data } = e;
    const op = JSON.parse(data);
    networkΔap(op);
});
// send events
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
const eΔ = {
    forward: { function: "noop", args: [] },
    backward: { function: "noop", args: [] },
};
const initCaret = { size: 10, char: "" };
let state = {
    cur: initCaret,
    anchor: null,
    tow: null,
    hosts: [
        initCaret,
        { size: 30, char: "a" },
        { size: 30, char: "b" },
        { size: 30, char: "b" },
    ],
};
let historyHead = {
    next: null,
    prev: null,
    data: eΔ,
};
const networkΔap = (op) => {
    // @ts-ignore
    const change = Δregistry[op.function](...op.args)(state);
    if (change !== undefined) {
        state = change;
    }
};
const Δap = (d) => {
    // @ts-ignore
    const change = Δregistry[d.forward.function](...d.forward.args)(state);
    if (change !== undefined) {
        state = change;
        historyHead = insertAfter(historyHead)(d);
    }
    ws.send(JSON.stringify(d.forward));
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
const redo = () => {
    if (historyHead.next) {
        const d = historyHead.next.data;
        // @ts-ignore
        const change = Δregistry[d.forward.function](...d.forward.args)(state);
        if (change !== undefined) {
            state = change;
        }
        historyHead = historyHead.next;
        ws.send(JSON.stringify(d.forward));
    }
};
const undo = () => {
    if (historyHead.prev) {
        const d = historyHead.data;
        // @ts-ignore
        const change = Δregistry[d.backward.function](...d.backward.args)(state);
        if (change !== undefined) {
            state = change;
        }
        historyHead = historyHead.prev;
        ws.send(JSON.stringify(d.backward));
    }
};
const reverseDir = (dir) => {
    if (dir === "ArrowDown")
        return "ArrowUp";
    if (dir === "ArrowUp")
        return "ArrowDown";
    if (dir === "ArrowLeft")
        return "ArrowRight";
    if (dir === "ArrowRight")
        return "ArrowLeft";
    return "ArrowLeft";
};
const moveCaretΔ = (dir) => {
    const selection = [...traverseHosts(state)];
    const isAnchorBeforeTow = orderOfCaretHosts(state.anchor, state.tow);
    return {
        forward: { function: "moveCaret", args: [{ dir }] },
        backward: {
            function: "unMoveCaret",
            args: [{ dir: reverseDir(dir), selection, isAnchorBeforeTow }],
        },
    };
};
const moveCaret = ({ dir }) => (s) => {
    if (s.cur) {
        const next = to(s.hosts, s.cur, dir, null, true);
        return { ...s, cur: next, anchor: next, tow: null };
    }
};
const unMoveCaret = ({ dir, selection, isAnchorBeforeTow, }) => (s) => {
    if (s.cur) {
        if (selection.length > 0) {
            const anchor = (isAnchorBeforeTow
                ? s.hosts[s.hosts.indexOf(selection.at(0)) - 1]
                : selection.at(-1)) ?? null;
            const tow = (isAnchorBeforeTow
                ? selection.at(-1)
                : s.hosts[s.hosts.indexOf(selection.at(0)) - 1]) ?? null;
            return {
                ...s,
                cur: tow,
                anchor,
                tow,
            };
        }
        else {
            const next = to(s.hosts, s.cur, dir, null, true);
            return { ...s, cur: next, anchor: next, tow: null };
        }
    }
};
const moveCaretSelectingΔ = (dir) => ({
    forward: { function: "moveCaretSelecting", args: [dir] },
    backward: { function: "moveCaretSelecting", args: [reverseDir(dir)] },
});
const moveCaretSelecting = (dir) => (s) => {
    if (s.cur) {
        const next = to(s.hosts, s.cur, dir, null, true);
        const anchor = s.anchor ?? next;
        return {
            ...s,
            cur: next,
            anchor: anchor,
            tow: next === anchor ? null : next,
        };
    }
};
// note: originally had parts of this as separate command (e.g. "deleteSelection") but this
// is not good because the user action should depend on the state. General takeaway is group
// changes into commands based on what the user would view as the command. If some commands
// do related things, abstract that in the function layer not the command layer.
const backspaceΔ = () => {
    const isAnchorBeforeTow = orderOfCaretHosts(state.anchor, state.tow);
    const selection = [...traverseHosts(state)];
    const cur = state.cur;
    return {
        forward: { function: "backspace", args: [] },
        backward: {
            function: "unbackspace",
            args: [{ isAnchorBeforeTow, selection, cur }],
        },
    };
};
const backspace = () => (s) => {
    if (state.hosts.indexOf(s.tow) !== -1)
        return deleteSelection(s);
    else
        return backspaceNoSelection(s);
};
const deleteSelection = (s) => ({
    ...s,
    hosts: s.hosts.filter(not(isSelected)),
    anchor: null,
    tow: null,
    cur: orderedSelectors(s)?.[0] ?? null,
});
const unbackspace = ({ isAnchorBeforeTow, selection, cur, }) => (s) => {
    if (selection.length > 0) {
        const newS = insert(...selection)(s);
        const anchor = (isAnchorBeforeTow
            ? newS.hosts[newS.hosts.indexOf(selection.at(0)) - 1]
            : selection.at(-1)) ?? null;
        const tow = (isAnchorBeforeTow
            ? selection.at(-1)
            : newS.hosts[newS.hosts.indexOf(selection.at(0)) - 1]) ?? null;
        return {
            ...newS,
            cur: tow,
            anchor,
            tow,
        };
    }
    else {
        return insert(cur)(s);
    }
};
const insertΔ = (newCur) => {
    const isAnchorBeforeTow = orderOfCaretHosts(state.anchor, state.tow);
    const selection = [...traverseHosts(state)];
    return {
        forward: { function: "insert", args: [newCur] },
        backward: {
            function: "uninsert",
            args: [{ isAnchorBeforeTow, selection }],
        },
    };
};
const uninsert = ({ selection, isAnchorBeforeTow, }) => (s) => {
    const newS = backspace()(s) ?? s;
    if (selection.length > 0) {
        const newS2 = selection.length > 0 ? insert(...selection)(newS) : newS;
        const anchor = (isAnchorBeforeTow
            ? newS2.hosts[newS2.hosts.indexOf(selection.at(0)) - 1]
            : selection.at(-1)) ?? null;
        const tow = (isAnchorBeforeTow
            ? selection.at(-1)
            : newS2.hosts[newS2.hosts.indexOf(selection.at(0)) - 1]) ?? null;
        return {
            ...newS2,
            cur: tow,
            anchor,
            tow,
        };
    }
    else {
        return newS;
    }
    //insert and select and delete cur
};
const backspaceNoSelection = (s) => {
    const newHosts = [...s.hosts];
    const index = newHosts.indexOf(s.cur);
    if (index === 0 || index === -1)
        return; //hack so that initial thing cannot be deleted
    newHosts.splice(index, 1);
    return {
        ...s,
        hosts: newHosts,
        anchor: null,
        tow: null,
        cur: s.hosts[index - 1],
    };
};
const charToCaretHost = (char) => ({ size: 30, char });
const insert = (...newCurs) => (s1) => {
    const s = s1.tow ? deleteSelection(s1) : s1;
    const newHosts = [...s.hosts];
    const spliceIndex = newHosts.indexOf(s.cur) + 1;
    newHosts.splice(spliceIndex, 0, ...newCurs);
    return {
        ...s,
        hosts: newHosts,
        anchor: newCurs.at(-1) ?? null,
        tow: null,
        cur: newCurs.at(-1) ?? null,
    };
};
const noop = () => (s) => s;
const Δregistry = {
    noop,
    moveCaret,
    moveCaretSelecting,
    insert,
    uninsert,
    backspace,
    unbackspace,
    unMoveCaret,
};
/**
 * SPATIAL MATH AND CARET
 */
const LEFT = 20;
const TOP = 20;
const MARGIN = 20;
const getBounds = (c) => {
    const offset = state.hosts
        .slice(0, state.hosts.indexOf(c))
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
//  - spatially defined delta
// - [x] find a better way to ensure history entries are immutable
// - [x] selection
//   - [x] port selection
//   - [x] input during selection
// - multiplayer
//   - [x] change history for full momento memory to storing inverse change for undo later
//   - seperate cursors for each person
// PUT OFF:
// - nesting
// - lines
// - serializable history?
// - represent hosts as a doubly linked list (no abstraction pls) instead of array
// - multicursor
/**
 * INPUT!
 */
addEventListener("mousedown", (e) => {
    const nextFocus = closestTo(e.x * window.devicePixelRatio)(state);
    //if (nextFocus) Δap(moveCaretΔ());
});
addEventListener("mousemove", (e) => {
    if (e.buttons === 1) {
        const closest = closestTo(e.x * window.devicePixelRatio)(state);
        //if (closest && closest !== state.cur) return moveCaretSelecting(closest);
    }
});
addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
        if (e.shiftKey)
            Δap(moveCaretSelectingΔ(e.key));
        else
            Δap(moveCaretΔ(e.key));
    }
    if (e.key === "z" && e.metaKey && e.shiftKey)
        return redo();
    if (e.key === "z" && e.metaKey)
        return undo();
    if (e.key === "Backspace")
        return Δap(backspaceΔ());
    if (e.key.length === 1)
        if (state.cur)
            return Δap(insertΔ(charToCaretHost(e.key)));
});
/**
 * DRAW!
 */
const drawSelectedCaretHost = (ctx) => (c) => {
    const { top, right, bottom, left } = getBounds(c);
    ctx.fillRect(left, top, right - left, bottom - top);
};
const drawCaretHost = (ctx) => (c) => {
    const { top, right, bottom, left } = getBounds(c);
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();
    ctx.font = "20px sans-serif";
    ctx.fillText(c.char, left + 10, top + 20);
};
function anim() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    const { hosts, cur } = state;
    ctx.fillStyle = "yellow";
    hosts.filter(isSelected).map(drawSelectedCaretHost(ctx));
    ctx.fillStyle = "black";
    hosts.map(drawCaretHost(ctx));
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
const orderOfCaretHosts = (a, b) => state.hosts.indexOf(a) < state.hosts.indexOf(b);
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
        let cur = state.tow;
        while (cur !== null) {
            const next = to(state.hosts, cur, "ArrowRight", null, true);
            if (next === cur)
                break;
            if (next === null)
                break;
            cur = next;
            yield cur;
            if (cur === state.anchor) {
                break;
            }
        }
    }
}
const isSelected = (host) => some(traverseHosts(state), (h) => h === host);
// history sketch
// Δ+a Δ+b Δ+c Δ+a Δ< Δ>
// Δ> Δ< = _
// ΔselectN ΔselectM = ΔselectNM
// how to compose events?
// - matcher: Δselect_ Δselect_ => new select
//  - default: any any => do a then b
// dependent changes vs overwrites
