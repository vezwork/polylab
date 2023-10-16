import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { makeCaretFunctions } from "../../../lib/caret/caret.js";
import { some } from "../../../lib/structure/Iterable.js";
import { not } from "../../../lib/structure/Functions.js";

const ws = new WebSocket("ws://localhost:8000");
ws.addEventListener("open", () => {
  console.log("open!2");
});
const socketIdToCaretMap = new Map<number, CaretData>();
ws.addEventListener("message", (e) => {
  const { data } = e;
  const { op, id } = JSON.parse(data);
  const parsedOp = JSON.parse(op);

  // nice, except we want to register this as coming from a particular caret
  // and apply changes to that caret only
  const caret = socketIdToCaretMap.get(id);
  if (caret !== undefined) {
    networkΔap(caret)(parsedOp);
  } else {
    const newCaret = {
      cur: initCaret,
      anchor: initCaret,
      tow: null,
    };
    state.carets.add(newCaret);
    socketIdToCaretMap.set(id, newCaret);
    networkΔap(newCaret)(parsedOp);
  }
});
// send events

const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;

/**
 * HISTORY & State
 */

type CaretHost = {
  readonly size: number;
  readonly char: string;
};
type CaretData = {
  cur: CaretHost | null;
  anchor: CaretHost | null; // ⚓
  tow: CaretHost | null;
};
type State = {
  carets: Set<CaretData>;
  hosts: CaretHost[];
};
type DoubleLinkedListNode<T> = {
  next: DoubleLinkedListNode<T> | null;
  readonly prev: DoubleLinkedListNode<T> | null;
  readonly data: T;
};

type Op = { function: keyof typeof Δregistry; args: any[] };
type Δ = {
  forward: Op;
  backward: Op;
};
const eΔ: Δ = {
  forward: { function: "noop", args: [] },
  backward: { function: "noop", args: [] },
};

const initCaret: CaretHost = { size: 10, char: "" };
const myCaret: CaretData = {
  cur: initCaret,
  anchor: initCaret,
  tow: null,
};
let state: State = {
  carets: new Set([myCaret]),
  hosts: [
    initCaret,
    { size: 30, char: "a" },
    { size: 30, char: "b" },
    { size: 30, char: "b" },
  ],
};
let historyHead: DoubleLinkedListNode<Δ> = {
  next: null,
  prev: null,
  data: eΔ,
};

const networkΔap = (caret: CaretData) => (op: Op) => {
  Δregistry[op.function](caret)(...op.args)(state);
};

const Δap = (d: Δ) => {
  Δregistry[d.forward.function](myCaret)(...d.forward.args)(state);
  historyHead = insertAfter(historyHead)(d);
  ws.send(JSON.stringify(d.forward));
};

const insertAfter =
  <T>(after: DoubleLinkedListNode<T>) =>
  (data: T) => {
    const newNode = {
      next: null,
      prev: after,
      data,
    };
    if (after) after.next = newNode;
    return newNode;
  };

const redo = () => {
  if (historyHead.next) {
    const d = historyHead.next.data;
    Δregistry[d.forward.function](myCaret)(...d.forward.args)(state);
    historyHead = historyHead.next;
    ws.send(JSON.stringify(d.forward));
  }
};
const undo = () => {
  if (historyHead.prev) {
    const d = historyHead.data;
    Δregistry[d.backward.function](myCaret)(...d.backward.args)(state);

    historyHead = historyHead.prev;
    ws.send(JSON.stringify(d.backward));
  }
};

const reverseDir = (
  dir: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
) => {
  if (dir === "ArrowDown") return "ArrowUp";
  if (dir === "ArrowUp") return "ArrowDown";
  if (dir === "ArrowLeft") return "ArrowRight";
  if (dir === "ArrowRight") return "ArrowLeft";
  return "ArrowLeft";
};

const moveCaretΔ = (
  dir: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
): Δ => {
  const selection = [...traverseHosts(state, myCaret)];
  const isAnchorBeforeTow = orderOfCaretHosts(myCaret.anchor!, myCaret.tow!);
  return {
    forward: { function: "moveCaret", args: [{ dir }] },
    backward: {
      function: "unMoveCaret",
      args: [{ dir: reverseDir(dir), selection, isAnchorBeforeTow }],
    },
  };
};
const moveCaret =
  (caret: CaretData) =>
  ({ dir }: { dir: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" }) =>
  (s: State) => {
    if (caret.cur) {
      const next = to(s.hosts, caret.cur, dir, null, true);
      caret.cur = next;
      caret.anchor = next;
      caret.tow = null;
    }
  };
const unMoveCaret =
  (caret: CaretData) =>
  ({
    dir,
    selection,
    isAnchorBeforeTow,
  }: {
    dir: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
    selection: CaretHost[];
    isAnchorBeforeTow: boolean;
  }) =>
  (s: State) => {
    if (caret.cur) {
      if (selection.length > 0) {
        const anchor =
          (isAnchorBeforeTow
            ? s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]
            : selection.at(-1)) ?? null;
        const tow =
          (isAnchorBeforeTow
            ? selection.at(-1)
            : s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]) ?? null;
        caret.cur = tow;
        caret.anchor = anchor;
        caret.tow = tow;
      } else {
        const next = to(s.hosts, caret.cur, dir, null, true);
        caret.cur = next;
        caret.anchor = next;
        caret.tow = null;
      }
    }
  };

