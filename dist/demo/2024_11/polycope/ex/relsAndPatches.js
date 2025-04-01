const setMapAdd = (setMap, key, value) => {
  if (!setMap.has(key)) setMap.set(key, new Set());
  setMap.get(key).add(value);
};
const mapMapSet = (setMap, key1, key2, value) => {
  if (!setMap.has(key1)) setMap.set(key1, new Map());
  setMap.get(key1).set(key2, value);
};
const setMapGet = (setMap, key) => setMap.get(key) ?? new Set();

const cat = () => {
  const rels = new Map();
  const lers = new Map();

  const rel = (from, to) => {
    const relObj = { from, to };

    setMapAdd(rels, from, relObj);
    setMapAdd(lers, to, relObj);

    return relObj;
  };
  const unrel = (relObj) => {
    const { from, to, name } = relObj;
    rels.get(from)?.delete(relObj);
    lers.get(to)?.delete(relObj);
  };
  const getRels = (a) => setMapGet(rels, a);
  const getLers = (a) => setMapGet(lers, a);

  return { rel, unrel, getRels, getLers };
};

// want patches to be cats so they can be stateful (i.e. add then remove results in no change, remove then add results in no change, just remove is a "red" edge)
const patchView = (cat) => {
  const added = new Set();
  const removed = new Set();
  const addedRels = new Map();
  const addedLers = new Map();

  const rel = (from, to) =>
    addRelObj(addedRels, addedLers, added)({ from, to });
  const addRelObj = (rels, lers, diff) => (relObj) => {
    setMapAdd(rels, relObj.from, relObj);
    setMapAdd(lers, relObj.to, relObj);
    diff.add(relObj);
    return relObj;
  };
  const unrel = (relObj) => {
    if (added.has(relObj)) {
      added.delete(relObj);
      addedRels.delete(relObj.from);
      addedLers.delete(relObj.to);
    } else {
      removed.add(relObj);
    }
  };
  const getRels = (a) =>
    cat.getRels(a).difference(removed).union(setMapGet(addedRels, a));
  const getLers = (a) =>
    cat.getLers(a).difference(removed).union(setMapGet(addedLers, a));

  return { rel, unrel, getRels, getLers, added, removed };
};

// TESTING

const childcat = cat();
const ordercat = cat();

const h =
  (tag) =>
  (...children) => {
    const f = () => document.createElement(tag);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      childcat.rel(f, child);
      if (i > 0) {
        const prevChild = children[i - 1];
        ordercat.rel(prevChild, child);
      }
    }
    return f;
  };
const t = (text) => () => document.createTextNode(text);

const t1 = t("hi");
const m = h("span")(t1, h("b")(t("yo")));

console.log(childcat.getRels(m));
const pv = patchView(childcat);
pv.unrel([...childcat.getRels(m)][0]);
pv.rel(m, 1);
console.log(pv.getRels(m));
