import { SetMap } from "../../lib/structure/data.js";
import { makeSet, find, union } from "./union_find.js";

type EClassId = { id: number };
type ENode = {
  op: string;
  children: EClassId[];
  hash: string;
};

// map canonical e-nodes to e-class ids
// i.e. e-node 𝑛 ∈ 𝑀 [𝑎] ⇐⇒ 𝐻 [canonicalize(𝑛)] = find(𝑎)
const hashcons = new Map<string, EClassId>();
const parents = new Map<EClassId, Map<ENode, EClassId>>();
const worklist = new Set<EClassId>();

const mk_enode = (op: string, children: EClassId[]): ENode => ({
  op,
  children,
  hash: op + children.map((c) => "c" + c.id).join(),
});

// TODO: fix canonicalize to respect hashcons
const canonicalize = (eNode: ENode) =>
  mk_enode(eNode.op, eNode.children.map(find));
const lookup = (eNode: ENode): EClassId | undefined => hashcons.get(eNode.hash);

// eNode -> eClassId
const add = (eNode: ENode): EClassId => {
  const en = canonicalize(eNode);
  if (lookup(en)) return lookup(en)!;
  else {
    const eClassId = makeSet();
    for (const child of eNode.children)
      parents.set(
        child,
        parents.get(child)?.set(en, eClassId) ?? new Map([[en, eClassId]])
      );
    hashcons.set(en.hash, eClassId);
    return eClassId;
  }
};
const merge = (eClassId1, eClassId2) => {
  if (find(eClassId1) === find(eClassId2)) return find(eClassId1);
  const newEClassId = union(eClassId1, eClassId2);
  worklist.add(newEClassId);
  return newEClassId;
};

const rebuild = () => {
  while (worklist.size > 0) {
    const todo = [...worklist];
    worklist.clear();
    for (const eClassId of todo) repair(find(eClassId));
  }
};
const repair = (eClassId) => {
  for (const [peNode, peClassId] of parents.get(eClassId) ?? []) {
    hashcons.delete(peNode.hash);
    const newPeNode = canonicalize(peNode);
    hashcons.set(newPeNode.hash, peClassId);
  }

  const newParents = new Map<ENode, EClassId>();
  for (const [peNode, peClassId] of parents.get(eClassId) ?? []) {
    const newPeNode = canonicalize(peNode);
    if (newParents.has(newPeNode)) {
      merge(peClassId, newParents.get(newPeNode));
    }
    newParents.set(newPeNode, find(peClassId));
  }
  parents.set(eClassId, newParents);
};

//const ematch = (pattern) => [subts, eClass][]

// To apply a rewrite l → 𝑟 to an e-graph,
// ematch finds tuples (𝜎,𝑐) where e-class 𝑐 represents l[𝜎].
// Then, for each tuple, merge(𝑐, add(𝑟 [𝜎])) adds 𝑟 [𝜎] to the e-graph
// and unifies it with the matching e-class c.

add(mk_enode("1", []));
add(mk_enode("2", []));
add(mk_enode("+", [hashcons.get("1"), hashcons.get("2")]));
add(mk_enode("+", [hashcons.get("1"), hashcons.get("2")]));
rebuild();

console.log(hashcons);
