import { applyPath, create, edge, eqEdge, eqPath, inv, invPath, rawPath, simplify, splitEdge, splits, } from "./lib.js";
import { connectivity } from "./words.js";
export let words = [];
const connect = connectivity(invPath, eqPath, eqEdge);
const linkFn = new Map();
const linkFnInv = new Map();
const symbolConstructor = new Map();
export const constructor = (fn, debugName) => {
    const symbol = Symbol(debugName);
    symbolConstructor.set(symbol, fn);
    return symbol;
};
export const consume = (path) => connect.consume(path, words);
export const isConnected = (path) => connect.queryConnectedness(words, simplify(rawPath(path)));
export const e = (from, to, path) => ({ forward, backward, }) => {
    const data = edge(from, to, () => path);
    words = connect.edge(words, rawPath([data]));
    linkFn.set(data, forward);
    linkFnInv.set(data, backward);
    return data;
};
export const se = (leftFrom, rightFrom, to, rToLPath) => ({ forward, backward, }) => {
    const split = splitEdge(leftFrom, rightFrom, () => rToLPath)(to);
    const [leftData, rightData] = split;
    if (rToLPath)
        words = connect.pathedSedge(words, rawPath([leftData]), rawPath(rToLPath));
    else
        words = connect.sedge(words, rawPath([leftData]), rawPath([rightData]));
    linkFn.set(split, forward);
    linkFnInv.set(split, backward);
    return split;
};
// const L = Symbol("L");
// const R = Symbol("R");
// const T = Symbol("T");
// const O = Symbol("O");
// const OL = Symbol("OL");
// const l_o = e(L, O);
// const ol_r = e(OL, R);
// const [l_ol, o_ol] = se(L, O, OL, [inv(l_o)]);
// const [l_t, r_t] = se(L, R, T, [inv(ol_r), inv(l_ol)]);
// console.log(
//   words,
//   rawPath([inv(l_o)]),
//   connect.queryConnectedness(words, rawPath([l_t]))
// );
// TODO: make this traverse edges not Things?
// TODO: make this not revisit Things
export function* propagateForward(start, startData = symbolConstructor.get(start)()) {
    const init = create(start);
    const workingSplits = new Map();
    const nodeData = new Map([[init, startData]]);
    const queue = [init];
    while (queue.length !== 0) {
        const currentNode = queue.shift();
        //outgoing edges only for now
        for (const [edge, toContainer] of currentNode.to.entries()) {
            const to = toContainer.get();
            const split = splits.get(edge);
            if (split) {
                const fn = linkFn.get(split);
                // check connectivity of split (should just be precomputed tho)
                const isSplitConnected = isConnected([split[0], inv(split[1])]);
                // if connected then
                if (isSplitConnected) {
                    //   check map for `(to, edge)` data.
                    //   if there is a true flag then propagate
                    if (workingSplits.get(to)?.get(split)) {
                        const toData = nodeData.get(to) ??
                            nodeData.set(to, symbolConstructor.get(to.symbol)()).get(to);
                        const fromData = split.map((e) => nodeData.get(applyPath(to, [inv(e)])));
                        fn(...fromData, toData);
                        queue.push(to);
                    }
                    else {
                        //   else save that this edge has been visited i.e. set `(to, edge): true`.
                        if (!workingSplits.has(to))
                            workingSplits.set(to, new Map());
                        workingSplits.get(to)?.set(split, true);
                    }
                }
                else {
                    // else if not connected, then propagate immediately
                    const toData = nodeData.get(to) ??
                        nodeData.set(to, symbolConstructor.get(to.symbol)()).get(to);
                    const fromData = split.map((e) => {
                        const from = applyPath(to, [inv(e)]);
                        return (nodeData.get(from) ??
                            nodeData.set(from, symbolConstructor.get(from.symbol)()).get(from));
                    });
                    fn(...fromData, toData);
                    queue.push(to);
                }
            }
            else {
                const fn = linkFn.get(edge);
                const fromData = nodeData.get(currentNode);
                const toData = nodeData.get(to) ??
                    nodeData.set(to, symbolConstructor.get(to.symbol)()).get(to);
                fn(fromData, toData);
                queue.push(to);
            }
        }
        yield [currentNode, nodeData.get(currentNode)];
    }
}
export function* propagate(start, startData = symbolConstructor.get(start)()) {
    const init = create(start);
    const visits = new Set([init]);
    const workingSplits = new Map();
    const nodeData = new Map([[init, startData]]);
    const getData = (t) => nodeData.get(t) ??
        nodeData.set(t, symbolConstructor.get(t.symbol)()).get(t);
    // note: 2nd element of entries is the path the currentNode
    // it is only necessary for `isSplitConnected` and should be
    // removed once I figure out how to construct a representative path from the
    // init of the walk to the other side of a split
    const queue = [[init, []]];
    while (queue.length !== 0) {
        const [currentNode, path] = queue.shift();
        //outgoing edges only for now
        for (const [edge, toContainer] of currentNode.to.entries()) {
            const to = toContainer.get();
            if (visits.has(to))
                continue;
            const split = splits.get(edge);
            if (split) {
                const fn = linkFn.get(split);
                // check connectivity of split (should just be precomputed tho)
                const isSplitConnected = isConnected([
                    ...path,
                    split[0],
                    inv(split[1]),
                ]);
                // if connected then
                if (isSplitConnected) {
                    //   check map for `(to, edge)` data.
                    //   if there is a true flag then propagate
                    if (workingSplits.get(to)?.get(split)) {
                        const toData = getData(to);
                        const fromData = split.map((e) => getData(applyPath(to, [inv(e)])));
                        fn(...fromData, toData);
                        visits.add(to);
                        queue.push([to, [...path, edge]]);
                    }
                    else {
                        //   else save that this edge has been visited i.e. set `(to, edge): true`.
                        if (!workingSplits.has(to))
                            workingSplits.set(to, new Map());
                        workingSplits.get(to)?.set(split, true);
                    }
                }
                else {
                    // else if not connected, then propagate immediately
                    const toData = getData(to);
                    const fromData = split.map((e) => getData(applyPath(to, [inv(e)])));
                    fn(...fromData, toData);
                    visits.add(to);
                    queue.push([to, [...path, edge]]);
                }
            }
            else {
                const fn = linkFn.get(edge);
                const fromData = getData(currentNode);
                const toData = getData(to);
                fn(fromData, toData);
                visits.add(to);
                queue.push([to, [...path, edge]]);
            }
        }
        const doneFromSplits = new Set();
        for (const [edge, fromContainer] of currentNode.from.entries()) {
            const split = splits.get(edge);
            if (doneFromSplits.has(split))
                continue;
            doneFromSplits.add(split);
            if (split) {
                const splitSources = split.map((e) => applyPath(currentNode, [inv(e)]));
                if (splitSources.some((s) => visits.has(s)))
                    continue;
                const fnInv = linkFnInv.get(split);
                const toData = getData(currentNode);
                const fromData = splitSources.map(getData);
                fnInv(toData, ...fromData);
                splitSources.forEach((s) => {
                    visits.add(s);
                    queue.push([s, [...path, inv(edge)]]);
                });
            }
            else {
                const from = fromContainer.get();
                if (visits.has(from))
                    continue;
                const fnInv = linkFnInv.get(edge);
                const fromData = getData(from);
                const toData = getData(currentNode);
                fnInv(toData, fromData);
                visits.add(from);
                queue.push([from, [...path, inv(edge)]]);
            }
        }
        yield [currentNode, nodeData.get(currentNode)];
    }
}
