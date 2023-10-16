import { setupFullscreenCanvas } from "../../lib/draw/setupFullscreenCanvas.js";
import * as DoubleLinkedList from "../../lib/structure/doubleLinkedList.js";
import { Caret } from "../caretope/caretope_caret.js";
import { CaretSink, ContainerSink } from "../caretope/caretope_sink.js";
import { setupTree } from "../multiplayerTests/6_vectorClockTree/libtree.js";
import { render } from "./draw.js";

const ctx = setupFullscreenCanvas("c");

type Sinkable = DoubleLinkedList.Node<any> | { s: any[] };

const insertAfter =
  <T>(after: DoubleLinkedList.Node<T> | null) =>
  (
    data: T,
    caret: Caret,
    renderedBounds,
    nodeFromSink,
    sinkFromNode,
    container
  ) => {
    const newNode = DoubleLinkedList.insertAfter(after)(data);

    const sink = new CaretSink(() => {
      const [left, top, width, height] = renderedBounds.get(newNode)!;
      return {
        top,
        left,
        right: left + 1,
        bottom: top + height,
      };
    });
    nodeFromSink.set(sink, newNode);
    sinkFromNode.set(newNode, sink);
    container.addChild(sink);

    caret.caretSink = sink;

    return newNode;
  };
const remove = <T>(
  node: DoubleLinkedList.Node<T>,
  caret: Caret,
  renderedBounds,
  nodeFromSink,
  sinkFromNode,
  container
) => {
  const prev = DoubleLinkedList.remove(node);

  if (caret.caretSink === sinkFromNode.get(node))
    caret.caretSink = sinkFromNode.get(prev)!;
  container.removeChild(sinkFromNode.get(node)!);
  renderedBounds.delete(node);
  sinkFromNode.delete(node);
  nodeFromSink.delete(sinkFromNode.get(node)!);

  return prev;
};

const me = setupTree("testUser1", (evs) => {
  // URGENT!
  // TODO: make this a change map instead of a state map
  // will need to add `remove` fn and `insertAfter` fn
  // URGENT!

  const container = new ContainerSink(() => ({
    top: 0,
    left: 0,
    right: 100,
    bottom: 0,
  }));

  const renderedBounds = new Map<Sinkable, [number, number, number, number]>();
  const nodeFromSink = new Map<CaretSink, Sinkable>();
  const sinkFromNode = new Map<Sinkable, CaretSink>();

  const caret = new Caret();

  const start: DoubleLinkedList.Node<any> = insertAfter(null)(
    null,
    caret,
    renderedBounds,
    nodeFromSink,
    sinkFromNode,
    container
  );
  renderedBounds.set(start, [0, 0, 1, 54]);

  for (const {
    ev: { v },
  } of evs) {
    console.log("V", v);
    const { del, insNode, ins, move } = v;
    const curNode = nodeFromSink.get(caret.currentCaretSink!)!;
    if (del) {
      if ("s" in curNode) 1;
      else
        remove(
          curNode,
          caret,
          renderedBounds,
          nodeFromSink,
          sinkFromNode,
          container
        );
    }
    if (insNode) {
      if ("s" in curNode) {
        const newNode = { s: [] };
        curNode.s.push(newNode);

        const sink = new CaretSink(() => {
          const [left, top, width, height] = renderedBounds.get(newNode)!;
          return {
            top,
            left,
            right: left + 1,
            bottom: top + height,
          };
        });
        nodeFromSink.set(sink, newNode);
        sinkFromNode.set(newNode, sink);
        container.addChild(sink);
        caret.caretSink = sink;
      } else {
        const newNode = {
          s: [],
        };
        insertAfter(curNode)(
          newNode,
          caret,
          renderedBounds,
          nodeFromSink,
          sinkFromNode,
          container
        );

        const sink = new CaretSink(() => {
          const [left, top, width, height] = renderedBounds.get(newNode)!;
          return {
            top,
            left,
            right: left + 1,
            bottom: top + height,
          };
        });
        nodeFromSink.set(sink, newNode);
        sinkFromNode.set(newNode, sink);
        container.addChild(sink);
        caret.caretSink = sink;
      }
    }
    if (ins) {
      if ("s" in curNode) 1;
      else
        insertAfter(curNode)(
          ins,
          caret,
          renderedBounds,
          nodeFromSink,
          sinkFromNode,
          container
        );
    }
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
  if (e.key === "z" && e.metaKey) {
    me.undo();
  } else if (e.key.length === 1) me.do({ ins: e.key });
  if (e.key.startsWith("Arrow")) me.do({ move: e.key });

  e.preventDefault();
});

// TODO:
// wrap trees in containerSinks
// want to be able to tune the distance function in the trees so the lines are better (no vertical distance allowed)
