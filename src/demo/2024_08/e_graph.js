// e init (tree) => e-graph
// e match (pattern, e-graph) => e-node[]
// e sub (result, e-node, e-graph) => e-graph

const node = (value, ...children) => {
  const res = {
    isNode: true,
    value,
    children: children,
    parent: null,
  };
  for (const child of children) child.parent = res;
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
const nodeEq = (n1, n2) => {
  if (n1.value !== n2.value) return false;
  else if (n1.children.length !== n2.children.length) return false;
  else return n1.children.every((v, i) => nodeEq(v, n2.children[i]));
};

const a = node("f", node(1), node(2));
const b = node("f", node(1), node(2));

console.log("nodeEq!", nodeEq(a, b));

const eClassFromNode = (node, parentENode = null) => {
  const eNode = { isENode: true, value: node.value };
  eNode.children = node.children.map((n) => eClassFromNode(n, eNode));
  return {
    isEClass: true,
    eNodes: [eNode],
    parents: [parentENode],
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
