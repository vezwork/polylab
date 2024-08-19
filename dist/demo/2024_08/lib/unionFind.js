// (very) modified from original source: https://github.com/manubb/union-find by Manuel Baclet

import {
  makeHashcons,
  unionHashcons,
  makeHashset,
  unionHashset,
} from "./hashcons.js";

export const find = (node) => {
  if (node.parent !== node) node.parent = find(node.parent);

  return node.parent;
};
export const parents = (node) => find(node).parents;
export const items = (node) => find(node).items;

export const makeUnionFind = () => {
  const eClasses = new Set();
  const eClassFromId = new Map();
  const eClassFromENode = makeHashcons();

  let idCounter = 0;
  const makeEClass = (eNode) => {
    const id = idCounter++;
    const newEClass = {
      isEClass: true,
      rank: 0,
      parents: makeHashcons([], eClassFromId),
      items: makeHashset([eNode], eClassFromId),
      id,
    };
    newEClass.parent = newEClass;
    eClassFromId.set(id, newEClass);

    eClasses.add(newEClass);

    for (const child of eNode.children) parents(child).set(eNode, newEClass);
    eClassFromENode.set(eNode, newEClass);

    return newEClass;
  };

  // note that this does not remove eNode/eClass fron eNode.children's parents hashcons.
  // which is necessary for fully removing the eNode from the eGraph. The reason it doesn't
  // is because this is used in rebuild, where that is not needed (based on the egg paper).
  const deleteNode = (eClass, eNode) => {
    eClassFromENode.remove(eNode);
    find(eClass).items.delete(eNode);
  };
  const addNode = (eClass, eNode) => {
    find(eClass).items.add(eNode);
    eClassFromENode.set(eNode, find(eClass));
  };

  const union = (node1, node2) => {
    const root1 = find(node1);
    const root2 = find(node2);
    if (root1 !== root2) {
      if (root1.rank < root2.rank) {
        root1.parent = root2;
        root2.parents = unionHashcons(root2.parents, root1.parents);
        root2.items = unionHashset(root2.items, root1.items);
        eClasses.delete(root1);
        eClasses.add(root2);
        return root2;
      } else {
        root2.parent = root1;
        if (root1.rank === root2.rank) root1.rank += 1;
        root1.parents = unionHashcons(root1.parents, root2.parents);
        root1.items = unionHashset(root1.items, root2.items);
        eClasses.delete(root2);
        eClasses.add(root1);
        return root1;
      }
    }
    return root1;
  };

  return {
    union,
    makeEClass,
    eClasses,
    eClassFromId,
    eClassFromENode,
    deleteNode,
    addNode,
  };
};

/* 
MIT License

Copyright (c) 2018 Manuel Baclet

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/
