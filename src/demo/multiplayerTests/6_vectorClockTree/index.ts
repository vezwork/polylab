import { setupTree } from "./libtree.js";

function initPeer(myId) {
  const div = document.getElementById(myId);
  if (!div) throw "";

  const me = setupTree(myId, (evs) => {
    // TODO: make this a change map instead of a state map
    div.textContent = evs.reduce((acc, { ev: { v, id } }) => {
      const { fn, key } = v;
      if (fn === "ins") return acc + key;
      if (fn === "del") return acc.slice(0, -1);

      return acc;
    }, "");
  });

  div.addEventListener("keydown", (e) => {
    const { key, metaKey, shiftKey } = e;
    if (key.length === 1 && !metaKey) me.do({ fn: "ins", key });
    else if (key === "Backspace") me.do({ fn: "del" });
    else if (metaKey && shiftKey && key === "z") me.redo();
    else if (metaKey && key === "z") me.undo();
    e.preventDefault();
  });

  return me;
}

const me = initPeer("me");
const me2 = initPeer("me2");
const me3 = initPeer("me3");
document.getElementById("activate")?.addEventListener("click", () => {
  me.addListener(me2);
  me2.addListener(me);

  me2.addListener(me3);
  me3.addListener(me2);
});
document.getElementById("deactivate")?.addEventListener("click", () => {
  me.clearListeners();
  me2.clearListeners();
  me3.clearListeners();
});
document.getElementById("test")?.addEventListener("click", (e) => {
  let active = false;
  setInterval(() => {
    if (Math.random() > 0.5) {
      if (active && Math.random() > 0.99)
        document.getElementById("active")?.click();
      else document.getElementById("deactivate")?.click();
      active = !active;
    }

    // while (Math.random() > 0.6) me.dispatchEvent(new KeyboardEvent('keydown', {'key': 'z', metaKey:true}));
    //   while (Math.random() > 0.6) me2.dispatchEvent(new KeyboardEvent('keydown', {'key': 'z', metaKey:true}));

    if (Math.random() > 0.2)
      document.getElementById("me")?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "" + Math.round(Math.random() * 9),
        })
      );
    // if (Math.random() > 0.9)
    //   document.getElementById("me2")?.dispatchEvent(
    //     new KeyboardEvent("keydown", {
    //       key: "" + Math.round(Math.random() * 9),
    //     })
    //   );
    if (Math.random() > 0.1)
      document.getElementById("me2")?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Backspace",
        })
      );
    if (Math.random() > 0.2)
      document.getElementById("me3")?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "" + Math.round(Math.random() * 9),
        })
      );
  }, 300);
});
