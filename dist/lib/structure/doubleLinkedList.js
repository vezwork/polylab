export const insertAfter = (after) => (data) => {
    const newNode = {
        next: after?.next ?? null,
        prev: after,
        data,
    };
    if (after?.next)
        after.next.prev = newNode;
    if (after)
        after.next = newNode;
    return newNode;
};
export const remove = (node) => {
    const prev = node.prev;
    prev.next = node.next;
    if (node.next)
        node.next.prev = prev;
    return prev;
};
export function* nexts(node) {
    let cur = node.next;
    while (cur !== null) {
        yield cur;
        cur = cur.next;
    }
}
