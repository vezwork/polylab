import { MapWithInverse } from "../../../lib/structure/data.js";

import { DLinkedList } from "./DLinkedList.js";

export function createSyncedListAndListOfLists() {
  // string of character objects
  const l = new DLinkedList();

  // now I want a list of lists that I can add and remove from
  // that is synced with the `ll`

  // list of lines of character objects
  const lol = new DLinkedList();
  const line0Node = lol.addAfter(lol.start, createLine());

  // let's sync em up

  const lolFroml = new MapWithInverse();
  const lFromlol = lolFroml.inverse;
  lolFroml.set(l.start, line0Node.data.start);

  l.onChange(({ method, args, returns }) => {
    if (method === "addAfter") {
      const [prev, newData, dontPropagate] = args;
      const newNode = returns;

      if (dontPropagate) return;

      // find the node corresponding to `prev` in `lol`
      const lolPrev = lolFroml.get(prev);
      // then
      // if node is a newline, create new line
      if (newNode.data.char === "\n") {
        const newLine = createLine();
        const newLineNode = lol.addAfter(lolPrev.list.node, newLine, true);

        lolFroml.set(newNode, newLine.start);

        // and move over everything in the line!
        // get everything in lolPrev.list after lolPrev and move it over!
        for (const node of lolPrev.list.traverseForward(lolPrev)) {
          lolPrev.list.remove(node, true);
          // move correspondence to new node
          lolFroml.set(
            lFromlol.get(node),
            newLine.addAfter(newLine.end, node.data, true)
          );
        }
      }
      // else addAfter corresponding node
      else {
        const lolNewNode = lolPrev.list.addAfter(lolPrev, newNode.data, true);
        lolFroml.set(newNode, lolNewNode);
      }
    }
    if (method === "remove") {
      const [node, dontPropagate] = args;
      const prev = returns;

      if (dontPropagate) return;

      // find the node corresponding to `node` in `lol`
      const lolRemove = lolFroml.get(node);
      // then
      const line = lolRemove.list;
      // if node is a newline, remove line and join two lines
      if (node.data.char === "\n") {
        lol.remove(line.node, true);

        const lineBefore = line.node.prev.data;
        for (const node of line) {
          const newNode = lineBefore.addAfter(lineBefore.end, node.data, true);
          lFromlol.set(newNode, lFromlol.get(node));
        }
      }
      // else remove the node
      else {
        lolRemove.list.remove(lolRemove, true);
      }
    }
  });

  // Now for the backwards direction!

  lol.onChange(({ method, args, returns }) => {
    if (method === "addAfter") {
      const [prev, newData, dontPropagate] = args;
      const newNode = returns;

      if (dontPropagate) return;

      // new line, so add \n
      const lPrev = lFromlol.get(prev.data.end);
      const newlNewlineNode = l.addAfter(lPrev, { char: "\n" }, true);
      lFromlol.set(newNode.data.start, newlNewlineNode);
    }
    if (method === "remove") {
      const [node, dontPropagate] = args;
      const prev = returns;

      if (dontPropagate) return;

      const lNode = lFromlol.get(node.data.start);

      if (lNode === l.start) {
        if (node.next === undefined) throw `can't remove the only line!`;
        const firstNewLineNode = node.next.data.start;

        l.remove(lFromlol.get(firstNewLineNode), true);
        lFromlol.set(firstNewLineNode, l.start);
      } else {
        l.remove(lNode, true);
      }
      for (const n of node.data) l.remove(lFromlol.get(n));
    }
  });

  //... We'll have to set up listeners whenever new lines are created

  function createLine() {
    const line = new DLinkedList();
    line.onChange(({ method, args, returns }) => {
      if (method === "addAfter") {
        const [prev, newData, dontPropagate] = args;
        const newNode = returns;

        if (dontPropagate) return;

        // simply add character
        const newLineNode = l.addAfter(lFromlol.get(prev), newData, true);
        lFromlol.set(newLineNode, newNode);
      }
      if (method === "remove") {
        const [node, dontPropagate] = args;
        const prev = returns;

        if (dontPropagate) return;

        // simply remove character
        l.remove(lFromlol.get(node), true);
      }
    });
    return line;
  }

  return { l, lol, lolFroml, lFromlol };
}