const moveCaretSelectingΔ = (
  dir: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
): Δ => ({
  forward: { function: "moveCaretSelecting", args: [dir] },
  backward: { function: "moveCaretSelecting", args: [reverseDir(dir)] },
});
const moveCaretSelecting =
  (caret: CaretData) =>
  (dir: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight") =>
  (s: State) => {
    if (caret.cur) {
      const next = to(s.hosts, caret.cur, dir, null, true);
      const anchor = caret.anchor ?? next;
      caret.cur = next;
      caret.anchor = anchor;
      caret.tow = next === anchor ? null : next;
    }
  };

// // note: originally had parts of this as separate command (e.g. "deleteSelection") but this
// // is not good because the user action should depend on the state. General takeaway is group
// // changes into commands based on what the user would view as the command. If some commands
// // do related things, abstract that in the function layer not the command layer.
const backspaceΔ = (): Δ => {
  const selection = [...traverseHosts(state, myCaret)];
  const isAnchorBeforeTow = orderOfCaretHosts(myCaret.anchor!, myCaret.tow!);
  const cur = myCaret.cur;
  return {
    forward: { function: "backspace", args: [] },
    backward: {
      function: "unbackspace",
      args: [{ isAnchorBeforeTow, selection, cur }],
    },
  };
};
const backspace = (caret: CaretData) => () => (s: State) => {
  if (state.hosts.indexOf(caret.tow!) !== -1) deleteSelection(caret)(s);
  else backspaceNoSelection(caret)(s);
};
const deleteSelection = (caret: CaretData) => (s: State) => {
  s.hosts = s.hosts.filter(not(isSelected(caret)));
  caret.cur = orderedSelectors(caret)(s)?.[0] ?? null;
  caret.anchor = caret.cur;
  caret.tow = null;
};
const unbackspace =
  (caret: CaretData) =>
  ({
    isAnchorBeforeTow,
    selection,
    cur,
  }: {
    isAnchorBeforeTow: boolean;
    selection: CaretHost[];
    cur: CaretHost;
  }) =>
  (s: State): void => {
    if (selection.length > 0) {
      insert(caret)(...selection)(s);
      const anchor =
        (isAnchorBeforeTow
          ? s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]
          : selection.at(-1)) ?? null;
      const tow =
        (isAnchorBeforeTow
          ? selection.at(-1)
          : s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]) ?? null;
      caret.cur = tow;
      caret.anchor = anchor;
      caret.tow = tow;
    } else {
      insert(caret)(cur)(s);
    }
  };

const insertΔ = (newCur: CaretHost): Δ => {
  const selection = [...traverseHosts(state, myCaret)];
  const isAnchorBeforeTow = orderOfCaretHosts(myCaret.anchor!, myCaret.tow!);
  return {
    forward: { function: "insert", args: [newCur] },
    backward: {
      function: "uninsert",
      args: [{ isAnchorBeforeTow, selection }],
    },
  };
};
const uninsert =
  (caret: CaretData) =>
  ({
    selection,
    isAnchorBeforeTow,
  }: {
    isAnchorBeforeTow: boolean;
    selection: CaretHost[];
  }) =>
  (s: State): void => {
    backspace(caret)()(s);
    if (selection.length > 0) {
      insert(caret)(...selection)(s);
      const anchor =
        (isAnchorBeforeTow
          ? s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]
          : selection.at(-1)) ?? null;
      const tow =
        (isAnchorBeforeTow
          ? selection.at(-1)
          : s.hosts[s.hosts.indexOf(selection.at(0)!) - 1]) ?? null;
      caret.cur = tow;
      caret.anchor = anchor;
      caret.tow = tow;
    }
  };
const backspaceNoSelection =
  (caret: CaretData) =>
  (s: State): void => {
    const newHosts = [...s.hosts];
    const index = newHosts.indexOf(caret.cur!);
    if (index === 0 || index === -1) return; //hack so that initial thing cannot be deleted
    newHosts.splice(index, 1);
    s.hosts = newHosts;
    caret.tow = null;
    caret.cur = s.hosts[index - 1];
    caret.anchor = caret.cur;
  };
