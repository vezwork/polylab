import { MapWithInverse } from "../../lib/structure/data.js";
import * as DoubleLinkedList from "../../lib/structure/doubleLinkedList.js";
import { Caret } from "../caretope/caretope_caret.js";
import { CaretSink, ContainerSink } from "../caretope/caretope_sink.js";

export type Model = {
  caret: Caret;
  renderedBounds: Map<Sinkable, [number, number, number, number]>;
  nodeFromSink: MapWithInverse<CaretSink, Sinkable>;
  container: ContainerSink;
};
export type Sinkable = DoubleLinkedList.Node<any> | { s: any[] };

export const initModel = (): [Model, DoubleLinkedList.Node<any>] => {
  const container = new ContainerSink(() => ({
    top: 0,
    left: 0,
    right: 100,
    bottom: 0,
  }));

  const renderedBounds = new Map<Sinkable, [number, number, number, number]>();
  const nodeFromSink = new MapWithInverse<CaretSink, Sinkable>();

  const caret = new Caret();

  const model: Model = {
    container,
    renderedBounds,
    nodeFromSink,
    caret,
  };

  const start: DoubleLinkedList.Node<any> = insertAfter(null)(null, model);
  renderedBounds.set(start, [0, 0, 1, 54]);

  return [model, start];
};

export const treeNode = (model: Model) => {
  const { caret, renderedBounds, nodeFromSink, container } = model;
  const newNode = { s: [] };

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
  container.addChild(sink);
  //caret.caretSink = sink;

  return newNode;
};

export const insertAfter =
  <T>(after: DoubleLinkedList.Node<T> | null) =>
  (data: T, model: Model) => {
    const { caret, renderedBounds, nodeFromSink, container } = model;
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
    container.addChild(sink);

    caret.caretSink = sink;

    return newNode;
  };
export const remove = <T>(node: DoubleLinkedList.Node<T>, model: Model) => {
  const { caret, renderedBounds, nodeFromSink, container } = model;
  const sinkFromNode = nodeFromSink.inverse;
  const prev = DoubleLinkedList.remove(node);

  if (caret.caretSink === sinkFromNode.get(node))
    caret.caretSink = sinkFromNode.get(prev)!;
  container.removeChild(sinkFromNode.get(node)!);
  renderedBounds.delete(node);
  sinkFromNode.delete(node);
  nodeFromSink.delete(sinkFromNode.get(node)!);

  return prev;
};
