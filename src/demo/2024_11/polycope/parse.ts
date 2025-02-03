const pInside = (l, innerP, r) => (initStr) => {
  if (!initStr.startsWith(l)) return { parse: "", str: initStr };
  let str = initStr.slice(l.length);

  const res = innerP(str);
  if (!res.str.startsWith(r)) return { parse: "", str: initStr };
  return { parse: [res.parse], str: res.str.slice(r.length) };
};
const pOr = (p1) => (p2) => (str) => {
  const res = p1(str);
  if (res.parse !== "") return res;
  return p2(str);
};
const pValue = (str: string) => {
  let parse: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const thing = str.slice(i, i + 2);
    if (thing === "(>" || thing === "<)") break;
    parse.push(str[i]);
  }
  return { parse, str: str.slice(parse.length) };
};
const pRepeat = (p) => (str) => {
  let res = [];
  while (true) {
    const par = p(str);
    if (par.str === str) {
      return { parse: res, str };
    }
    res = res.concat(par.parse);
    str = par.str;
  }
};
const pNest = pInside("(>", (str) => pSelectionString(str), "<)");
export const pSelectionString = pRepeat(pOr(pNest)(pValue));
