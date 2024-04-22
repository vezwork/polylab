import { to, edgeAnds } from "./core.js";
export class Datum {
    value;
    constructor(value) {
        this.value = value;
    }
}
export const datum = (value) => new Datum(value);
export const getValue = (d) => d.value;
export const setValue = (d) => (value) => (d.value = value);
const setInnerValue = (d) => (key) => (value) => (d.value[key] = value);
const getInnerValue = (d) => (key) => d.value[key];
const getAnds = new Map();
// a lens for things you can set and get via the `ob[key]` syntax in JS.
export const accessorLens = (container) => (d, key) => {
    const and = getAnds.get(container) ?? [];
    getAnds.set(container, and);
    const toEdge = to(() => setInnerValue(container)(key)(getValue(d)))(d)(container);
    const fromEdge = to(() => setValue(d)(getInnerValue(container)(key)))(container)(d);
    and.push(toEdge);
    edgeAnds.set(toEdge, and);
    return [toEdge, fromEdge];
};
// want to make multiple datums unique
// thats an OPTIMIZATION tho
export const multiple = (...obs) => {
    const d = datum(obs.map(getValue));
    obs.forEach(accessorLens(d));
    return d;
};
const oneWayAccessorLens = (container) => (d, key) => {
    const and = getAnds.get(container) ?? [];
    getAnds.set(container, and);
    const toEdge = to(() => setInnerValue(container)(key)(getValue(d)))(d)(container);
    and.push(toEdge);
    edgeAnds.set(toEdge, and);
    return toEdge;
};
const oneWayMultiple = (...obs) => {
    const d = datum(obs.map(getValue));
    obs.forEach(oneWayAccessorLens(d));
    return d;
};
export const assign = (a, b) => {
    return to(() => setValue(b)(getValue(a)))(a)(b);
};
export const biAssign = (a, b) => {
    return [assign(a, b), assign(b, a)];
};
const isObject = (v) => typeof v === "object" && !Array.isArray(v) && v !== null;
const wrap = (v) => (isObject(v) || Array.isArray(v) ? v : datum(v));
export const func = (f, target = datum()) => (...rawArgs) => {
    const args = rawArgs.map(wrap); // make sure we can depend on all args
    const from = args.length === 1 ? args[0] : oneWayMultiple(...args);
    to(() => setValue(target)(f(...args.map(getValue))))(from)(target);
    //setResult();
    return target;
};
