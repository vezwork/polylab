import { makeENode } from "./eGraph.js";
// like array map, but for any iterable. Copied from my Iterable.js lib.
export const map = function* (iterable, func) {
    for (const item of iterable)
        yield func(item);
};
export const hash = ({ value, children }) => value + children.map((c) => ":" + c.id).join("");
export const unhash = (str, setFromId) => {
    const [value, ...classIds] = str.split(":");
    return makeENode(value, ...classIds.map(Number).map((id) => setFromId.get(id)));
};
export const makeHashcons = (keyValues, setFromId) => {
    const _hashcons = new Map(keyValues);
    return {
        has: (eNode) => _hashcons.has(hash(eNode)),
        get: (eNode) => _hashcons.get(hash(eNode)),
        set: (eNode, eClassId) => _hashcons.set(hash(eNode), eClassId),
        remove: (eNode) => _hashcons.delete(hash(eNode)),
        [Symbol.iterator]: () => map(_hashcons[Symbol.iterator](), ([heNode, eClass]) => [
            unhash(heNode, setFromId),
            eClass,
        ]),
        _hashcons,
        _setFromId: setFromId,
    };
};
export const unionHashcons = (a, b) => makeHashcons([...a._hashcons, ...b._hashcons], a._setFromId);
export const makeHashset = (items, setFromId, overrideSet) => {
    const _set = overrideSet ?? new Set(items.map(hash));
    return {
        delete: (eNode) => _set.delete(hash(eNode)),
        add: (eNode) => _set.add(hash(eNode)),
        [Symbol.iterator]: () => map(_set[Symbol.iterator](), (heNode) => unhash(heNode, setFromId)),
        _set,
        _setFromId: setFromId,
    };
};
export const unionHashset = (a, b) => makeHashset(null, a._setFromId, a._set.union(b._set));
