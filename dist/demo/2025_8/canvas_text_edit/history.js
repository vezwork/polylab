export const history = () => {
    let historyRoot = { next: [] };
    let historyHead = historyRoot;
    const getHistoryRoot = () => historyRoot;
    const getHistoryHead = () => historyHead;
    const setHistoryHead = (node) => {
        historyHead = node;
    };
    const getEnd = () => {
        let cur = historyRoot;
        while (cur.next.at(0))
            cur = cur.next.at(0);
        return cur;
    };
    const setHistory = (root, head) => {
        historyRoot = root;
        historyHead = head ?? getEnd();
    };
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
        if (historyHead.next.at(-1) === undefined)
            return undefined;
        historyHead = historyHead.next.at(-1) ?? historyHead;
        return historyHead.data;
    };
    const mainline = () => {
        const result = [];
        let cur = historyHead;
        while (cur.parent) {
            if (cur === historyRoot)
                break;
            if (!cur.removed)
                result.unshift(cur.data);
            cur = cur.parent;
        }
        return result;
    };
    const lastCheckpoint = () => {
        let cur = historyHead;
        while (true) {
            if (cur.checkpoint)
                return cur;
            cur = cur.parent;
            if (!cur)
                return;
        }
    };
    return {
        getHistoryRoot,
        setHistory,
        getHistoryHead,
        setHistoryHead,
        pushHistory,
        undo,
        redo,
        mainline,
        removeLastThat,
        restoreFirstThat,
        lastCheckpoint,
    };
};
