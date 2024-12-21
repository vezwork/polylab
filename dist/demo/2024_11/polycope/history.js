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
    const remove = (node) => {
        if (!node.parent)
            throw "attempting to remove root";
        node.removed = true;
        return parent;
    };
    const restore = (node) => {
        node.removed = false;
    };
    const restoreFirstThat = (pred) => {
        let cur = historyRoot;
        while (cur.next.at(-1)) {
            if (cur.removed && pred(cur.data)) {
                restore(cur);
                return cur.data;
            }
            cur = cur.next.at(-1);
        }
    };
    const removeLastThat = (pred) => {
        let cur = historyHead;
        while (cur.parent) {
            if (!cur.removed && pred(cur.data)) {
                remove(cur);
                return cur.data;
            }
            cur = cur.parent;
        }
    };
    const pushHistory = (data) => {
        historyHead = addHistoryItemAtNode(historyHead)(data);
        return historyHead.data;
    };
    const undo = () => {
        // TODO: skip removed
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
            if (cur === historyHead)
                break;
            cur = cur.next.at(-1);
            if (!cur.removed)
                result.push(cur.data);
        }
        return result;
    };
    return {
        pushHistory,
        undo,
        redo,
        mainline,
        removeLastThat,
        restoreFirstThat,
    };
};
