import * as DoubleLinkedList from "../../lib/structure/doubleLinkedList.js";
import { Caret } from "../caretope/caretope_caret.js";
import { CaretSink, ContainerSink } from "../caretope/caretope_sink.js";
export const initModel = () => {
    const container = new ContainerSink(() => ({
        top: 0,
        left: 0,
        right: 100,
        bottom: 0,
    }));
    const renderedBounds = new Map();
    const nodeFromSink = new Map();
    const sinkFromNode = new Map();
    const caret = new Caret();
    const model = {
        container,
        renderedBounds,
        nodeFromSink,
        sinkFromNode,
        caret,
    };
    const start = insertAfter(null)(null, model);
    renderedBounds.set(start, [0, 0, 1, 54]);
    return [model, start];
};
export const treeNode = (model) => {
    const { caret, renderedBounds, nodeFromSink, sinkFromNode, container } = model;
    const newNode = { s: [] };
    const sink = new CaretSink(() => {
        const [left, top, width, height] = renderedBounds.get(newNode);
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
    //caret.caretSink = sink;
    return newNode;
};
export const insertAfter = (after) => (data, model) => {
    const { caret, renderedBounds, nodeFromSink, sinkFromNode, container } = model;
    const newNode = DoubleLinkedList.insertAfter(after)(data);
    const sink = new CaretSink(() => {
        const [left, top, width, height] = renderedBounds.get(newNode);
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
export const remove = (node, model) => {
    const { caret, renderedBounds, nodeFromSink, sinkFromNode, container } = model;
    const prev = DoubleLinkedList.remove(node);
    if (caret.caretSink === sinkFromNode.get(node))
        caret.caretSink = sinkFromNode.get(prev);
    container.removeChild(sinkFromNode.get(node));
    renderedBounds.delete(node);
    sinkFromNode.delete(node);
    nodeFromSink.delete(sinkFromNode.get(node));
    return prev;
};
