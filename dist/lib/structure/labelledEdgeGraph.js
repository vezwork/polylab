import * as Iter from "./Iterable.js";
export const mapIMR = (mapFrom, mapTo // TODO: what is the condition on mapFrom and mapTo?
) => (m) => ({
    to: (t2) => Iter.map(m.to(mapFrom(t2)), mapTo(t2)),
    from: (t2) => Iter.map(m.from(mapFrom(t2)), mapTo(t2)),
});
export const mapMR = (mapFrom, mapTo // TODO: what is the condition on mapFrom and mapTo?
) => (m) => (t2) => Iter.map(m(mapFrom(t2)), mapTo(t2));
// /**
//  * Conditions:
//  * - i must be in from(to(i)) & o must be in to(from(o))
//  * - R must be invertible i.e. there is inv(r) & if (r, o) in to(i) then (inv(r), i) in from(o)
//  */
// export type BidirectionalMultiRel<T, R> = {
//   to: (t: T) => Iterable<[Invertible<R>, T]>;
//   from: (t: T) => Iterable<[Invertible<R>, T]>;
// };
// const map =
//   <T, R, T2, R2>(mapper: (t: T, r: R, f: T) => [T2, R2]) =>
//   ({
//     to,
//     from,
//   }: BidirectionalMultiRel<T, R>): BidirectionalMultiRel<T2, R2> => ({
//     to: (t: T2) => Iter.map(to(t), ([r, toT]) => mapper(t, r, toT)),
//   });
// export type LabelledEdgeGraphFunctions<T, R> = ReturnType<
//   typeof makeLabelledEdgeGraphFunctions<T, R>
// >;
// export function makeLabelledEdgeGraphFunctions<T, R>({
//   to,
//   from,
// }: BidirectionalMultiRel<T, R>) {
//   const dual = makeLabelledEdgeGraphFunctions({ to: from, from: to });
//   const traverseBreadthFirst = function* (t: T): Generator<T> {
//     yield t;
//     yield* Iter.flatMap(
//       Iter.map(to(t), ([r, t]) => t),
//       traverseBreadthFirst
//     );
//   };
//   const mappedTo =
//     <R2, T2>(map: ([r, t]: [Invertible<R>, T]) => [Invertible<R2>, T2]) =>
//     (t: T): Iterable<[Invertible<R2>, T2]> =>
//       Iter.map(to(t), map);
//   const mappedFrom =
//     <R2, T2>(map: ([r, t]: [Invertible<R>, T]) => [Invertible<R2>, T2]) =>
//     (t: T): Iterable<[Invertible<R2>, T2]> =>
//       Iter.map(from(t), map);
//   const mappedGraph = <R2, T2>(
//     map: ([r, t]: [Invertible<R>, T]) => [Invertible<R2>, T2]
//   ) =>
//     makeLabelledEdgeGraphFunctions<T2, R2>({
//       to: mappedTo(map),
//       from: mappedFrom(map),
//     });
//   const filteredFrom =
//     (filter: ([r, t]: [Invertible<R>, T]) => boolean) =>
//     (t: T): Iterable<[Invertible<R>, T]> =>
//       Iter.filter(from(t), filter);
//   const filteredTo =
//     (filter: ([r, t]: [Invertible<R>, T]) => boolean) =>
//     (t: T): Iterable<[Invertible<R>, T]> =>
//       Iter.filter(to(t), filter);
//   const filteredGraph = (filter: ([r, t]: [Invertible<R>, T]) => boolean) =>
//     makeLabelledEdgeGraphFunctions<T, R>({
//       to: filteredTo(filter),
//       from: filteredFrom(filter),
//     });
//   return {
//     to,
//     from,
//     dual,
//     traverseBreadthFirst,
//     filteredGraph,
//     mappedGraph,
//   };
// }
