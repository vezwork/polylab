import {
  pnode,
  pvar,
  matchRule,
  enactRuleOnMatches,
  runRules,
} from "./lib/matchEGraph.js";
import { makeAPI } from "./lib/api.js";
import { find } from "./lib/unionFind.js";

const {
  addRule,
  nodeEq,
  define,
  op,
  v,
  eGraph,
  eq,
  build,
  evaluate,
  rules,
  definitions,
  makeRule,
  printEClasses,
  valueOf,
  rebuild,
} = makeAPI();

const commute = (binaryOp) => ({
  from: pnode(binaryOp, pvar("a"), pvar("b")),
  to: pnode(binaryOp, pvar("b"), pvar("a")),
});
const associate = (binaryOp) => ({
  from: pnode(binaryOp, pvar("a"), pnode(binaryOp, pvar("b"), pvar("c"))),
  to: pnode(binaryOp, pnode(binaryOp, pvar("a"), pvar("b")), pvar("c")),
});
const removeIdentity = (binaryOp, identity) => ({
  from: pnode(binaryOp, pnode(identity), pvar("x")),
  to: pvar("x"),
});
const cancel = (unaryOp) => ({
  from: pnode(unaryOp, pnode(unaryOp, pvar("x"))),
  to: pvar("x"),
});
const cancelInverse = (unaryOp, binaryOp, identity) => ({
  from: pnode(binaryOp, pvar("a"), pnode(unaryOp, pvar("a"))),
  to: pnode(identity),
});
const distributeUnary = (unaryOp, binaryOp) => ({
  from: pnode(unaryOp, pnode(binaryOp, pvar("a"), pvar("b"))),
  to: pnode(binaryOp, pnode(unaryOp, pvar("a")), pnode(unaryOp, pvar("b"))),
});
const factorUnary = (unaryOp, binaryOp) => ({
  from: pnode(binaryOp, pnode(unaryOp, pvar("a")), pnode(unaryOp, pvar("b"))),
  to: pnode(unaryOp, pnode(binaryOp, pvar("a"), pvar("b"))),
});
const distributeBinary = (mulLikeOp, addLikeOp) => ({
  from: pnode(mulLikeOp, pvar("b"), pnode(addLikeOp, pvar("c"), pvar("d"))),
  to: pnode(
    addLikeOp,
    pnode(mulLikeOp, pvar("b"), pvar("c")),
    pnode(mulLikeOp, pvar("b"), pvar("d"))
  ),
});
const factorBinary = (mulLikeOp, addLikeOp) => ({
  from: pnode(
    addLikeOp,
    pnode(mulLikeOp, pvar("b"), pvar("c")),
    pnode(mulLikeOp, pvar("b"), pvar("d"))
  ),
  to: pnode(mulLikeOp, pvar("b"), pnode(addLikeOp, pvar("c"), pvar("d"))),
});

const isCommutative = (binaryOp) => addRule(commute(binaryOp));
const isAssociative = (binaryOp) => addRule(associate(binaryOp));
const hasIdentity = (binaryOp, identity) =>
  addRule(removeIdentity(binaryOp, identity));
const isSelfInverse = (unaryOp) => addRule(cancel(unaryOp));
const isInverseOf = (unaryOp, binaryOp, identity) => {
  addRule(cancelInverse(unaryOp, binaryOp, identity));

  //   addRule({
  //     from: nodeEq(pvar("a"), pnode(binaryOp, pvar("b"), pvar("c"))),
  //     to: nodeEq(
  //       pvar("b"),
  //       pnode(binaryOp, pvar("a"), pnode(unaryOp, pvar("c")))
  //     ),
  //   });
  //   addRule({
  //     from: nodeEq(
  //       pvar("b"),
  //       pnode(binaryOp, pvar("a"), pnode(unaryOp, pvar("c")))
  //     ),
  //     to: nodeEq(pvar("a"), pnode(binaryOp, pvar("b"), pvar("c"))),
  //   });
};
const unaryDistributesOverBinary = (unaryOp, binaryOp) => {
  addRule(distributeUnary(unaryOp, binaryOp));
  addRule(factorUnary(unaryOp, binaryOp));
};

