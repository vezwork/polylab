import { EMPTY, constContainer, contain } from "./libContain.js";
export const edgeMap = new Map();
export const reverseEdgeMap = new Map();
export const edge = (from, to, path = () => undefined) => {
    const data = { from, to, path };
    edgeMap.set(from, [...(edgeMap.get(from) ?? []), data]);
    reverseEdgeMap.set(to, [...(reverseEdgeMap.get(to) ?? []), data]);
    return data;
};
const edgeData = (edge) => ("isReverse" in edge ? edge.data : edge);
const edgeTo = (edge) => "isReverse" in edge ? edge.data.from : edge.to;
export const inv = (edge) => {
    if ("isReverse" in edge)
        return edge.data;
    return { isReverse: true, data: edge };
};
export const invPath = (path) => path.map(inv).reverse();
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
export const create = (symbol) => {
    if (debugCounter.has(symbol))
        debugCounter.set(symbol, debugCounter.get(symbol) + 1);
    else
        debugCounter.set(symbol, 0);
    const createNode = {
        t: debugCounter.get(symbol),
        symbol,
    };
    //console.log("CREATING!", symbol, t.get(symbol), "FROM", visit?.visitNode);
    createNode.to = edgeToCreateFuncMap(edgeMap, symbol, "to", createNode);
    createNode.from = edgeToCreateFuncMap(reverseEdgeMap, symbol, "from", createNode);
    return createNode;
};
