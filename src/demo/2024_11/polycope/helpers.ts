export const insertAt = (str, i, char) => str.toSpliced(i, 0, char);
export const deleteAt = (str, i) => str.toSpliced(i, 1);
export const linePos = (str, curPos) => {
  let lineIndex = 0;
  let inlineIndex = 0;
  for (let i = 0; i < str.length; i++) {
    if (i < curPos) {
      inlineIndex++;
      if (str[i] === "\n") {
        lineIndex++;
        inlineIndex = 0;
      }
    }
  }
  return [inlineIndex, lineIndex];
};

export const dist = ([x1, y1], [x2, y2]) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
export const distMouseEventToEl = (e, el) => {
  const rect = el.getBoundingClientRect();
  return dist([e.clientX, e.clientY], [rect.right, rect.top]);
};
export const elTopAndBottom = (el) => {
  const rect = el.getBoundingClientRect();
  return [rect.top, rect.bottom];
};
export const vertDistPointToLineEl = (e, lineEl) => {
  const [t, b] = elTopAndBottom(lineEl);
  const p = e.clientY;
  return p >= t && p <= b ? 0 : p <= t ? t - p : p - b;
};