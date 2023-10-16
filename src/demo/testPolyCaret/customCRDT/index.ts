import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";
import { setupTree } from "../../multiplayerTests/6_vectorClockTree/libtree.js";
import { initModel, insertAfter, remove, treeNode } from "./data.js";
import { render } from "./draw.js";

const ctx = setupFullscreenCanvas("c");

const [model, start] = initModel();
const { nodeFromSink, caret, container, renderedBounds } = model;

// I am just realizing that it is not possible to get around the following:
// - when inserting or deleting, you must include the uid of the node you are after/on in the event
// I was thinking I could calculate this from `prev` by getting the node inserted by prev, but
// the user may move their caret after `prev` and, even if you recorded every caret movement
// as events, linearization of concurrent events can result in your caret not being in the position
// you intended to insert at. We want to preserve intention of insertion and deletion, we don't want
// to stick to the linearized caret events.

// so, all that to say: This doesn't currently have serializable uids per character, but it needs them.
// if events have uids, it would also work (identify characters by their insertion events).

// Big takeaway: NEVER rely on object equality in your language with CRDTs. It is not serializable.

// concretely, I need to
// 1. change my `do` objects in this file to include an `after` or `on` field
// 2. change setupTree to get rid of `prev`
// 3. change `cur` so it includes a uid for that event (vector clock + peer id).
// 4. add a partial MapWithInverse: event uids <-> nodes inserted at an event

// omg this means my whole tree aproach doesn't really work: e.g.
// concurrently:
// - do insert a after event b
// - undo event b
// in one possible linearization:
// - undo event b, do insert a after event b
// what happens!?!? The undo would result in the node being removed the way I'm currently thinking.
// wow this is a problem. Realizing that the CRDT string indexing article I read actually means something.
// I need tombstones in my current approach :O. Old branches can't actually be naively ignored
// when calculating state.

// ... 5. Add tombstones!!!
//        This means that the update operations all have to know how to ins/del after tombstones
//        e.g. inserting a child node in the tree to a tombstone node should be ignored or inserted
//        to the closest non-deleted parent!?)

// I thought I implemented an array CRDT with undo/redo, but I actually didn't.

// I also thought my approach was more generalizable than it was. I thought it would work for
// arrays and trees and any Model+Update approach. There are so many nuances! I don't even
// know about nested arrays now...

// ... 6. More edge cases for composing nested data structures and stuff.

// starting to think I should just use Yjs for Polytope. I could develop this into an
// actual array CRDT, but it would be substantial more work! What benefits would that have?
// - I would learn during the process
// - might be more customizable? Not even sure at this point

// NOTE on generalizability I don't think I am wrong about: as long as operations are commutative
// you can throw them into a log/append-only-list CRDT and it will be a CRDT.
// ... the problem is that my operations are not actually commutative.
// its also possible you could weaken this condition to something like "locally"-commutative, like maybe if
// you disallow peers from being out of sync for too long? No idea how to start on that tho.

const me = setupTree("testUser1", undefined, (type, prev, cur) => {
  //console.log(type, prev, cur);
  if (type === "add") {
    const id = cur.ev.id;
    const clock = cur.clock;
    const { del, insNode, ins, move } = cur.ev.v;
    const curNode = nodeFromSink.get(caret.currentCaretSink!)!;
    if (del)
      if ("s" in curNode) null;
      else remove(curNode, model);

    if (insNode) {
      const tnode = treeNode(model);
      if ("s" in curNode) curNode.s.push(tnode);
      else insertAfter(curNode)(tnode, model);
    }
    if (ins)
      if ("s" in curNode) null;
      else insertAfter(curNode)(ins, model);

    if (move) {
      // TODO: make this "ephemeral"!
      container.calculateChildLines(); // TODO: don't do this every move!!
      if (move === "ArrowLeft") caret.moveLeft();
      if (move === "ArrowRight") caret.moveRight();
      if (move === "ArrowUp") caret.moveUp();
      if (move === "ArrowDown") caret.moveDown();
    }
    render(ctx, container, caret, start, renderedBounds, nodeFromSink);
  }
  render(ctx, container, caret, start, renderedBounds, nodeFromSink);
});
document.addEventListener("keydown", (e) => {
  console.log(e.key);
  if (e.key === "Backspace") me.do({ del: true });

  if (e.key === "Tab") me.do({ insNode: true });
  if (e.key === "z" && e.metaKey)
    if (e.shiftKey) me.redo();
    else me.undo();
  else if (e.key.length === 1) me.do({ ins: e.key });
  if (e.key.startsWith("Arrow")) me.do({ move: e.key });

  e.preventDefault();
});

// BUG: undo, redo, undo, redo causes an error.

// TODO:
// wrap trees in containerSinks
// want to be able to tune the distance function in the trees so the lines are better (no vertical distance allowed)

// STRETCH!
// navigation should have better constraints for edits. It can change too much.
// - local caret sink re-connecting would be better for this?
