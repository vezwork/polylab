// connectivity tracking and checking
export const connectivity = (inverse, eq, eqEntry) => {
    // /^(t1|t2|t3|...|tn)*
    function consume(input, things, i = 0) {
        if (input.length === 0)
            return i;
        return Math.max(...things.map((t) => {
            if (matchPrefix(input, t))
                return consume(input.slice(t.length), things, i + t.length);
            else
                return i;
        }));
    }
    function matchPrefix(input, t) {
        for (let j = 0; j < t.length; j++) {
            if (input[j] === undefined || !eqEntry(input[j])(t[j]))
                return false;
        }
        return true;
    }
    const isos = (words) => {
        const out = [];
        for (const a of words) {
            for (const b of words) {
                if (eq(inverse(a))(b))
                    out.push(a);
            }
        }
        return out;
    };
    const queryConnectedness = (words, path) => consume(path, words) === path.length;
    const _addEdge = (words, path) => {
        if (path.length === 0 || words.some(eq(path)))
            return [...words];
        else
            return [...words, path];
    };
    const _addEdges = (words, ...paths) => {
        let wordsOut = [...words];
        for (const path of paths)
            wordsOut = _addEdge(wordsOut, path);
        return wordsOut;
    };
    const _addPath = (words, path) => {
        // strip prefixes and postfixes to get "connectivity content"
        const isoWords = isos(words);
        const c1 = consume(path, isoWords);
        const unprePath = path.slice(c1);
        const c2 = consume(unprePath.toReversed(), isoWords);
        const strippedPath = c2 === 0 ? unprePath : unprePath.slice(0, -c2);
        console.log("adding path!", path, strippedPath);
        if (strippedPath.length === 2) {
            return _addEdges(words, [strippedPath[0]], [strippedPath[1]], inverse([strippedPath[0]]), inverse([strippedPath[1]]));
        }
        return _addEdges(words, strippedPath);
    };
    const edge = (words, edgeData, path = undefined) => path
        ? _addPath(_addPath(words, path), inverse(path))
        : _addEdges(words, edgeData, inverse(edgeData));
    const pathedSedge = (words, edgeData, path) => queryConnectedness(words, path)
        ? edge(words, edgeData, inverse(edgeData))
        : // add fresh inverse edge (left) and pathed edge (right)
            _addPath(
            // note: I changed this from `_addEdges` to address a bug, not certain why it works tho
            _addPath(words, inverse(edgeData)), inverse([...path, ...edgeData]));
    const sedge = (words, edgeData1, edgeData2) => _addEdges(words, inverse(edgeData1), inverse(edgeData2));
    return { edge, pathedSedge, sedge, queryConnectedness, consume };
};
