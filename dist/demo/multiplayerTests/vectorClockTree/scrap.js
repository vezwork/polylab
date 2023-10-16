"use strict";
// key data I need to maintain:
// - event trees for each id
// - mainline event tree path for each id
// - linearizedEvents
// things I need to be able to do:
// - compute a tree to tree path difference and get corresponding events from the event tree
// - insert into event tree
// - linearize events based on event tree and mainline event tree path
const comparePath = (p1, p2) => {
    for (let i = 0; i < Math.min(p1.length, p2.length); i++) {
        const p1i = p1[i];
        const p2i = p1[i];
        if (p1i === null || p2i === null)
            throw "comparePath null index encountered!"; // ewwwwwwww
        if (p1i > p2i)
            return 1;
        if (p1i < p2i)
            return -1;
    }
    if (p1.length > p2.length)
        return 1;
    if (p1.length < p2.length)
        return -1;
    return 0;
};
//import { makeTreeFunctions } from "../../../lib/structure/tree.js";
// const {
//   descendentsBreadthFirst: des,
//   hasChildren,
//   nodeAndAncestors,
//   rootIndexPath,
//   applyRootIndexPath,
// } = makeTreeFunctions<MyEvent>({
//   parent: ({ after, id }) => after[id] ?? null,
//   children: ({ myChildren }) => myChildren,
// });
// makeLineFunctions (single linked list)
// makeGraphFunctions
// const compareEv = (ev1: MyEvent, ev2: MyEvent) => {
//   ev1.after;
//   const keys = [
//     ...new Set([...Object.keys(ev1.after), ...Object.keys(ev2.after)]),
//   ].sort((key1, key2) => key2.localeCompare(key1));
//   for (const key of keys) {
//     console.log("key", ev1.after[key], ev2.after[key]);
//     console.log(1, [...rootIndexPath(ev1.after[key])]);
//     const comp = comparePath(
//       ev1.after[key] !== undefined ? [...rootIndexPath(ev1.after[key])] : [],
//       ev2.after[key] !== undefined ? [...rootIndexPath(ev2.after[key])] : []
//     );
//     if (comp > 0) return 1;
//     if (comp < 0) return -1;
//   }
//   return 0;
// };
