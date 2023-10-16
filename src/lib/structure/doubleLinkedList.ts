export type Node<T> = {
  next: Node<T> | null;
  prev: Node<T> | null;
  readonly data: T;
};

export const insertAfter =
  <T>(after: Node<T> | null) =>
  (data: T) => {
    const newNode = {
      next: after?.next ?? null,
      prev: after,
      data,
    };
    if (after?.next) after.next.prev = newNode;
    if (after) after.next = newNode;

    return newNode;
  };
export const remove = <T>(node: Node<T>) => {
  const prev = node.prev!;
  prev.next = node.next;
  if (node.next) node.next.prev = prev;

  return prev;
};
export function* nexts<T>(node: Node<T>) {
  let cur: Node<T> | null = node.next;
  while (cur !== null) {
    yield cur;
    cur = cur.next;
  }
}
