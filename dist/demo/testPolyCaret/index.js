import { setupFullscreenCanvas } from "../../lib/draw/setupFullscreenCanvas.js";
import { setupTree } from "../multiplayerTests/6_vectorClockTree/libtree.js";
import { initModel, insertAfter, remove, treeNode, } from "./data.js";
import { render } from "./draw.js";
const ctx = setupFullscreenCanvas("c");
const me = setupTree("testUser1", (evs) => {
    // URGENT!
    // TODO: make this a change map instead of a state map
    // will need to add `remove` fn and `insertAfter` fn
    // update next day: nvm lets do saved state instead lol
    //  - otherwise I have to write inverses for everything :|
    // want to make it so I can just write the update function and
    // the state is automatically saved but we will see how that works
    // URGENT!
    const [model, start] = initModel();
    const { nodeFromSink, caret, container, renderedBounds } = model;
    for (const { ev: { v }, } of evs) {
        console.log("V", v);
        const { del, insNode, ins, move } = v;
        const curNode = nodeFromSink.get(caret.currentCaretSink);
        if (del)
            if ("s" in curNode)
                null;
            else
                remove(curNode, model);
        if (insNode) {
            const tnode = treeNode(model);
            if ("s" in curNode)
                curNode.s.push(tnode);
            else
                insertAfter(curNode)(tnode, model);
        }
        if (ins)
            if ("s" in curNode)
                null;
            else
                insertAfter(curNode)(ins, model);
        if (move) {
            // TODO: make this "ephemeral"!
            container.calculateChildLines(); // TODO: don't do this every move!!
            if (move === "ArrowLeft")
                caret.moveLeft();
            if (move === "ArrowRight")
                caret.moveRight();
            if (move === "ArrowUp")
                caret.moveUp();
            if (move === "ArrowDown")
                caret.moveDown();
        }
        render(ctx, container, caret, start, renderedBounds, nodeFromSink);
    }
    render(ctx, container, caret, start, renderedBounds, nodeFromSink);
});
document.addEventListener("keydown", (e) => {
    console.log(e.key);
    if (e.key === "Backspace")
        me.do({ del: true });
    if (e.key === "Tab")
        me.do({ insNode: true });
    if (e.key === "z" && e.metaKey) {
        me.undo();
    }
    else if (e.key.length === 1)
        me.do({ ins: e.key });
    if (e.key.startsWith("Arrow"))
        me.do({ move: e.key });
    e.preventDefault();
});
// TODO:
// wrap trees in containerSinks
// want to be able to tune the distance function in the trees so the lines are better (no vertical distance allowed)