const charToCaretHost = (char: string): CaretHost => ({ size: 30, char });
const insert =
  (caret: CaretData) =>
  (...newCurs: CaretHost[]) =>
  (s: State): void => {
    if (caret.tow) deleteSelection(caret)(s);

    const newHosts = [...s.hosts];
    const spliceIndex = newHosts.indexOf(caret.cur!) + 1;
    newHosts.splice(spliceIndex, 0, ...newCurs);
    s.hosts = newHosts;
    caret.anchor = newCurs.at(-1) ?? null;
    caret.tow = null;
    caret.cur = newCurs.at(-1) ?? null;
  };

const noop = () => (s) => s;
const Δregistry: {
  [key: string]: (caret: CaretData) => (...args: any) => (s: State) => void;
} = {
  noop,
  moveCaret,
  moveCaretSelecting,
  insert,
  uninsert,
  backspace,
  unbackspace,
  unMoveCaret,
} as const;

/**
 * SPATIAL MATH AND CARET
 */

const LEFT = 20;
const TOP = 20;
const MARGIN = 20;
const getBounds = (c: CaretHost) => {
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
const closestTo = (x: number) => (data: State) =>
  data.hosts
    .map((host) => ({ host, bounds: getBounds(host) }))
    .sort(
      (h1, h2) => Math.abs(x - h1.bounds.right) - Math.abs(x - h2.bounds.right)
    )[0].host;

const { to } = makeCaretFunctions<CaretHost>({
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
//     - [ ] 1. user A insert "dog is good" -> user B highlight, delete "g is" and insert "yo" -> user A undo -> Expected: "yo" remaining; Actual: "do" remaining
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
//       - [ ] 4. remove tracking of caret movement
//     - Sharon idea / notes / feedback
//       - immutable lock blocks
//       - color characters by who created them

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

addEventListener("mousedown", (e: MouseEvent) => {
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
      Δap(
        moveCaretSelectingΔ(
          e.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
        )
      );
    else
      Δap(
        moveCaretΔ(
          e.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
        )
      );
  }
  if (e.key === "z" && e.metaKey && e.shiftKey) return redo();
  if (e.key === "z" && e.metaKey) return undo();
  if (e.key === "Backspace") return Δap(backspaceΔ());

  if (e.key.length === 1)
    if (myCaret.cur) return Δap(insertΔ(charToCaretHost(e.key)));
});

/**
 * DRAW!
 */

const drawSelectedCaretHost =
  (ctx: CanvasRenderingContext2D) => (c: CaretHost) => {
    const { top, right, bottom, left } = getBounds(c);
    ctx.fillRect(left, top, right - left, bottom - top);
  };
const drawCaretHost = (ctx: CanvasRenderingContext2D) => (c: CaretHost) => {
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
    if (caret.cur) {
      ctx.fillStyle = "yellow";
      hosts.filter(isSelected(caret)).map(drawSelectedCaretHost(ctx));

      ctx.strokeStyle = "red";
      ctx.strokeRect(
        getBounds(caret.cur).right,
        getBounds(caret.cur).top,
        3,
        caret.cur.size
      );
    }
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

const orderOfCaretHosts = (a: CaretHost, b: CaretHost) =>
  state.hosts.indexOf(a) < state.hosts.indexOf(b);
const orderedSelectors =
  (caret: CaretData) =>
  (state: State): [CaretHost, CaretHost] | null =>
    !caret.anchor || !caret.tow
      ? null
      : state.hosts.indexOf(caret.anchor) > state.hosts.indexOf(caret.tow)
      ? [caret.anchor, caret.tow]
      : [caret.tow, caret.anchor];
function* traverseHosts(state: State, caret: CaretData): Generator<CaretHost> {
  if (caret.anchor === null || caret.tow === null) return;
  if (caret.anchor === caret.tow) {
    return;
  }
  if (orderOfCaretHosts(caret.anchor, caret.tow)) {
    let cur = caret.anchor;
    while (cur !== null) {
      const next = to(state.hosts, cur, "ArrowRight", null, true);
      if (next === cur) break;
      if (next === null) break;
      cur = next;
      yield cur;
      if (cur === caret.tow) {
        break;
      }
    }
  } else {
    let cur = caret.tow;
    while (cur !== null) {
      const next = to(state.hosts, cur, "ArrowRight", null, true);
      if (next === cur) break;
      if (next === null) break;
      cur = next;
      yield cur;

      if (cur === caret.anchor) {
        break;
      }
    }
  }
}
const isSelected = (caret: CaretData) => (host: CaretHost) =>
  some(traverseHosts(state, caret), (h) => h === host);

// history sketch
// Δ+a Δ+b Δ+c Δ+a Δ< Δ>
// Δ> Δ< = _
// ΔselectN ΔselectM = ΔselectNM

// how to compose events?
// - matcher: Δselect_ Δselect_ => new select
//  - default: any any => do a then b
// dependent changes vs overwrites
