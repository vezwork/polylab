// not called directly, called thru network

export type CaretSink = { deleted: boolean; readonly char: string };
let hosts: ReadonlyArray<CaretSink> = [];

// this should really create a whole new state, not modify the existing one
export const loadFromChars = (chars: string[]) =>
  (hosts = chars.map((char) => ({ deleted: false, char })));

export const getState = (): ReadonlyArray<CaretSink> =>
  hosts.filter(({ deleted }) => !deleted);

/**
 * don't call directly. Call thru caret functions.
 */
export const ins =
  (char: string) =>
  (after?: CaretSink): CaretSink => {
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
export const del = (ref: CaretSink): CaretSink => {
  ref.deleted = true;
  return ref;
};

/**
 * don't call directly. Call thru history.
 */
export const undel = (ref: CaretSink): CaretSink => {
  ref.deleted = false;
  return ref;
};
