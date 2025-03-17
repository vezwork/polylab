// non recursive version so we don't run out of mem
export const serializeHistory = (root) => JSON.stringify(serializeTree(root));
export const deserializeHistory = (str) => deserializeTree(JSON.parse(str));
function serializeTree(root) {
  let nodeMap = new Map();
  let todo = [root];
  while (todo.length > 0) {
    const cur = todo.pop();
    nodeMap.set(cur, { data: cur.data });
    todo.push(...cur.next);
  }
  todo = [root];
  while (todo.length > 0) {
    const cur = todo.pop();
    nodeMap.get(cur).next = cur.next.map((n) => nodeMap.get(n));
    todo.push(...cur.next);
  }
  return nodeMap.get(root);
}
function deserializeTree(root) {
  let nodeMap = new Map();
  let todo = [root];
  while (todo.length > 0) {
    const cur = todo.pop();
    nodeMap.set(cur, { data: cur.data });
    todo.push(...cur.next);
  }
  todo = [root];
  while (todo.length > 0) {
    const cur = todo.pop();
    const next = cur.next.map((n) => nodeMap.get(n));
    nodeMap.get(cur).next = next;
    for (const nxt of next) nxt.parent = nodeMap.get(cur);
    todo.push(...cur.next);
  }
  return nodeMap.get(root);
}