const abelianGroup = (unaryOp, binaryOp, identity, unaryDef, binaryDef) => {
  define(binaryOp, binaryDef);
  define(unaryOp, unaryDef);
  isCommutative(binaryOp);
  isAssociative(binaryOp);
  hasIdentity(binaryOp, identity);
  isSelfInverse(unaryOp);
  unaryDistributesOverBinary(unaryOp, binaryOp);
  isInverseOf(unaryOp, binaryOp, identity);
};
const distributesOver = (mulLikeOp, addLikeOp) => {
  // distribute (opposite of factor)
  addRule(distributeBinary(mulLikeOp, addLikeOp));
  // factor (opposite of distribute)
  addRule(factorBinary(mulLikeOp, addLikeOp));
};

abelianGroup(
  "neg",
  "+",
  "0",
  (a) => -a,
  (a, b) => a + b
);
abelianGroup(
  "inv",
  "*",
  "1",
  (a) => 1 / a,
  (a, b) => a * b
);
distributesOver("*", "+");

define("log", (...args) => (console.log(...args), true)); // return true so that value propagation doesn't call this more than once.

const logValue = (varName) => op("log", varName + " =", v([varName]));

eq(
  v`lerped`,
  op("+", op("*", op("+", 1, op("neg", v`a`)), v`x0`), op("*", v`a`, v`x1`))
);
// eq(v`a`, 0.5);
eq(v`x0`, 10);
eq(v`x1`, 100);
eq(v`lerped`, 50);
// logValue("lerped");
// logValue("x0");
// logValue("x1");
// logValue("a");

build(1);

runRules(
  [op("*", v`x0`, op("+", 1, op("neg", v`a`)))],
  [makeRule(distributeBinary("*", "+"))]
);
rebuild();
// before: (x0 * (1 - a)) + ax1
// after: (x0*1 + x0*-a) + ax1
printEClasses();
runRules([op("*", v`x0`, 1)], [makeRule(commute("*"))]);
rebuild();
printEClasses();
runRules([op("*", v`x0`, 1)], [makeRule(removeIdentity("*", "1"))]);
rebuild();
printEClasses();
// before: (x0 * (1 - a)) + ax1
// after: (x0 + x0*-a) + ax1
console.log(
  "OKAY",
  find(
    op(
      "+",
      op("+", v`x0`, op("*", v`x0`, op("neg", v`a`))),
      op("*", v`a`, v`x1`)
    )
  )
);
runRules(
  [
    op(
      "+",
      op("+", v`x0`, op("*", v`x0`, op("neg", v`a`))),
      op("*", v`a`, v`x1`)
    ),
  ],
  [makeRule(commute("+"))]
);
rebuild();
runRules(
  [
    op(
      "+",
      op("*", v`a`, v`x1`),
      op("+", v`x0`, op("*", v`x0`, op("neg", v`a`)))
    ),
  ],
  [makeRule(associate("+"))]
);
printEClasses();
console.log(
  "OKAY2",
  find(
    op(
      "+",
      op("+", op("*", v`a`, v`x1`), v`x0`),
      op("*", v`x0`, op("neg", v`a`))
    )
  )
);
rebuild();
runRules(
  [
    op(
      "+",
      op("+", v`x0`, op("*", v`a`, v`x1`)),
      op("*", v`x0`, op("neg", v`a`))
    ),
  ],
  [makeRule(factorBinary(""))]
);
rebuild();

evaluate();

console.log("valueOf a", valueOf(v`a`));

// uggh this is too difficult to do right now. I will have to come back to this later
// some possibilities for improvement:
// - matching perf improvements
// - better axioms that don't blow up the e-graph as much
// - sets as a primitive in the e-graph so commuting and associating don't need to be steps
// - directly constructing e classes without a build step
// - better UX/DX around
//   - manually applying rules,
//   - printing terms,
//   - checking if rules were applied correctly,
//   - selecting eClasses to apply rules to
//   - tool for seeing how eClasses were derived from rules, how long the derivation path was
