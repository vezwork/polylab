// not called directly, called thru network
let hosts = [];
// this should really create a whole new state, not modify the existing one
export const loadFromChars = (chars) => (hosts = chars.map((char) => ({ deleted: false, char })));
export const getState = () => hosts.filter(({ deleted }) => !deleted);
/**
 * don't call directly. Call thru caret functions.
 */
export const ins = (char) => (after) => {
    const newCaretHost = { deleted: false, char };
    const newHosts = [...hosts];
    const spliceIndex = after === undefined ? 0 : hosts.indexOf(after) + 1;
    newHosts.splice(spliceIndex, 0, newCaretHost);
    hosts = newHosts;
    return newCaretHost;
};
/**
 * don't call directly. Call thru caret functions or history.
 */
export const del = (ref) => {
    ref.deleted = true;
    return ref;
};
/**
 * don't call directly. Call thru history.
 */
export const undel = (ref) => {
    ref.deleted = false;
    return ref;
};
