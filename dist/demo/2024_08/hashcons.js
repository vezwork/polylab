export const hash = ({ value, children }) =>
  value + children.map((c) => ":" + c.id).join("");

export const makeHashcons = (keyValues) => {
  const _hashcons = new Map(keyValues);
  return {
    has: (eNode) => _hashcons.has(hash(eNode)),
    get: (eNode) => _hashcons.get(hash(eNode)),
    set: (eNode, eClassId) => _hashcons.set(hash(eNode), eClassId),
    remove: (eNode) => _hashcons.delete(hash(eNode)),
    [Symbol.iterator]: () => _hashcons[Symbol.iterator](),
    _hashcons,
  };
};
export const unionHashcons = (a, b) =>
  makeHashcons([...a._hashcons, ...b._hashcons]);
