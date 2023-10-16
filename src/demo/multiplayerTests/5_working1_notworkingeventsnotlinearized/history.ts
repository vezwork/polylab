type DoubleLinkedListNode<T> = {
  next: DoubleLinkedListNode<T> | null;
  readonly prev: DoubleLinkedListNode<T> | null;
  readonly data: T;
};

type Op = { f: Function; args: any[] };
type Δ = {
  redo: Op;
  undo: Op;
};

let historyHead: DoubleLinkedListNode<Δ[]> = {
  next: null,
  prev: null,
  data: [
    {
      redo: { f: () => undefined, args: [] },
      undo: { f: () => undefined, args: [] },
    },
  ],
};

export const historyGroup = (...ds: Δ[]) =>
  (historyHead = insertAfter(historyHead)(ds));

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

export const redo = () => {
  if (historyHead.next) {
    const Δs = historyHead.next.data;
    for (const {
      redo: { f, args },
    } of Δs) {
      f(...args);
    }

    historyHead = historyHead.next;
  }
};
export const undo = () => {
  if (historyHead.prev) {
    const Δs = historyHead.data;
    for (const {
      undo: { f, args },
    } of Δs) {
      f(...args);
    }

    historyHead = historyHead.prev;
  }
};
