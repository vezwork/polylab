const pNest = (initStr) => {
    if (!initStr.startsWith("(>"))
        return { parse: "", str: initStr };
    let str = initStr.slice(2);
    const res = ((str) => pSelectionString(str))(str);
    if (!res.str.startsWith("<)"))
        return { parse: "", str: initStr };
    return { parse: [res.parse], str: res.str.slice(2) };
};
const pOr = (p1) => (p2) => (str) => {
    const res = p1(str);
    if (res.parse !== "")
        return res;
    return p2(str);
};
const pValue = (str) => {
    let parse = [];
    for (let i = 0; i < str.length; i++) {
        const thing = str.slice(i, i + 2);
        if (thing === "(>" || thing === "<)")
            break;
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
export const pSelectionString = pRepeat(pOr(pNest)(pValue));
