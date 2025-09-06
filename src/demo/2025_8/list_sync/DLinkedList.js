export class DLinkedList {
  listeners = [];
  onChange(f) {
    this.listeners.push(f);
  }
  pointer(node) {
    const p = { node };
    node.pointers.push(p);
    return p;
  }

  start = { list: this, pointers: [], next: undefined };
  end = this.start;

  addAfter(prev, data) {
    if (prev === undefined) throw new Error("trying to addAfter undefined");
    const newNode = {
      list: this,
      pointers: [],
      prev,
      next: prev.next,
      data,
    };
    data.node = newNode;
    if (newNode.next) newNode.next.prev = newNode;
    prev.next = newNode;

    if (prev === this.end) this.end = newNode;

    this.listeners.forEach((f) =>
      f({
        method: "addAfter",
        args: arguments,
        returns: newNode,
      })
    );

    return newNode;
  }

  remove(node) {
    if (!node) throw new Error("passed a non-node to remove!");
    if (node === this.start) throw new Error("cannot remove start node");
    node.removed = true;

    node.prev.next = node.next;
    if (node.next !== undefined) node.next.prev = node.prev;

    // move pointers to previous node
    node.prev.pointers = [...node.prev.pointers, ...node.pointers];
    for (const pointer of node.pointers) pointer.node = node.prev;

    if (node === this.end) this.end = node.prev;

    this.listeners.forEach((f) =>
      f({
        method: "remove",
        args: arguments,
        returns: node.prev,
      })
    );

    return node.prev;
  }

  *[Symbol.iterator]() {
    let cur = this.start.next;
    while (cur !== undefined) {
      yield cur;
      cur = cur.next;
    }
  }
}
