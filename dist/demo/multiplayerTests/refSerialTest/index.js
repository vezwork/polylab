import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { makeCaretFunctions } from "../../../lib/caret/caret.js";
import { some } from "../../../lib/structure/Iterable.js";
import { not } from "../../../lib/structure/Functions.js";
const isObject = (v) => typeof v === "object" && v !== null;
class Ref {
    to;
    constructor(to) {
        this.to = to;
    }
    toJSON() {
        return { isRef: state.hosts.indexOf(this.to) };
    }
    static fromJSON(key, value) {
        if (isObject(value) && "isRef" in value)
            return new Ref(state.hosts[value.isRef]);
    }
}
const parse = (data) => JSON.parse(data, (key, value) => {
    const refFrom = Ref.fromJSON(key, value);
    if (refFrom !== undefined)
        return refFrom;
    return value;
});
const ws = new WebSocket("ws://localhost:8000");
ws.addEventListener("open", () => {
    console.log("open!2");
});
ws.addEventListener("message", (e) => {
    const { data } = e;
    const { op, id } = parse(data);
    const parsedOp = parse(op);
    console.log("received op", op);
    networkΔap(parsedOp);
});
// send events
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
const eΔ = {
    forward: { function: "noop", args: [] },
    backward: { function: "noop", args: [] },
};
const initCaret = { size: 10, char: "" };
const myCaret = {
    cur: 0,
    anchor: 0,
};
let state = {
    carets: new Set([myCaret]),
    hosts: [
        initCaret,
        { size: 30, char: "a" },
        { size: 30, char: "b" },
        { size: 30, char: "b" },
    ],
};
// BAD VIBES:
// - carets being mutable always
// - no distinction between carets and references (for uninsert)
// - too much duplicated functionality in the function layer (should just be insert and delete?)
// - history items should just be grouped together inserts/deletes?
// - this way we just need it to work for insert, delete, and composition of those
console.log("parse stuff", JSON.stringify(new Ref(initCaret)), parse(JSON.stringify(new Ref(initCaret))));
let historyHead = {
    next: null,
    prev: null,
    data: eΔ,
};
const networkΔap = (op) => {
    Δregistry[op.function](...op.args)(state);
};
const OpAp = (op) => {
    ws.send(JSON.stringify(op));
    Δregistry[op.function](...op.args)(state);
};
const Δap = (d) => {
    OpAp(d.forward);
    historyHead = insertAfter(historyHead)(d);
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
        OpAp(d.forward);
        historyHead = historyHead.next;
    }
};
const undo = () => {
    if (historyHead.prev) {
        const d = historyHead.data;
        OpAp(d.backward);
        historyHead = historyHead.prev;
    }
};
const moveCaretOp = (arg) => ({ function: "moveCaret", args: [arg] });
const moveCaret = ({ dir, caret, }) => (s) => {
    const next = to(s.hosts, s.hosts[caret.cur], dir, null, true);
    if (next !== null)
        caret.cur = s.hosts.indexOf(next);
    caret.anchor = caret.cur;
};
const moveCaretSelectingOp = (arg) => ({ function: "moveCaretSelecting", args: [arg] });
const moveCaretSelecting = ({ dir, caret, }) => (s) => {
    const next = to(s.hosts, s.hosts[caret.cur], dir, null, true);
    if (next !== null)
        caret.cur = s.hosts.indexOf(next);
};
const backspaceΔ = (arg) => {
    const selection = [...traverseHosts(state, arg.caret)];
    const isAnchorBeforeCur = myCaret.anchor < myCaret.cur;
    return {
        forward: { function: "backspace", args: [arg] },
        backward: {
            function: "unbackspace",
            args: [
                {
                    isAnchorBeforeCur,
                    selection,
                    caret: arg.caret,
                },
            ],
        },
    };
};
const selectionOf = (caret) => [...traverseHosts(state, caret)];
const backspace = (arg) => (s) => {
    if (selectionOf(arg.caret).length > 0)
        deleteSelection(arg)(s);
    else
        backspaceNoSelection(arg)(s);
};
const deleteSelection = ({ caret }) => (s) => {
    s.hosts = s.hosts.filter(not(isSelectedBy(caret)));
    // TODO: Adjust ALL carets
    //
    // caret.cur.to = orderedSelectors(caret)(s)?.[0] ?? null;
    // caret.anchor = caret.cur;
    // caret.tow = null;
};
// const unbackspace =
//   ({
//     isAnchorBeforeCur,
//     selection,
//     cur,
//     caret,
//   }: {
//     isAnchorBeforeCur: boolean;
//     selection: CaretHost[];
//     cur: CaretHost;
//     caret: CaretData;
//   }) =>
//   (s: State): void => {
//     if (selection.length > 0) {
//       insert({ newCurs: selection, caret })(s);
//       const anchor =
//         (isAnchorBeforeCur
//           ? s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]
//           : selection.at(-1)) ?? null;
//       const tow =
//         (isAnchorBeforeCur
//           ? selection.at(-1)
//           : s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]) ?? null;
//       caret.cur = tow;
//       caret.anchor = anchor;
//       caret.tow = tow;
//     } else {
//       insert({ newCurs: [cur], caret })(s);
//     }
//   };
const insertΔ = ({ newCur, caret, }) => {
    const selection = [...traverseHosts(state, caret)];
    const isAnchorBeforeCur = caret.anchor < caret.cur;
    return {
        forward: { function: "insert", args: [{ newCur, caret }] },
        backward: {
            function: "uninsert",
            args: [{ isAnchorBeforeCur, selection, caret }],
        },
    };
};
// const uninsert =
//   ({
//     selection,
//     isAnchorBeforeCur,
//     newCur,
//     caret,
//   }: {
//     isAnchorBeforeCur: boolean;
//     selection: CaretHost[];
//     newCur: Ref;
//     caret: CaretData;
//   }) =>
//   (s: State): void => {
//     const newHosts = [...s.hosts];
//     const index = newHosts.indexOf(newCur.to);
//     if (index === 0 || index === -1) return; //hack so that initial thing cannot be deleted
//     newHosts.splice(index, 1);
//     s.hosts = newHosts;
//     caret.cur = index - 1;
//     caret.anchor = caret.cur;
//     if (selection.length > 0) {
//       insert({ newCurs: selection, caret })(s);
//       const anchor =
//         (isAnchorBeforeCur
//           ? s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]
//           : selection.at(-1)) ?? null;
//       const tow =
//         (isAnchorBeforeCur
//           ? selection.at(-1)
//           : s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]) ?? null;
//       caret.cur = tow;
//       caret.anchor = anchor;
//       caret.tow = tow;
//     }
//   };
const backspaceNoSelection = ({ caret }) => (s) => {
    const newHosts = [...s.hosts];
    if (caret.cur === 0)
        return; //hack so that initial thing cannot be deleted
    newHosts.splice(caret.cur, 1);
    // TODO: Adjust ALL carets
    s.hosts = newHosts;
    caret.cur = caret.cur - 1;
    caret.anchor = caret.cur;
};
const charToCaretHost = (char) => ({ size: 30, char });
const insert = ({ newCur, caret }) => (s) => {
    //if (caret.tow) deleteSelection({ caret })(s);
    console.log("insert", newCur, caret);
    const newHosts = [...s.hosts];
    const spliceIndex = caret.cur + 1;
    newHosts.splice(spliceIndex, 0, newCur);
    // TODO: Adjust ALL carets
    s.hosts = newHosts;
    caret.cur = spliceIndex;
    caret.anchor = spliceIndex;
};
const noop = () => (s) => s;
const Δregistry = {
    noop,
    moveCaret,
    moveCaretSelecting,
    insert,
    //uninsert,
    backspace,
    //unbackspace,
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
// - clicking on characters to focus them
// - [x] find a better way to ensure history entries are immutable
// - [x] selection
//   - [x] port selection
//   - [x] input during selection
// - multiplayer
//   - [x] change history for full momento memory to storing inverse change for undo later
//   - [x] seperate cursors for each person
//   - bugs:
//     - [x] 1. user A insert "dog is good" -> user B highlight, delete "g is" and insert "yo" -> user A undo -> Expected: "yo" remaining; Actual: "do" remaining
//       - involves having references to characters that work accross network? "Responsibility"
//         - i.e. changing "uninsert" to reference the particular character it should uninsert (responsible for)
//         - streeeeeetch: characters could keep track of their history. If a character is deleted by someone else it could invalidate that history entry.
//     - [ ] 2. one user can delete the other user's caret (should just move it)
//       - will also apply to anchor and tow
//     - [x] select and delete -> shift+left arrow -> Expected: starts selecting; Actual: selection appears one block later
//     - [ ] 3. caret can become null moving off left or right
//     - not a bug: if users work in separate parts of the document everything should work!
//     - case to look out for: user A inputs 10 things -> user B deletes those 10 things -> user A undoes and then redoes all of their work
//       - in google docs this does not bring the 10 inputted things back. This must mean that google docs "layers" user B's actions ontop of user A's redone actions.
//       - in notion this is just weird
//       - what if user B doing this resulted in user A's history entries just being deleted (or invalidated for future deletion)?
//         - this seems to make more sense than google docs' solution?
//       - this could also just bring back the 10 inputted things
//     - note: it kind of seems like caret movements are not even tracked in other editors' history. They just track where modification happen.
//       - In the future, when Polytope docs are more sprawling, I think I will want to be able to undo nav. For now, let's conform for simplicity.
//       - [x] 4. remove tracking of caret movement
//     - Sharon idea / notes / feedback
//       - immutable lock blocks
//       - color characters by who created them
//
// Monday more bugs
// - [ ]: delete other peoples selection causes crash
// - [ ]: state is not synchronized on join
// - [ ]: backspace -> moveCaret -> undo -> expected: caret moves back to where backspace occured; actual: insert where caret is
//   - make caret a part of the data of operation instead of an implicit curried arg
// - [ ]: different carets should have different colors. Carets should actually look nice.
// PUT OFF:
// - generalizing multiplayer beyond non-single-line-text-editing
// - tree drawer for visualizing history
// - nesting
// - lines
// - [x] serializable history? NOTE: this pretty much got done because it is necessary for sending deltas over network
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
            OpAp(moveCaretSelectingOp({
                dir: e.key,
                caret: myCaret,
            }));
        else
            OpAp(moveCaretOp({
                dir: e.key,
                caret: myCaret,
            }));
    }
    if (e.key === "z" && e.metaKey && e.shiftKey)
        return redo();
    if (e.key === "z" && e.metaKey)
        return undo();
    if (e.key === "Backspace")
        return Δap(backspaceΔ({ caret: myCaret }));
    if (e.key.length === 1)
        if (myCaret.cur)
            return Δap(insertΔ({ newCur: charToCaretHost(e.key), caret: myCaret }));
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
    const { hosts } = state;
    for (const caret of state.carets) {
        ctx.fillStyle = "yellow";
        hosts.filter(isSelectedBy(caret)).map(drawSelectedCaretHost(ctx));
        ctx.strokeStyle = "red";
        ctx.strokeRect(getBounds(state.hosts[caret.cur]).right, getBounds(state.hosts[caret.cur]).top, 3, state.hosts[caret.cur].size);
    }
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    hosts.map(drawCaretHost(ctx));
    requestAnimationFrame(anim);
}
requestAnimationFrame(anim);
/**
 * SELECTION!
 */
// when selection changes the old SELECTION span is cleared and the new one is highlighted
// function clearSelection()
function* traverseHosts(state, caret) {
    if (caret.anchor === caret.cur)
        return;
    if (caret.anchor < caret.cur) {
        let cur = state.hosts[caret.anchor];
        while (cur !== null) {
            const next = to(state.hosts, cur, "ArrowRight", null, true);
            if (next === cur)
                break;
            if (next === null)
                break;
            cur = next;
            yield cur;
            if (cur === state.hosts[caret.cur]) {
                break;
            }
        }
    }
    else {
        let cur = state.hosts[caret.cur];
        while (cur !== null) {
            const next = to(state.hosts, cur, "ArrowRight", null, true);
            if (next === cur)
                break;
            if (next === null)
                break;
            cur = next;
            yield cur;
            if (cur === state.hosts[caret.anchor]) {
                break;
            }
        }
    }
}
const isSelectedBy = (caret) => (host) => some(traverseHosts(state, caret), (h) => h === host);
