export const push = (...starts) => {
    const andTrack = andTracker(...starts);
    const reachableAnds = [...andTrack.keys()];
    const sortedAnds = reachableAnds.sort((and1, and2) => andTrack.get(and1)?.has(and2) ? -1 : 1);
    const visitedNodes = new Set(starts);
    // queue entry's [0] and [1] are often redundant because Edge[1] = entry[1], but Edge can be null.
    let queue = starts.map((node) => [null, node]);
    for (const and of [[], ...sortedAnds]) {
        console.log("LOOP!");
        const e = and[0];
        if (e) {
            const [f, from, to] = e;
            visitedNodes.add(to);
            console.log("QUEUE PUSH", e);
            queue.push([e, from]);
        }
        while (queue.length > 0) {
            const [fromEdge, fromNode] = queue.shift();
            const and = get(edgeAnds, fromEdge);
            for (const [f, from, to] of and) {
                if (and.length > 0)
                    console.log("get ands", from, to);
                f(from, to);
            }
            for (const forward of get(graph, fromNode)) {
                const [f, from, toNode] = forward;
                console.log("GOING ALONG", forward);
                // don't propagate to other `and` edges when coming from an anded edge
                const backwardAnd = get(edgeAnds, edgeOp.get(forward));
                if (backwardAnd.includes(fromEdge))
                    continue;
                console.log("GOING ALONG1");
                const forwardAnd = edgeAnds.get(forward);
                // don't propagate over ands in this loop
                if (forwardAnd === undefined) {
                    // don't revisit nodes
                    if (visitedNodes.has(toNode))
                        continue;
                    visitedNodes.add(toNode);
                    // visit edge
                    f(fromNode, toNode);
                    console.log("PUSH", fromNode, toNode);
                    // go to next node
                    queue.push([forward, toNode]);
                }
            }
        }
    }
};
