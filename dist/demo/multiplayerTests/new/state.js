// not called directly, called thru network
let hosts = [];
export const getHosts = () => hosts.filter(({ deleted }) => !deleted);
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
