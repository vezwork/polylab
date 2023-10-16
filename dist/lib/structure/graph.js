import * as Iter from "./Iterable.js";
export function makeGraphFunctions({ to, from, }) {
    const dual = makeGraphFunctions({ to: from, from: to });
    const tosDepthFirst = function* (t) {
        yield* Iter.flatMap(to(t), tosDepthFirst);
        yield t;
    };
    const tosBreadthFirst = function* (t) {
        yield t;
        yield* Iter.flatMap(to(t), tosBreadthFirst);
    };
    const mappedGraph = (map) => function* (t) {
        yield t;
        yield* Iter.flatMap(to(t), tosBreadthFirst);
    };
    const hasParent = (t) => !Iter.isEmpty(from(t));
    const hasChildren = (t) => !Iter.isEmpty(to(t));
    const filteredFrom = (filter) => (t) => Iter.filter(from(t), filter);
    const filteredTo = (filter) => (t) => Iter.filter(to(t), filter);
    const filteredGraph = (filter) => makeGraphFunctions({
        to: filteredTo(filter),
        from: filteredFrom(filter),
    });
    return {
        to,
        from,
        dual,
        tosDepthFirst,
        tosBreadthFirst,
        hasParent,
        hasChildren,
        filteredGraph,
    };
}
