import { setupTree } from "./libtree.js";
function initPeer(myId) {
    const div = document.getElementById(myId);
    if (!div)
        throw "";
    const me = setupTree(myId, (evs) => {
        // TODO: make this a change map instead of a state map
        div.textContent = evs.reduce((acc, { ev: { v, id } }) => {
            const { fn, key } = v;
            if (fn === "ins")
                return acc + key;
            if (fn === "del")
                return acc.slice(0, -1);
            return acc;
        }, "");
    });
    div.addEventListener("keydown", (e) => {
        const { key, metaKey, shiftKey } = e;
        if (key.length === 1 && !metaKey)
            me.do({ fn: "ins", key });
        else if (key === "Backspace")
            me.do({ fn: "del" });
        else if (metaKey && shiftKey && key === "z")
            me.redo();
        else if (metaKey && key === "z")
            me.undo();
        e.preventDefault();
    });
    return me;
}
const me = initPeer("me");
const me2 = initPeer("me2");
document.getElementById("activate")?.addEventListener("click", () => {
    me.addListener(me2);
    me2.addListener(me);
});
document.getElementById("deactivate")?.addEventListener("click", () => {
    me.clearListeners();
    me2.clearListeners();
});
