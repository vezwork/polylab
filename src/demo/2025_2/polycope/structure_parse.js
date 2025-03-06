const stringSuffixView = (str, initOffset = 0) => {
  let offset = initOffset;
  let toString = () => str.slice(offset);
  return {
    startsWith(s) {
      return toString().startsWith(s.toString());
    },
    slice(start, end) {
      if (end) {
        // return a string
        return str.slice(start + offset, end + offset);
      } else {
        return stringSuffixView(str, offset + start);
      }
    },
    toString,
    eq(s) {
      return toString() === s.toString();
    },
    at(i) {
      return str[offset + i];
    },
    get length() {
      return str.length - offset;
    },
    get str() {
      return str;
    },
    get offset() {
      return offset;
    },
  };
};

// console.log(
//   "stringSuffixView test",
//   stringSuffixView("hello!")
//     .slice(1)
//     .slice(2)
//     .eq(stringSuffixView("yolo!").slice(2)),
//   stringSuffixView("hello!").slice(1).slice(2).length
// );

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
  for (let i = 0; i < str.length; i++) {
    const thing = str.slice(i, i + 1);
    if (["(", ")", "{", "}", "[", "]", `"`, `'`].includes(thing)) break;
    parse.push({ char: str.at(i), i: str.offset + i });
  }
  return { parse, str: str.slice(parse.length) };
};
const pStrValue = (quoteSymbol) => (str) => {
  let parse = [];
  for (let i = 0; i < str.length; i++) {
    if (str.slice(i, i + 1) === quoteSymbol) break;
    parse.push({ char: str.at(i), i: str.offset + i });
  }
  return { parse, str: str.slice(parse.length) };
};
const pRepeat = (p) => (str) => {
  let res = [];
  while (true) {
    const par = p(str);
    if (par.str.eq(str)) {
      res.forEach((a) => (a.parent = res));
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
export const pp = (str) => p(stringSuffixView(str));

console.log(pp(`12"3["22]`));
