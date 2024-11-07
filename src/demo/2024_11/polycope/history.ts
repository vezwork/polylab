export const history = () => {
  const historyRoot = { next: [] };
  let historyHead = historyRoot;

  const addHistoryItemAtNode = (node) => (data) => {
    const newNode = {
      data,
      parent: node,
      next: [],
    };
    node.next.push(newNode);
    return newNode;
  };
  const pushHistory = (data) => {
    historyHead = addHistoryItemAtNode(historyHead)(data);
    return historyHead.data;
  };
  const undo = () => {
    const cur = historyHead;
    historyHead = historyHead.parent ?? historyHead;
    return [historyHead.data, cur.data];
  };
  const redo = () => {
    const cur = historyHead;
    historyHead = historyHead.next.at(-1) ?? historyHead;
    return [historyHead.data, cur.data];
  };
  const mainline = () => {
    const result = [];
    let cur = historyRoot;
    while (cur.next.at(-1)) {
      if (cur === historyHead) break;
      cur = cur.next.at(-1);
      result.push(cur.data);
    }
    return result;
  };

  return { pushHistory, undo, redo, mainline };
};
