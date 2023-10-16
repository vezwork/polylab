import { some } from "../../../lib/structure/Iterable.js";
import { makeTreeFunctions } from "../../../lib/structure/tree.js";
import { setup } from "./lib.js";

type Tree<V> = {
  parent: null | Tree<V>;
  v: V;
  children: Tree<V>[];
};

const insertChild =
  <V>(parent: Tree<V> | undefined) =>
  (v: V) => {
    if (parent === undefined) throw "parent undefined insertChild";
    const newNode = {
      parent,
      v,
      children: [],
    };
    parent.children.push(newNode);
    return newNode;
  };

function ok(myId) {
  const div = document.getElementById(myId);
  if (!div) throw "";

  const me = setup(myId);

  let treeRoots: { [key: string]: Tree<any> } = {};
  let treeHeads: { [key: string]: Tree<any> } = {};
  const init = () => {
    const base = { parent: null, v: null, children: [] };
    treeRoots[myId] = base;
    treeHeads[myId] = base;
  };
  init();

  const { rootIndexPath, applyRootIndexPath, nodeAndAncestors } =
    makeTreeFunctions<Tree<any>>({
      parent: ({ parent }) => parent,
      children: ({ children }) => children,
    });

  const newHead = (v) =>
    me.do({ v, id: myId, after: [...rootIndexPath(treeHeads[myId])] });
  const undo = () => {
    const candidate = treeHeads[myId].parent;
    if (candidate !== null)
      me.do({ id: myId, head: [...rootIndexPath(candidate)] });
  };
  const redo = () => {
    const candidate = treeHeads[myId].children.at(-1);
    if (candidate !== undefined)
      me.do({ id: myId, head: [...rootIndexPath(candidate)] });
  };

  div.addEventListener("keydown", ({ key, metaKey, shiftKey }) => {
    if (key.length === 1 && !metaKey) newHead({ fn: "ins", key });
    else if (key === "Backspace") newHead({ fn: "del" });
    else if (metaKey && shiftKey && key === "z") redo();
    else if (metaKey && key === "z") undo();
  });

  me.onUpdate((linearizedEvents) => {
    treeRoots = {};
    treeHeads = {};
    init();

    // build all trees
    for (const { v, id, after, head } of linearizedEvents) {
      if (after) {
        if (treeRoots[id] === undefined) {
          const base = { parent: null, v: null, children: [] };
          treeRoots[id] = base;
          treeHeads[id] = base;
        }
        const newNode = insertChild(applyRootIndexPath(treeRoots[id])(after))(
          v
        );
        treeHeads[id] = newNode;
      } else if (head) {
        const candidate = applyRootIndexPath(treeRoots[id])(head);
        if (candidate) treeHeads[id] = candidate;
      }
    }

    // now loop thru linearized events, discriminating based on what the tree head is
    div.textContent = linearizedEvents.reduce((acc, { v, id }) => {
      if (
        some(nodeAndAncestors(treeHeads[id]), ({ v: otherV }) => otherV === v)
      ) {
        const { fn, key } = v;
        if (fn === "ins") return acc + key;
        if (fn === "del") return acc.slice(0, -1);
      }
      return acc;
    }, "");
  });

  return me;
}

const me = ok("me");
const me2 = ok("me2");
document.getElementById("activate")?.addEventListener("click", () => {
  me.addListener(me2);
  me2.addListener(me);
});
document.getElementById("deactivate")?.addEventListener("click", () => {
  me.clearListeners();
  me2.clearListeners();
});
