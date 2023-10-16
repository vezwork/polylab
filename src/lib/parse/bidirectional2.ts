// ref: https://www.youtube.com/watch?v=6oQLRhw5Ah0&list=PLP29wDx6QmW5yfO1LAgO8kU3aQEj8SIrU
// modified from: https://codepen.io/vez/pen/XWymqjO

const thro = (er) => {
  throw er;
};

// forward: IN => { result: OUT, str: IN }
// backward: OUT => { string: IN, left: OUT}
export const _ = (...parsers) => ({
  forward: (parent, inp) => {
    let str = inp;
    let result: any = [];
    result.parent = parent;
    for (const parser of parsers) {
      const out = parser.forward(result, str);
      str = out.str;
      if (out.result !== null) result.push(out.result);
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
    if (left.length > 0) thro("backward _ error: not fully consumed");
    return { str: string, take: true };
  },
});
export const star = (p) => ({
  forward: (parent, inp) => {
    let str = inp;
    let result: any = [];
    result.parent = parent;
    try {
      while (true) {
        const out = p.forward(result, str);
        str = out.str;
        if (out.result !== null) result.push(out.result);
      }
    } catch (e) {}
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
  forward: (parent, str) => {
    let i = 0;
    for (const parser of parsers) {
      try {
        const result: any = { i, parent };
        const out = parser.forward(result, str);
        result.out = out.result;
        return { result, str: out.str };
      } catch (e) {}
      i++;
    }
    thro("or fail parsing " + str);
  },
  backward: (arg) => [...parsers][arg.i].backward(arg.out),
});
export const namedOr = (obj: { [name: string]: any }) => ({
  forward: (parent, str) => {
    for (const [name, parser] of Object.entries(obj)) {
      try {
        const result: any = { name, parent };
        const out = parser.forward(result, str);
        result.out = out.result;
        return { result, str: out.str };
      } catch (e) {}
    }
    thro("or fail parsing " + str);
  },
  backward: ({ out, name }) => obj[name].backward(out),
});

export const single = (cond, errMsg?: string) => ({
  forward: (parent, str) =>
    cond(str.charAt(0))
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
  forward: (parent, str) => {
    try {
      p.forward(parent, str);
    } catch (e) {
      return { result: null, str };
    }
    thro("not fail parsing " + str);
  },
  backward: () => ({ str: "", take: false }),
});

export const call = (pf) => ({
  forward: (parent, arg) => pf().forward(parent, arg),
  backward: (arg) => pf().backward(arg),
});

export const map = (mapper) => (p) => ({
  forward: (parent, inp) => {
    const out = p.forward(parent, inp);
    return { result: mapper.forward(out.result), str: out.str };
  },
  backward: (out) => p.backward(mapper.backward(out)),
});
export const unwrap = map({
  forward: ([val]) => val,
  backward: (val) => [val],
});
export const tryUnwrap = map({
  forward: (val) =>
    Array.isArray(val) && val.length === 1 && !Array.isArray(val[0])
      ? val[0]
      : val,
  backward: (val) => (!Array.isArray(val) ? [val] : val),
});

// flatStrings map implementation
export const forward = (val) => {
  const res = val.reduce((acc, o) => {
    if (
      typeof o === "string" &&
      o.length === 1 &&
      typeof acc.at(-1) === "string"
    )
      acc[acc.length - 1] += o;
    else acc.push(o);
    return acc;
  }, []);
  return res;
};
export const backward = (val) => {
  return val.flatMap((o) => {
    if (typeof o === "string") return o.split("");
    else return o;
  });
};
export const flatStrings = map({
  forward,
  backward,
});
export const ignore = (filler) => (p) => ({
  forward: (parent, inp) => {
    const result: any = { parent };
    const out = p.forward(result, inp);
    result.result = null;
    result.str = out.str;
    return result;
  },
  backward: () => ({ ...p.backward(filler), take: false }),
});

export const i_ = (...ps) => unwrap(_(...ps));

export const until = (cond) => (p) => star(i_(not(cond), p));

// assumes all things in the "or" have the same backward function
export const hackOr = map({
  forward: ({ out }) => out,
  backward: (out) => ({ out, i: 0 }),
});

export const cases = (
  ...options // should the forward be better?
) =>
  map({
    forward: ({ out }) => out,
    backward: (out) => {
      for (let i = 0; i < options.length; i++) {
        const [fn] = options[i];
        if (fn(out)) return { out, i };
      }
      throw "no matching case in cases backward!";
    },
  })(or(...options.map(([fn, p]) => p)));

export const log = map({
  forward: (arg) => (console.log("forward", arg), arg),
  backward: (arg) => (console.log("backward", arg), arg),
});

export const marker = (message) =>
  map({
    forward: (arg) => ({ message, arg }),
    backward: ({ message, arg }) => arg,
  });

export const iw = ignore(" ")(w);
export const ichar = (c) => ignore(c)(char(c));
export const istr = (s) => ignore(s)(str(s));

export const ior = (...p) => hackOr(or(...p));
export const istar = (p) => flatStrings(star(p));

export const _headTail = (head, tail) =>
  map({
    forward: ([fst, rest]) => fst + (rest ?? ""),
    backward: (val) => [val.charAt(0), val.slice(1)],
  })(_(head, tail));
