class Node {
  constructor({ list, prev, next, data, id }) {
    this.id = id;
    this.pointers = new Set();

    this.list = list;
    this.prev = prev;
    this.next = next;
    this.data = data;

    list.nodeFromId.set(this.id, this);
  }
}

export class DLinkedList {
  listeners = [];
  onChange(f) {
    this.listeners.push(f);
  }
  pointer(node) {
    let _node = node;
    const p = {
      get node() {
        return _node;
      },
      set node(newNode) {
        _node.pointers.delete(p);
        newNode.pointers.add(p);
        _node = newNode;
      },
    };
    node.pointers.add(p);
    return p;
  }

  nodeFromId = new Map();

  start = new Node({ list: this });
  end = this.start;

  addAfter(prev, data, dontPropagate, id) {
    if (prev === undefined) throw new Error("trying to addAfter undefined");
    const newNode = new Node({
      id,
      list: this,
      pointers: new Set(),
      prev,
      next: prev.next,
      data,
    });
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
  *traverseWithStart() {
    let cur = this.start;
    while (cur !== undefined) {
      yield cur;
      cur = cur.next;
    }
  }
  *traverseForward(node) {
    let cur = node.next;
    while (cur !== undefined) {
      yield cur;
      cur = cur.next;
    }
  }
}
