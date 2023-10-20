// note: dontNotify is kind of a hack. Evaluating these morphisms is really doing
// a (depth-first?) graph traversal and dontNotify just ensures we don't visit the same
// (edge actually, node might be better tho) node twice. Maybe this implemenation should not be functions
// and we should just construct a graph that we can traverse.
export const VAL = 0;
export const SET = 1;
export const ONCHANGE = 2;
export const sig = (data) => {
    const changeListeners = new Set();
    let val = data;
    const getValue = () => {
        return val;
    };
    const setValue = (v, dontNotify = new Set()) => {
        const prevVal = val;
        val = v;
        for (const l of changeListeners)
            if (!dontNotify.has(l))
                l(v, prevVal, dontNotify);
    };
    const onChange = (listener) => changeListeners.add(listener);
    return [getValue, setValue, onChange];
};
export const sigs = (ss) => {
    const s = sig(ss.map(([val]) => val()));
    for (const [_, __, onInpChange] of ss)
        onInpChange((v, pv, dontNotify) => s[SET](ss.map(([val]) => val()), dontNotify));
    // @ts-ignore
    return s;
};
export const sigFromEv = (ev) => (data) => {
    const s = sig(data);
    const [_, setVal] = s;
    ev((newVal, dontNotify) => setVal(newVal, dontNotify));
    return s;
};
export const evFun = (fun) => (onInValChange) => (listener) => onInValChange((newInVal, dontNotify) => listener(fun(newInVal), dontNotify));
export const sigIapMorphism = ({ data, ap, invAp, inv }) => (s1) => (s2) => {
    s2[SET](ap(data)(s1[VAL]())); // only set in one direction
    const s1Listener = (v, pv, dontNotify) => s2[SET](ap(data)(v), new Set([...dontNotify, s2Listener]));
    const s2Listener = (v, pv, dontNotify) => s1[SET](invAp(inv(data))(v), new Set([...dontNotify, s1Listener]));
    s1[ONCHANGE](s1Listener);
    s2[ONCHANGE](s2Listener);
};
export const sigBimorphism = (oi) => (io) => (si) => (so) => {
    so[SET](oi(si[VAL]())); // only set in one direction
    const s1Listener = (v, pv, dontNotify) => so[SET](oi(v), new Set([...dontNotify, s2Listener]));
    const s2Listener = (v, pv, dontNotify) => si[SET](io(v), new Set([...dontNotify, s1Listener]));
    si[ONCHANGE](s1Listener);
    so[ONCHANGE](s2Listener);
};
// deprecated: now that `sigMorphism` has `dontNotify` you can
// accomplish this using two sigMorphisms
export const sigOpmorphism = (oi) => (ooii) => (si) => (so) => (sii) => (soo) => {
    so[SET](oi(si[VAL]()));
    soo[SET](ooii(sii[VAL]()));
    const siListener = (v, pv, dontNotify) => so[SET](oi(v), new Set([...dontNotify, siiListener]));
    const siiListener = (v, pv, dontNotify) => soo[SET](ooii(v), new Set([...dontNotify, siListener]));
    si[ONCHANGE](siListener);
    sii[ONCHANGE](siiListener);
};
export const sigMorphism = (f) => (s1) => (s2, dontNotify = () => []) => {
    // const initInput = s1[VAL]();
    // s2[SET](f(initInput, initInput));
    const listener = (v, prevV, dn) => s2[SET](f(v, prevV), new Set([...dontNotify(), ...dn]));
    s1[ONCHANGE](listener);
    return listener;
};
export const sigFun = (f) => (input) => {
    const initInput = input[VAL]();
    const output = sig(f(initInput, initInput));
    sigMorphism(f)(input)(output);
    return output;
};
export const evFilter = (isGood) => (onValChange) => (listener) => onValChange((newVal, dontNotify) => isGood(newVal) ? listener(newVal, dontNotify) : null);
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
