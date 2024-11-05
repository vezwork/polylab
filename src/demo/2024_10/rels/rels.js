import { map, concat, flatMap } from "../../../lib/structure/Iterable.js";

const rels = new Map();
const lers = new Map();

const setMapAdd = (setMap, key, value) => {
  if (!setMap.has(key)) setMap.set(key, new Set());
  setMap.get(key).add(value);
};
const mapMapSet = (setMap, key1, key2, value) => {
  if (!setMap.has(key1)) setMap.set(key1, new Map());
  setMap.get(key1).set(key2, value);
};

const rel = (from, to) => {
  const relObj = { from, to };

  setMapAdd(rels, from, relObj);
  setMapAdd(lers, to, relObj);

  return relObj;
};

const namedRels = new Map();
const namedLers = new Map();

const unrel = (relObj) => {
  const { from, to, name } = relObj;
  rels.get(from)?.delete(relObj);
  lers.get(to)?.delete(relObj);
  if (name) {
    namedRels.get(from)?.delete(name);
    namedLers.get(to)?.delete(name);
  }
};
const del = (a) => {
  for (const relObj of rels.get(a) ?? []) unrel(relObj);
  for (const relObj of lers.get(a) ?? []) unrel(relObj);
  for (const [name, relObj] of namedRels.get(a) ?? []) unrel(relObj);
  for (const [name, relObj] of namedLers.get(a) ?? []) unrel(relObj);
};

const namedRel = (from, to, name) => {
  if (namedRels.get(from)?.has(name)) unrel(namedRels.get(from)?.get(name));
  const relObj = { from, to, name };

  mapMapSet(namedRels, from, name, relObj);
  mapMapSet(namedLers, to, name, relObj);

  return relObj;
};

const replace = (old, neu) => {
  for (const relObj of lers.get(old) ?? []) {
    unrel(relObj);
    rel(relObj.from, neu);
  }
  for (const relObj of rels.get(old) ?? []) {
    unrel(relObj);
    rel(neu, relObj.to);
  }

  for (const [name, relObj] of namedLers.get(old) ?? []) {
    unrel(relObj);
    namedRel(relObj.from, neu, relObj.name);
  }
  for (const [name, relObj] of namedRels.get(old) ?? []) {
    unrel(relObj);
    namedRel(neu, relObj.to, relObj.name);
  }
};

const getRels = (a) =>
  concat(
    map(rels.get(a) ?? new Set(), ({ to }) => to),
    map(namedRels.get(a) ?? new Set(), ([_, { to }]) => to)
  );
const getLers = (a) =>
  concat(
    map(lers.get(a) ?? new Set(), ({ from }) => from),
    map(namedLers.get(a) ?? new Set(), ([_, { from }]) => from)
  );

const func = (...fromTos) => {
  const f = Symbol();
  for (const [from, to] of fromTos) namedRel(from, to, f);
  return (input) => namedRels.get(input)?.get(f)?.to;
};

const r = rel(2, 3);

namedRel(2, 19, "doggy");
namedRel(2, 17, "doggy");

const fun = func([2, 3]);

replace(3, 4);
replace(2, 4);

console.log(...getRels(2), "LERS:", ...getLers(17));
console.log(namedRels.get(2)?.get("doggy")?.to);
console.log(fun(4));
