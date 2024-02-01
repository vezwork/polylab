import { EMPTY, constContainer, contain } from "./libContain.js";
export const edgeMap = new Map();
export const reverseEdgeMap = new Map();
export const splits = new Map();
export const edgeData = (edge) => "isReverse" in edge ? edge.data : edge;
const edgeTo = (edge) => "isReverse" in edge ? edge.data.from : edge.to;
export const inv = (edge) => {
    if ("isReverse" in edge)
        return edge.data;
    return { isReverse: true, data: edge };
};
export const invPath = (path) => path.map(inv).reverse();
export const rawPath = (path) => path.flatMap((e) => {
    if ("isReverse" in e) {
        const path = e.data.path();
        if (path === undefined)
            return e;
        else
            return rawPath(invPath(path));
    }
    else {
        const path = e.path();
        if (path === undefined)
            return e;
        else
            return rawPath(path);
    }
});
export const eqEdge = (e1) => (e2) => "isReverse" in e1 === "isReverse" in e2 && edgeData(e1) === edgeData(e2);
export const eqPath = (path1) => (path2) => {
    const rawPath1 = rawPath(path1);
    const rawPath2 = rawPath(path2);
    if (rawPath1.length !== rawPath2.length)
        return false;
    console.log;
    for (let i = 0; i < rawPath1.length; i++)
        if (!eqEdge(rawPath1[i])(rawPath2[i]))
            return false;
    return true;
};
const applyEdge = (node, edge) => {
    //console.log(`apply `, edge, ` to `, node);
    try {
        return "isReverse" in edge
            ? node.from.get(edge.data).get()
            : node.to.get(edge).get();
    }
    catch (e) {
        console.error(`can't apply `, edge, ` to `, node, " because", "isReverse" in edge ? node.from.get(edge.data) : node.to, e);
    }
};
const checkEdge = (node, edge) => {
    //console.log(`apply `, edge, ` to `, node);
    try {
        return "isReverse" in edge ? node.from.get(edge.data) : node.to.get(edge);
    }
    catch (e) {
        console.error(`can't apply `, edge, ` to `, node);
    }
};
export const applyPath = (node, path) => {
    let cur = node;
    for (const edge of path)
        cur = applyEdge(cur, edge);
    return cur;
};
const simplifiedAppend = (path, e) => path.at(-1) && eqEdge(path.at(-1))(inv(e))
    ? path.slice(0, -1)
    : [...path, e];
export const simplify = (path) => path.reduce(simplifiedAppend, []);
export const splitEdge = (from1, from2, path2to1 = () => undefined) => (to) => {
    // add all edges
    const edge1 = edge(from1, to);
    const edge2 = edge(from2, to, () => {
        const path = path2to1();
        return path ? [...path, edge1] : undefined;
    });
    // mark each edge as split
    const split = [edge1, edge2];
    splits.set(edge1, split);
    splits.set(edge2, split);
    return split;
};
export const edge = (from, to, path = () => undefined) => {
    const data = { from, to, path };
    edgeMap.set(from, [...(edgeMap.get(from) ?? []), data]);
    reverseEdgeMap.set(to, [...(reverseEdgeMap.get(to) ?? []), data]);
    return data;
};
const mapSymbolEdges = (map, symbol, createFromEdge) => new Map((map.get(symbol) ?? []).map((edge) => [
    edge,
    contain(() => createFromEdge(edge)),
]));
const edgeToCreateFuncMap = (map, symbol, dir, visitNode) => mapSymbolEdges(map, symbol, (edge) => {
    const edgePath = edge.path();
    if (edgePath) {
        const dirPath = dir === "from" ? invPath(edgePath) : edgePath;
        const pre = applyPath(visitNode, dirPath.slice(0, -1));
        const lastEdge = dirPath.at(-1);
        const container = checkEdge(pre, lastEdge);
        const toNode = container.value === EMPTY
            ? container.set(create(edgeTo(lastEdge)))
            : container.value;
        toNode[dir === "to" ? "from" : "to"].set(edge, constContainer(visitNode));
        if ("isReverse" in lastEdge) {
            toNode.to.set(lastEdge.data, constContainer(pre));
        }
        else {
            toNode.from.set(lastEdge, constContainer(pre));
        }
        return toNode;
    }
    else {
        const toNode = create(edge[dir]);
        toNode[dir === "to" ? "from" : "to"].set(edge, constContainer(visitNode));
        return toNode;
    }
});
const debugCounter = new Map();
const useDebugCounter = (symbol) => {
    if (debugCounter.has(symbol))
        debugCounter.set(symbol, debugCounter.get(symbol) + 1);
    else
        debugCounter.set(symbol, 0);
    return debugCounter.get(symbol);
};
export const create = (symbol) => {
    const createNode = {
        t: useDebugCounter(symbol),
        symbol,
    };
    //console.log("CREATING!", symbol, t.get(symbol), "FROM", visit?.visitNode);
    createNode.to = edgeToCreateFuncMap(edgeMap, symbol, "to", createNode);
    createNode.from = edgeToCreateFuncMap(reverseEdgeMap, symbol, "from", createNode);
    return createNode;
};
