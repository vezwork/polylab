// based on copy and pasted from src/demo/2024_07/implicit_lifting.ts

// This file demoes a little language with automatic lifting
// see examples at the bottom.
// in this demo, functions must be curried and they are called like `fname[F](arg1)[F](arg2)` etc.
// functions are defined like `wr((a) => wr((b) => a + b))`

const ARG_F = Symbol("ARG_F");
const F = Symbol("F");

const wrf = (f) => (arg) => {
  if (arg[ARG_F]) return arg[ARG_F](f);
  else return f(arg);
};
const wr = (f) => ({
  debug_f: f, // can be removed, just here for debugging
  [F]: wrf(f),
});

const plus = wr((a) => wr((b) => a + b));

const spr = (...rawArgs) => {
  // optionally make `spr` associative:
  const args = rawArgs.flatMap((rarg) => (rarg.isSpr ? rarg : [rarg]));
  args.isSpr = true;
  args[F] = (v) => spr(...args.map((arg) => arg[F](v)));
  args[ARG_F] = (f) => spr(...args.map(f));
  args.toString = () => "...(" + args.join(" ") + ")";
  return args;
};

const symb = (name) => {
  const ret = {
    name,
    toString: () => "symb::" + name,
  };
  ret[ARG_F] = (f) => unap(f, ret);
  return ret;
};
const unap = (f, arg) => {
  let args = [];
  if (arg) args.push(arg);
  const ret = {
    args: () => args,
    toString: () => "unap(" + args.join(")(") + ")",
  };
  ret[F] = (arg) => {
    args.push(arg);
    return ret;
  };
  return ret;
};

const atom = (v: any = undefined) => {
  const listeners = [];
  let myVal = v;
  const listen = (f) => listeners.unshift(f);
  const emit = (v) => listeners.forEach((f) => f(v));
  return {
    isStrm: true,
    listen,
    emit,
    value: () => myVal,
    [F]: (v) => {
      if (v.isStrm) {
        const ret = atom(myVal[F](v.value()));
        listen((f) => ret.emit(f[F](v.value())));
        v.listen((v) => ret.emit(myVal[F](v)));
        return ret;
      } else {
        const ret = atom(myVal[F](v));
        listen((f) => ret.emit(f[F](v)));
        return ret;
      }
    },
    [ARG_F]: (f) => {
      const ret = atom(f(myVal));
      listen((v) => ret.emit(f(v)));
      return ret;
    },
  };
};

// vec flattening could also be implemented in the constructor,
// taking the diagonal elements of nested vecs, but it is currently
// implemented in func and [ARG_F] more effeciently. It would work
// better, but still be less effecient, in a lazy eval language.
const vec = (...args) => {
  args.isVec = true;
  const func = (v) =>
    v.isVec
      ? vec(...args.map((arg, i) => arg[F](v[i])))
      : vec(...args.map((arg) => arg[F](v)));
  args[F] = wrf(func);
  func.isVecF = true;
  args[ARG_F] = (f) => (f.isVecF ? f(args) : vec(...args.map(wrf(f))));
  args.toString = () => "[" + args.join(" ") + "]";
  return args;
};

// in this demo, functions must be curried and they are called like `fname[F](arg1)[F](arg2)` etc.
console.log(
  "3 + ...(1 2 3)" +
    "\n" +
    plus[F](3)[F](spr(1, 2, 3)) +
    "\n" +
    "...(1 2 3) + 3" +
    "\n" +
    plus[F](spr(1, 2, 3))[F](3) +
    "\n" +
    "...(1 2) + ...(1 2 3)" +
    "\n" +
    plus[F](spr(1, 2))[F](spr(1, 2, 3)) +
    "\n" +
    "...(1 2 3) + ...(1 2)" +
    "\n" +
    plus[F](spr(1, 2, 3))[F](spr(1, 2)) +
    "\n"
);
//plus[PA](spr(3,4))[PA](vec(1,2)),
//plus[PA](plus[PA](vec(3,4))[PA](spr(1,2)))[PA](2))

console.log("2 + [10 0]" + "\n" + plus[F](2)[F](vec(10, 0)));
console.log("...(3 4) + [10 0]" + "\n" + plus[F](spr(3, 4))[F](vec(10, 0)));
console.log("[10 0] + ...(3 4)" + "\n" + plus[F](vec(10, 0))[F](spr(3, 4)));
console.log("[3 4] + [8 -11]" + "\n" + plus[F](vec(3, 4))[F](vec(8, -11)));

console.log("x + 2" + "\n" + plus[F](symb("x"))[F](2));
console.log("2 + x" + "\n" + plus[F](2)[F](symb("x")));

const s = atom();
const sNew = plus[F](s)[F](2);
console.log(sNew);
console.log("s = atom(); sNew = s + 2; s.emit('hello')");
s.listen((v) => console.log("s emitted: " + v));
sNew.listen((v) => console.log("sNew emitted: " + v));
s.emit("hello");

const a = atom("yo ");
const b = atom("cool");
const c = plus[F](a)[F](b);
const d = plus[F](c)[F]("!!!");
console.log(
  "a = atom('yo'); b = atom('cool'); c = a + b; d = c + '!!!'; a.emit('hey '); b.emit('neato')"
);
a.listen((v) => console.log("a emitted: " + v));
b.listen((v) => console.log("b emitted: " + v));
c.listen((v) => console.log("c emitted: " + v));
d.listen((v) => console.log("d emitted: " + v));
console.log("initial values of atoms", {
  a: a.value(),
  b: b.value(),
  c: c.value(),
  d: d.value(),
});
a.emit("hey ");
b.emit("neato");

const copy = (ob) => JSON.parse(JSON.stringify(ob));
const δ = wr((x) =>
  wr((f) => {
    const difFunc = (arg) => {
      const h = 0.001;
      const c1 = copy(arg);
      c1[x] += h;
      const c2 = copy(arg);
      c2[x] -= h;
      return (f(c1) - f(c2)) / (2 * h);
    };
    difFunc.isVecF = true; // so applying to vectors works e.g. `δ[F](0)[F](([x,y])=>x*y)[F](vec(3,4))`
    return wr(difFunc);
  })
);
const grad = δ[F](vec(0, 1));
// same as: `const nabla = vec(partial[F](0), partial[F](1));`

console.log(
  "hello",
  "δ1([x y] => x*y)([3 4])",
  δ[F](1)
    [F](([x, y]) => x * y)
    [F](vec(3, 4)),
  // why doesn't this work?: `grad[F](([x, y]) => x * y)[F](vec(3, 4))`
  // it would work if we actually kept track of the types I think.
  "\n",
  "grad([x y] => x*y)([3 4])",
  grad[F](([x, y]) => x * y)[F]([3, 4])
);

// I also want a language with curried named params.
