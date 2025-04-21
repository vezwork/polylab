const traverseUpClasses =
  (onEdge) =>
  (...init) => {
    const queue = [...init];
    while (queue.length > 0) {
      const cur = queue.pop();
      for (const ob of cur) {
        for (const edge of upRels.get(ob) ?? []) {
          const c2 = obClass.get(edge.ob2);
          onEdge(edge);
          queue.push(c2);
        }
      }
    }
  };

const grades = new Map();
const gradeUp = (...init) =>
  traverseUpClasses((edge) => {
    const class1 = obClass.get(edge.ob1);
    const class2 = obClass.get(edge.ob2);
    grades.set(
      class2,
      Math.max(grades.get(class2) ?? 0, grades.get(class1) + 1)
    );
  })(...init);

// in union
grades.set(unionClass, Math.max(grades.get(c1), grades.get(c2)));
gradeUp(unionClass);
grades.delete(c1);
grades.delete(c2);

// in upRel
grades.set(
  obClass.get(upOb),
  Math.max(...obs.map((ob) => grades.get(obClass.get(ob))))
);

// in Ob
grades.set(0);

// CLASS STUFF:
export const obClass = new Map();

const union = (ob1, ob2) => {
  const c1 = obClass.get(ob1);
  const c2 = obClass.get(ob2);
  const unionClass = c1.union(c2);

  for (const ob of unionClass) obClass.set(ob, unionClass);
};

// in Ob
const newClass = new Set([newOb]);
obClass.set(newOb, newClass);

// in rel
union(ob1, ob2);

// in delRel
// un-union
// - add new class
const oldClass = obClass.get(edge.ob1);
const newClass = new Set();
// - set the obs connected to e.g. ob2 to the new class
traverseClass(edge.ob2, (cur) => {
  newClass.add(cur);
  oldClass.delete(cur);
});
