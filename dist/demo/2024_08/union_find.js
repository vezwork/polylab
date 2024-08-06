// source: https://github.com/manubb/union-find

export const sets = new Set();

export const makeSet = (item) => {
  const singleton = {
    rank: 0,
    children: [],
    item,
  };
  singleton.parent = singleton;

  sets.add(singleton);

  return singleton;
};

export const find = (node) => {
  if (node.parent !== node) node.parent = find(node.parent);

  return node.parent;
};

export const union = (node1, node2) => {
  const root1 = find(node1);
  const root2 = find(node2);
  if (root1 !== root2) {
    if (root1.rank < root2.rank) {
      root1.parent = root2;
      root2.children.push(root1);
      sets.delete(root1);
      sets.add(root2);
    } else {
      root2.parent = root1;
      root1.children.push(root2);
      if (root1.rank === root2.rank) root1.rank += 1;
      sets.delete(root2);
      sets.add(root1);
    }
  }
};

export const items = (node) => itemsHelper(find(node));
const itemsHelper = function* (node) {
  yield node.item;
  for (const child of node.children) yield* itemsHelper(child);
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
