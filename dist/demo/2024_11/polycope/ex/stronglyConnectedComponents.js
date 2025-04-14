function* dfs(start, nexts, viewedNodes = new Set()) {
    viewedNodes.add(start);
    yield { viewed: start };
    for (const edge of nexts(start)) {
        const to = edge.to;
        yield { edge };
        if (!viewedNodes.has(to))
            yield* dfs(to, nexts, viewedNodes);
        yield { afterEdge: edge };
    }
    yield { visited: start };
}
function setPop(set) {
    for (const a of set) {
        set.delete(a);
        return a;
    }
}
// Tarjan's strongly connected components alg ref: https://www.youtube.com/watch?v=wUgWX0nc4NY
export function stronglyConnectedComponents(allNodes, nexts) {
    const visitedNodes = new Set(), viewedNodes = new Set(), unviewedNodes = new Set(allNodes), backEdges = new Set(), treeEdges = new Set(), forwardEdges = new Set(), index = new Map(), low = new Map(), s = [], sccs = [], // reverse topologically sorted strongly connected components,
    sccIndex = new Map(), nodeToScc = new Map();
    let i = 0;
    const edgeToScc = new Map();
    const condensedEdges = new Set();
    const onStack = new Set();
    while (unviewedNodes.size > 0) {
        const start = setPop(unviewedNodes);
        for (const data of dfs(start, nexts)) {
            if (data.viewed) {
                const v = data.viewed;
                viewedNodes.add(v);
                unviewedNodes.delete(v);
                index.set(v, i);
                low.set(v, i);
                // v.char = i;
                i = i + 1;
                s.push(v);
                onStack.add(v);
            }
            if (data.edge) {
                const edge = data.edge;
                const from = edge.from;
                const to = edge.to;
                if (viewedNodes.has(to) && !visitedNodes.has(to))
                    backEdges.add(edge);
                else if (visitedNodes.has(to))
                    forwardEdges.add(edge);
                else
                    treeEdges.add(edge);
            }
            if (data.afterEdge) {
                const from = data.afterEdge.from;
                const to = data.afterEdge.to;
                if (onStack.has(to)) {
                    low.set(from, Math.min(low.get(from), low.get(to)));
                }
            }
            if (data.visited) {
                const v = data.visited;
                visitedNodes.add(v);
                if (low.get(v) === index.get(v)) {
                    const scc = new Set();
                    let w;
                    do {
                        w = s.pop();
                        nodeToScc.set(w, scc);
                        onStack.delete(w);
                        scc.add(w);
                    } while (w !== v);
                    for (const sccNode of scc) {
                        for (const edge of nexts(sccNode)) {
                            const from = edge.from;
                            const to = edge.to;
                            const fromScc = nodeToScc.get(from);
                            const toScc = nodeToScc.get(to);
                            if (toScc === fromScc)
                                edgeToScc.set(edge, scc);
                            else
                                condensedEdges.add(edge);
                        }
                    }
                    sccIndex.set(scc, sccs.length);
                    sccs.push(scc);
                }
            }
        }
    }
    return { sccIndex, nodeToScc, sccs };
}
export function localStronglyConnectedComponents(start, nexts, onScc, onEdge) {
    const visitedNodes = new Set(), viewedNodes = new Set(), backEdges = new Set(), treeEdges = new Set(), forwardEdges = new Set(), index = new Map(), low = new Map(), s = [], sccs = [], // reverse topologically sorted strongly connected components,
    sccIndex = new Map(), nodeToScc = new Map();
    let i = 0;
    const edgeToScc = new Map();
    const condensedEdges = new Set();
    const onStack = new Set();
    for (const data of dfs(start, nexts)) {
        if (data.viewed) {
            const v = data.viewed;
            viewedNodes.add(v);
            index.set(v, i);
            low.set(v, i);
            // v.char = i;
            i = i + 1;
            s.push(v);
            onStack.add(v);
        }
        if (data.edge) {
            const edge = data.edge;
            const from = edge.from;
            const to = edge.to;
            if (viewedNodes.has(to) && !visitedNodes.has(to))
                backEdges.add(edge);
            else if (visitedNodes.has(to))
                forwardEdges.add(edge);
            else
                treeEdges.add(edge);
        }
        if (data.afterEdge) {
            const from = data.afterEdge.from;
            const to = data.afterEdge.to;
            if (onStack.has(to)) {
                low.set(from, Math.min(low.get(from), low.get(to)));
            }
        }
        if (data.visited) {
            const v = data.visited;
            visitedNodes.add(v);
            if (low.get(v) === index.get(v)) {
                const scc = new Set();
                let w;
                do {
                    w = s.pop();
                    nodeToScc.set(w, scc);
                    onStack.delete(w);
                    scc.add(w);
                } while (w !== v);
                for (const sccNode of scc) {
                    for (const edge of nexts(sccNode)) {
                        const from = edge.from;
                        const to = edge.to;
                        const fromScc = nodeToScc.get(from);
                        const toScc = nodeToScc.get(to);
                        if (toScc === fromScc)
                            edgeToScc.set(edge, scc);
                        else
                            condensedEdges.add(edge);
                    }
                }
                sccIndex.set(scc, sccs.length);
                sccs.push([scc, v]);
            }
        }
    }
    for (const [scc, v] of sccs.toReversed()) {
        onScc(scc, v);
        for (const sccNode of scc)
            for (const edge of nexts(sccNode))
                onEdge(edge);
    }
    return { sccIndex, nodeToScc, sccs };
}
