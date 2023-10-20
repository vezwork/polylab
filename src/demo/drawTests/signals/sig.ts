type Ap<T, I, O> = {
  data: T;
  ap: (t: T) => (i: I) => O;
};
type Iap<T, TDual, I, O> = {
  data: T;
  ap: (t: T) => (i: I) => O;
  invAp: (t: TDual) => (o: O) => I;
  inv: (me: T) => TDual;
};

type EvListener<T> = (
  value: T,
  dontNotify: Set<SigListener<any>>,
  ...rest: any
) => void;
type Ev<T> = (listener: EvListener<T>) => void;
type SigListener<T> = (
  value: T,
  prevValue: T,
  dontNotify: Set<SigListener<any>>,
  ...rest: any
) => void;
export type Sig<T> = [
  () => T,
  (v: T, dontNotify?: Set<SigListener<any>>) => void,
  (listener: SigListener<T>) => void
];
// note: dontNotify is kind of a hack. Evaluating these morphisms is really doing
// a (depth-first?) graph traversal and dontNotify just ensures we don't visit the same
// (edge actually, node might be better tho) node twice. Maybe this implemenation should not be functions
// and we should just construct a graph that we can traverse.

export const VAL = 0;
export const SET = 1;
export const ONCHANGE = 2;

export const sig = <T>(data: T): Sig<T> => {
  const changeListeners: Set<SigListener<T>> = new Set();
  let val: T = data;
  const getValue = (): T => {
    return val;
  };
  const setValue = (v: T, dontNotify: Set<SigListener<any>> = new Set()) => {
    const prevVal = val;
    val = v;
    for (const l of changeListeners)
      if (!dontNotify.has(l)) l(v, prevVal, dontNotify);
  };
  const onChange = (listener: SigListener<T>) => changeListeners.add(listener);
  return [getValue, setValue, onChange];
};

//https://stackoverflow.com/a/51679156
type SigType<T> = T extends Sig<infer SigType> ? SigType : never;
type SigTypes<Tuple extends [...any[]]> = {
  [Index in keyof Tuple]: SigType<Tuple[Index]>;
} & { length: Tuple["length"] };

export const sigs = <T extends Sig<any>[]>(ss: [...T]): Sig<SigTypes<T>> => {
  const s = sig(ss.map(([val]) => val()));

  for (const [_, __, onInpChange] of ss)
    onInpChange((v, pv, dontNotify) =>
      s[SET](
        ss.map(([val]) => val()),
        dontNotify
      )
    );
  // @ts-ignore
  return s;
};

export const sigFromEv =
  <T>(ev: Ev<T>) =>
  (data: T): Sig<T> => {
    const s = sig(data);
    const [_, setVal] = s;
    ev((newVal, dontNotify) => setVal(newVal, dontNotify));
    return s;
  };

export const evFun =
  <I, O>(fun: (v: I) => O) =>
  (onInValChange: Ev<I>): Ev<O> =>
  (listener: EvListener<O>) =>
    onInValChange((newInVal, dontNotify) =>
      listener(fun(newInVal), dontNotify)
    );

export const sigIapMorphism =
  <D, I, O>({ data, ap, invAp, inv }: Iap<D, D, I, O>) =>
  (s1: Sig<I>) =>
  (s2: Sig<O>) => {
    s2[SET](ap(data)(s1[VAL]())); // only set in one direction
    const s1Listener = (v, pv, dontNotify) =>
      s2[SET](ap(data)(v), new Set([...dontNotify, s2Listener]));
    const s2Listener = (v, pv, dontNotify) =>
      s1[SET](invAp(inv(data))(v), new Set([...dontNotify, s1Listener]));
    s1[ONCHANGE](s1Listener);
    s2[ONCHANGE](s2Listener);
  };

export const sigBimorphism =
  <I, O>(oi: (v: I) => O) =>
  (io: (v: O) => I) =>
  (si: Sig<I>) =>
  (so: Sig<O>) => {
    so[SET](oi(si[VAL]())); // only set in one direction
    const s1Listener = (v, pv, dontNotify) =>
      so[SET](oi(v), new Set([...dontNotify, s2Listener]));
    const s2Listener = (v, pv, dontNotify) =>
      si[SET](io(v), new Set([...dontNotify, s1Listener]));
    si[ONCHANGE](s1Listener);
    so[ONCHANGE](s2Listener);
  };

// deprecated: now that `sigMorphism` has `dontNotify` you can
// accomplish this using two sigMorphisms
export const sigOpmorphism =
  <I, O, II, OO>(oi: (v: I) => O) =>
  (ooii: (v: II) => OO) =>
  (si: Sig<I>) =>
  (so: Sig<O>) =>
  (sii: Sig<II>) =>
  (soo: Sig<OO>) => {
    so[SET](oi(si[VAL]()));
    soo[SET](ooii(sii[VAL]()));
    const siListener = (v, pv, dontNotify) =>
      so[SET](oi(v), new Set([...dontNotify, siiListener]));
    const siiListener = (v, pv, dontNotify) =>
      soo[SET](ooii(v), new Set([...dontNotify, siListener]));
    si[ONCHANGE](siListener);
    sii[ONCHANGE](siiListener);
  };

export const sigMorphism =
  <I, O>(f: (v: I, prevVal: I) => O) =>
  (s1: Sig<I>) =>
  (
    s2: Sig<O>,
    dontNotify: () => SigListener<any>[] = () => []
  ): SigListener<I> => {
    // const initInput = s1[VAL]();
    // s2[SET](f(initInput, initInput));
    const listener = (v, prevV, dn) =>
      s2[SET](f(v, prevV), new Set([...dontNotify(), ...dn]));
    s1[ONCHANGE](listener);
    return listener;
  };

export const sigFun =
  <I, O>(f: (v: I, prevVal: I) => O) =>
  (input: Sig<I>): Sig<O> => {
    const initInput = input[VAL]();
    const output = sig<O>(f(initInput, initInput));
    sigMorphism(f)(input)(output);
    return output;
  };

export const evFilter =
  <T>(isGood: (t: T) => boolean) =>
  (onValChange: Ev<T>): Ev<T> =>
  (listener: EvListener<T>) =>
    onValChange((newVal, dontNotify) =>
      isGood(newVal) ? listener(newVal, dontNotify) : null
    );

// export const sigFilter =
//   <T>(isGood: (t: T) => boolean) =>
//   ([val, _, onValChange]: Sig<T>): Sig<T> => {
//     const s = sig(val());
//     const [__, setOutVal] = s;
//     evFilter(isGood)(onValChange)((newVal, prevVal, dontNotify) =>
//       setOutVal(newVal, dontNotify)
//     );
//     return s;
//   };
