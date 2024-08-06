// e init (tree) => e-graph
// e match (pattern, e-graph) => e-node[]
// e sub (result, e-node, e-graph) => e-graph

let nodeIdCounter = 0;
const nodes = new Map();

const node = (value, ...children) => {
  const hash = value + children.map((c) => ":" + c.id).join("");
  if (nodes.has(hash)) return nodes.get(hash);
  const res = {
    isNode: true,
    value,
    children: children,
    parents: [],
    id: nodeIdCounter++,
    hash,
  };
  nodes.set(hash, res);
  for (const child of children) child.parents.push(res);
  return res;
};
const vari = (v, ...children) => {
  const res = {
    isNode: true,
    var: v,
    children: children,
    parent: null,
  };
  for (const child of children) child.parent = res;
  return res;
};
const nodeEq = (n1, n2) => n1.hash === n2.hash;

const a = node("f", node(1), node(2));
const b = node("f", node(1), node(2));

console.log("nodeEq!", nodeEq(a, b));
console.log("nodes!", nodes);

let idCounter = 0;
const eClasses = new Set();
const eNodes = new Map();

const eNode = (value, ...children) => {
  const hash = value + children.map((c) => ":" + c.id).join("");
  if (eNodes.has(hash)) return nodes.get(hash);
  const res = {
    isENode: true,
    value,
    children: children,
    parents: [],
    id: nodeIdCounter++,
    hash,
  };
  nodes.set(hash, res);
  for (const child of children) child.parents.push(res);
  return res;
};

const eNodes = new Map();
let eClassIdCounter = 0;
const eClassFromNode = (node, parentENode = null) => {
  const eNode = { isENode: true, value: node.value };
  eNode.children = node.children.map((n) => eClassFromNode(n, eNode));
  const id = node.value + eNode.children.map((c) => "c" + c.id).join();
  eNodes.set(id, eNode);
  return {
    isEClass: true,
    eNodes: [eNode],
    parents: [parentENode],
    id: eClassIdCounter++,
  };
};

console.log("eClassFromNode!", eClassFromNode(a));

const eClassMatches = (patternNode, eClass) => {
  return eClass.eNodes.flatMap((en) => eNodeMatches(patternNode, en));
};
const eNodeMatches = (patternNode, eNode) => {
  if (patternNode.var === undefined && eNode.value !== patternNode.value)
    return [];
  else if (patternNode.children.length !== eNode.children.length) return [];
  else {
    const childrenMatches = eNode.children.map((ec, i) =>
      eClassMatches(patternNode.children[i], ec)
    );
    return [
      ...gogo(
        childrenMatches,
        patternNode.var ? { [patternNode.var]: eNode.value } : {}
      ),
    ];
  }
};

const gogo = function* (childrenMatches, match) {
  if (childrenMatches.length === 0) {
    yield { ...match };
    return;
  }
  for (const matches1 of childrenMatches[0]) {
    for (const matches2 of gogo(childrenMatches.slice(1))) {
      yield { ...match, ...matches1, ...matches2 };
    }
  }
};

console.log(
  "eClassMatches!",
  eClassMatches(vari("go", vari("1"), node(2)), eClassFromNode(a))
);

// Aside: the implicit lifting language could maybe really help simplify this.
