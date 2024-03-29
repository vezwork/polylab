import { locationOf } from "../../../lib/structure/Arrays.js";
import { compareEventClocksAlphabetical, setup } from "./liblog.js";
const insertChild = (parent) => (v) => {
    if (parent === undefined)
        throw "parent undefined insertChild";
    const newNode = {
        parent,
        v,
        children: [],
    };
    parent.children.push(newNode);
    return newNode;
};
export const setupTree = (id, stateUpdate = () => { }, changeUpdate = () => { }) => {
    let treeRoots = {};
    let treeHeads = {};
    const init = () => {
        const base = { parent: null, v: null, children: [] };
        treeRoots[id] = base;
        treeHeads[id] = base;
    };
    init();
    const me = setup(id);
    const undo = () => {
        const candidate = treeHeads[id].parent;
        if (candidate !== null)
            me.do({ id, undo: true });
    };
    const redo = () => {
        const candidate = treeHeads[id].children.at(-1);
        if (candidate !== undefined)
            me.do({ id, redo: true });
    };
    let mainLinearizedEvents = [];
    me.onUpdate((wrapEv) => {
        const { ev } = wrapEv;
        const { v, id, undo, redo } = ev;
        if (v) {
            if (treeRoots[id] === undefined) {
                const base = { parent: null, v: null, children: [] };
                treeRoots[id] = base;
                treeHeads[id] = base;
            }
            const newNode = insertChild(treeHeads[id])(wrapEv);
            treeHeads[id] = newNode;
            const index = locationOf(wrapEv, mainLinearizedEvents, compareEventClocksAlphabetical);
            mainLinearizedEvents.splice(index + 1, 0, wrapEv);
            changeUpdate("add", mainLinearizedEvents[index], wrapEv);
        }
        else if (undo) {
            const candidate = treeHeads[id].parent;
            if (candidate) {
                // TODO: add removeFromSorted and use it instead of filter
                mainLinearizedEvents = mainLinearizedEvents.filter((w) => w !== treeHeads[id].v);
                changeUpdate("del", treeHeads[id]);
                treeHeads[id] = candidate;
            }
        }
        else if (redo) {
            const candidate = treeHeads[id].children.at(-1);
            if (candidate) {
                treeHeads[id] = candidate;
                const index = locationOf(candidate.v, mainLinearizedEvents, compareEventClocksAlphabetical);
                mainLinearizedEvents.splice(index + 1, 0, candidate);
                changeUpdate("add", mainLinearizedEvents[index], candidate.v);
            }
        }
        stateUpdate(mainLinearizedEvents);
        // TODO: make this an onchange reduce?
        //   what data is needed to maintain references in this map? (hint: character positions in output string)
    });
    return {
        do: (v) => me.do({ v, id }),
        undo,
        redo,
        me,
        addListener: (l) => me.addListener(l.me),
        clearListeners: me.clearListeners,
    };
};
