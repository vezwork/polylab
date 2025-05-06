// const LaxMin = upRel(Math.min, (a, d, b) => (a < b ? b : a), true);
// const LaxMax = upRel(Math.max, (a, d, b) => (a > b ? b : a), true);
// export const LaxGroup = (...intervals) => ({
//   l: LaxMin(...intervals.map((i) => i.l)),
//   r: LaxMax(...intervals.map((i) => i.r)),
// });
// export const LaxGroup2 = (...interval2s) => ({
//   x: LaxGroup(...interval2s.map((i2) => i2.x)),
//   y: LaxGroup(...interval2s.map((i2) => i2.y)),
// });
// doesn't work. Seems to be because min and max are not both taken into account when moving a laxgroup
// should make a 1D experiment to try to figure it out. Its not that far off.
