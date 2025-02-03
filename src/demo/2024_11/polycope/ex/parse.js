const pInside = (l, innerP, r) => (initStr) => {
  if (!initStr.startsWith(l)) return { parse: "", str: initStr };
  let str = initStr.slice(l.length);

  const res = innerP(str);
  if (!res.str.startsWith(r)) return { parse: "", str: initStr };
  res.parse.meta = { pInside: [l, r] };
  return {
    parse: [res.parse],
    str: res.str.slice(r.length),
  };
};
const pOr = (p1) => (p2) => (str) => {
  const res = p1(str);
  if (res.parse !== "") return res;
  return p2(str);
};
const pValue = (str) => {
  let parse = [];
  console.log("pvalue", str);
  for (let i = 0; i < str.length; i++) {
    const thing = str.slice(i, i + 1);
    if (["(", ")", "{", "}", "[", "]", `"`, `'`].includes(thing)) break;
    parse.push(str[i]);
  }
  return { parse, str: str.slice(parse.length) };
};
const pStrValue = (quoteSymbol) => (str) => {
  let parse = [];
  for (let i = 0; i < str.length; i++) {
    if (str.slice(i, i + 1) === quoteSymbol) break;
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
const pOrs = (...ps) =>
  ps.length === 1 ? ps[0] : pOr(ps[0])(pOrs(...ps.slice(1)));
const pParens = pInside("(", (str) => p(str), ")");
const pBraces = pInside("{", (str) => p(str), "}");
const pBrackets = pInside("[", (str) => p(str), "]");
const pDQuotes = pInside(`"`, pStrValue(`"`), `"`);
const pSQuotes = pInside(`'`, pStrValue(`'`), `'`);
const p = pRepeat(
  pOrs(pParens, pBraces, pBrackets, pDQuotes, pSQuotes, pValue)
);

console.log(p(`12"3["22]`));
