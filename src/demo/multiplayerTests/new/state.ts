// not called directly, called thru network

export type CaretHost = { deleted: boolean; readonly char: string };
let hosts: ReadonlyArray<CaretHost> = [];

export const getHosts = (): ReadonlyArray<CaretHost> =>
  hosts.filter(({ deleted }) => !deleted);

/**
 * don't call directly. Call thru caret functions.
 */
export const ins =
  (char: string) =>
  (after?: CaretHost): CaretHost => {
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
export const del = (ref: CaretHost): CaretHost => {
  ref.deleted = true;
  return ref;
};

/**
 * don't call directly. Call thru history.
 */
export const undel = (ref: CaretHost): CaretHost => {
  ref.deleted = false;
  return ref;
};
