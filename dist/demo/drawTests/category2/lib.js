"use strict";
const EMPTY = Symbol("EMPTY");
const contain = (create) => {
    const res = {
        value: EMPTY,
        create,
        get: () => {
            if (res.value !== EMPTY)
                return res.value;
            const created = create();
            res.value = created;
            return created;
        },
        set: (v) => {
            if (res.value !== EMPTY)
                throw "TRYING TO SET NON-EMPTY CONTAIN!";
            res.value = v;
            return v;
        },
    };
    return res;
};
const constContainer = (value) => ({
    value,
    get: () => value,
    set: (v) => {
        throw "TRYING TO SET NON-EMPTY CONTAIN!";
    },
});
const exampleContain = contain(() => ({}));
console.assert(exampleContain.value === EMPTY);
console.assert(exampleContain.get() === exampleContain.get());
console.assert(exampleContain.value !== EMPTY);
const exampleContain2 = contain(() => ({}));
console.assert(exampleContain2.value === EMPTY);
exampleContain2.set("hi");
console.assert(exampleContain2.get() === exampleContain2.get());
console.assert(exampleContain2.get() === "hi");
const edgeMap = new Map();
const reverseEdgeMap = new Map();
const edge = (from, to, path = () => undefined) => {
    const data = { from, to, path };
    edgeMap.set(from, [...(edgeMap.get(from) ?? []), data]);
    reverseEdgeMap.set(to, [...(reverseEdgeMap.get(to) ?? []), data]);
    return data;
};
const A = Symbol("A");
const B = Symbol("B");
edge(A, B);
edge(A, A);
console.assert(edgeMap.get(A).length === 2);
console.assert(!edgeMap.get(B));
console.assert(reverseEdgeMap.get(A).length === 1);
console.assert(reverseEdgeMap.get(B).length === 1);
console.assert(reverseEdgeMap.get(B).find((e) => edgeMap.get(A)[0] === e) !== undefined);
const edgeTo = (edge) => "isReverse" in edge ? edge.data.from : edge.to;
const inv = (edge) => {
    if ("isReverse" in edge)
        return edge.data;
    return { isReverse: true, data: edge };
};
const invPath = (path) => path.map(inv).reverse();
const applyEdge = (node, edge) => {
    //console.log(`apply `, edge, ` to `, node);
    try {
        return "isReverse" in edge
            ? node.from.get(edge.data).get()
            : node.to.get(edge).get();
    }
    catch (e) {
        console.error(`can't apply `, edge, ` to `, node, " because ", e);
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
const applyPath = (node, path) => {
    let cur = node;
    for (const edge of path)
        cur = applyEdge(cur, edge);
    return cur;
};
const mapSymbolEdges = (map, symbol, createFromEdge) => new Map(map.get(symbol).map((edge) => [edge, contain(() => createFromEdge(edge))]));
const edgeToCreateFuncMap = (map, symbol, dir, visitNode) => mapSymbolEdges(map, symbol, (edge) => {
    const edgePath = edge.path();
    if (edgePath) {
        const dirPath = dir === "from" ? invPath(edgePath) : edgePath;
        const pre = applyPath(visitNode, dirPath.slice(0, -1));
        const lastEdge = dirPath.at(-1);
        const container = checkEdge(pre, lastEdge);
        return container.value === EMPTY
            ? container.set(create(edgeTo(lastEdge), {
                visitNode: pre,
                visitEdge: lastEdge,
            }))
            : container.value;
    }
    else {
        return create(edge[dir], {
            visitNode,
            visitEdge: dir === "to" ? edge : inv(edge),
        });
    }
});
const t = new Map();
const create = (symbol, visit) => {
    if (t.has(symbol))
        t.set(symbol, t.get(symbol) + 1);
    else
        t.set(symbol, 0);
    const createNode = { t: t.get(symbol) };
    //console.log("CREATING!", symbol, t.get(symbol), "FROM", visit?.visitNode);
    const to = edgeToCreateFuncMap(edgeMap, symbol, "to", createNode);
    const from = edgeToCreateFuncMap(reverseEdgeMap, symbol, "from", createNode);
    if (visit) {
        const { visitNode, visitEdge } = visit;
        if ("isReverse" in visitEdge) {
            to.set(visitEdge.data, constContainer(visitNode));
        }
        else {
            from.set(visitEdge, constContainer(visitNode));
        }
    }
    createNode.to = to;
    createNode.from = from;
    createNode.symbol = symbol;
    return createNode;
};
const R = Symbol("R");
const G = Symbol("G");
const RR = edge(R, R);
const RG = edge(R, G);
const GR = edge(G, R, () => [inv(RG), RR]);
const r0 = create(R);
const g0 = applyPath(r0, [RG]);
tests("1: RG GR = RR", [
    "RG GR = RR",
    applyPath(r0, [RG, GR]) === applyPath(r0, [RR]),
]);
tests("2: GR goes to R", ["GR goes to R", applyPath(g0, [GR]).symbol === R]);
tests("3: GR and inv(GR)", ["GR = inv(RG) RR", applyPath(g0, [GR]) === applyPath(g0, [inv(RG), RR])], [
    "inv(GR) = inv(RR) RG",
    applyPath(r0, [inv(GR)]) === applyPath(r0, [inv(RR), RG]),
], ["RR inv(RR) = id", applyPath(r0, [RR, inv(RR)]) === r0], ["GR inv(GR) = id", applyPath(g0, [GR, inv(GR)]) === g0]);
const X = Symbol("X");
const XX = edge(X, X, () => [inv(XX)]);
const x0 = create(X);
tests("4: XX 2-cycle", ["XX = inv(XX)", applyPath(x0, [XX]) === applyPath(x0, [inv(XX)])], ["XX XX = id", x0, applyPath(x0, [XX, XX]) === x0]);
function tests(title, ...items) {
    let failures = 0;
    for (const [name, test] of items) {
        if (!test) {
            console.log(`%c❌ ${name}`, "color: red;");
            failures++;
        }
    }
    if (failures === 0)
        console.log(`%c✅ ${title}`, "font-style: bold; font-size: 16px; color: green;");
    else
        console.log(`%c❌ ${title}`, "font-style: bold; font-size: 16px; color: red;");
}
