// ref: https://www.youtube.com/watch?v=6oQLRhw5Ah0&list=PLP29wDx6QmW5yfO1LAgO8kU3aQEj8SIrU
// modified from: https://codepen.io/vez/pen/XWymqjO
const thro = (er) => {
    throw er;
};
function strReverse(s) {
    return s.split("").reverse().join("");
}
// forward: IN => { result: OUT, str: IN }
// backward: OUT => { string: IN, left: OUT}
export const _ = (...parsers) => ({
    forward: (inp) => {
        let str = inp;
        let result = [];
        for (const parser of parsers) {
            const out = parser.forward(str);
            str = out.str;
            if (out.result !== null)
                result.push(out.result);
        }
        return { result, str };
    },
    backward: (resultArr) => {
        let left = resultArr;
        let string = "";
        for (const parser of parsers) {
            const out = parser.backward(left[0]);
            string += out.str;
            if (out.take === true) {
                left = left.slice(1);
            }
        }
        if (left.length > 0)
            thro("backward _ error: not fully consumed");
        return { str: string, take: true };
    },
});
export const star = (p) => ({
    forward: (inp) => {
        let str = inp;
        let result = [];
        try {
            while (true) {
                const out = p.forward(str);
                str = out.str;
                if (out.result !== null)
                    result.push(out.result);
            }
        }
        catch (e) { }
        return { result, str };
    },
    backward: (resultArr) => {
        let left = resultArr;
        let string = "";
        while (left.length > 0) {
            const out = p.backward(left[0]);
            string += out.str;
            if (out.take === true) {
                left = left.slice(1);
            }
        }
        return { str: string, take: true };
    },
});
export const plus = (p) => _(p, star(p));
export const or = (...parsers) => ({
    forward: (str) => {
        let i = 0;
        for (const parser of parsers) {
            try {
                const out = parser.forward(str);
                return { result: { out: out.result, i }, str: out.str };
            }
            catch (e) { }
            i++;
        }
        thro("or fail parsing " + str);
    },
    backward: (arg) => [...parsers][arg.i].backward(arg.out),
});
export const single = (cond, errMsg) => ({
    forward: (str) => cond(str.charAt(0))
        ? { result: str.charAt(0), str: str.slice(1) }
        : thro("single fail parsing '" + str + "' with errMsg: " + errMsg),
    backward: (resultChar) => ({ str: resultChar, take: true }),
});
export const char = (c) => single((val) => val === c, c);
export const alpha = single((val) => val.match(/[a-zA-Z]/i));
export const num = single((val) => val.match(/[0-9]/i));
export const any = single((val) => val !== "");
export const w = star(char(" "));
export const str = (chars) => _(...[...chars].map((c) => char(c)));
export const not = (p) => ({
    forward: (str) => {
        try {
            p.forward(str);
        }
        catch (e) {
            return { result: null, str };
        }
        thro("not fail parsing " + str);
    },
    backward: () => ({ str: "", take: false }),
});
export const call = (pf) => ({
    forward: (arg) => pf().forward(arg),
    backward: (arg) => pf().backward(arg),
});
export const map = (mapper) => (p) => ({
    forward: (inp) => {
        const out = p.forward(inp);
        return {
            result: mapper.forward(out.result),
            str: out.str,
        };
    },
    backward: (out) => p.backward(mapper.backward(out)),
});
export const unwrap = map({
    forward: ([val]) => val,
    backward: (val) => [val],
});
export const tryUnwrap = map({
    forward: (val) => Array.isArray(val) && val.length === 1 && !Array.isArray(val[0])
        ? val[0]
        : val,
    backward: (val) => (!Array.isArray(val) ? [val] : val),
});
export const forward = (val) => {
    const res = val.reduce((acc, o) => {
        if (typeof o === "string" &&
            o.length === 1 &&
            typeof acc.at(-1) === "string")
            acc[acc.length - 1] += o;
        else
            acc.push(o);
        return acc;
    }, []);
    console.log("flat for res", res);
    return res;
};
export const backward = (val) => {
    console.log(val);
    return val.flatMap((o) => {
        if (typeof o === "string")
            return o.split("");
        else
            return o;
    });
};
export const flatStrings = map({
    forward,
    backward,
});
export const ignore = (filler) => (p) => ({
    forward: (inp) => {
        const out = p.forward(inp);
        return {
            result: null,
            str: out.str,
        };
    },
    backward: () => ({ ...p.backward(filler), take: false }),
});
export const i_ = (...ps) => unwrap(_(...ps));
export const until = (cond) => (p) => star(i_(not(cond), p));
// const reverse = (p) => ({ str }) => {
//   const out = p({ str: strReverse(str) });
//   return { result: strReverse(out.result), str: out.str };
// };
// if " then parse string
//const jsStrBody = reverse(
//  _(not(char("\\")), s(_(not(char("\n"), any))))
//); /* anything, can't end with / */
// want: ignore comments, ignore strings, ignore balanced stuff, fail on close without open
/*
  myThing = _(
    not(char(']')),
    not(char('}')),
    not(char(')')),
    case(
      ...otherParserCases,
      [str('"'), before('"')(jsStrBody)]],
      [str("'"), before("'")(jsStrBody)]],
      [str("`"), before("`")(jsTemplateLiteralBody)]],
      [str("```"), before("```")(jsTemplateLiteralBody)]],
      [str('//'), before('\n')(s(any))]],
      [str('/*'), before('*./')(s(any))]],
      [str('//'), before('\n')(s(any))]],
      [char('['), before(']')(myThing)],
      [char('{'), before('}')(myThing)],
      [char('('), before(')')(myThing)],
      [any, nothing]
    )
  )
  */
// assumes all things in the "or" have the same backward function
export const hackOr = map({
    forward: ({ out }) => out,
    backward: (out) => ({ out, i: 0 }),
});
export const cases = (...options // should the forward be better?
) => map({
    forward: ({ out }) => out,
    backward: (out) => {
        for (let i = 0; i < options.length; i++) {
            const [fn] = options[i];
            if (fn(out))
                return { out, i };
        }
        throw "no matching case in cases backward!";
    },
})(or(...options.map(([fn, p]) => p)));
export const log = map({
    forward: (arg) => (console.log("forward", arg), arg),
    backward: (arg) => (console.log("backward", arg), arg),
});
export const marker = (message) => map({
    forward: (arg) => ({ message, arg }),
    backward: ({ message, arg }) => arg,
});
export const iw = ignore(" ")(w);
export const ichar = (c) => ignore(c)(char(c));
export const istr = (s) => ignore(s)(str(s));
export const ior = (...p) => hackOr(or(...p));
export const istar = (p) => flatStrings(star(p));
export const _headTail = (head, tail) => map({
    forward: ([fst, rest]) => fst + (rest ?? ""),
    backward: (val) => [val.charAt(0), val.slice(1)],
})(_(head, tail));
