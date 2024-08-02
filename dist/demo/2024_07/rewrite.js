"use strict";
const variable = ({ name, pred, match }) => ({
    kind: "variable",
    name,
    pred,
    match,
    withPred: (newPred) => variable({ name, pred: newPred, match }),
    withMatch: (newMatch) => variable({ name, pred, match: newMatch }),
});
const v = ([name]) => variable({ name, pred: () => true, match: (matches) => matches[name] });
const isNumber = (n) => typeof n === "number";
const MY_RULES = [
    {
        from: ["=", ["+", v `a`, v `b`], v `c`],
        to: ["=", v `a`, ["-", v `c`, v `b`]],
    },
    {
        from: ["=", ["-", v `a`, v `b`], v `c`],
        to: ["=", v `a`, ["+", v `c`, v `b`]],
    },
    {
        from: ["=", v `a`, v `b`],
        to: ["=", v `b`, v `a`],
    },
    {
        from: ["+", v `a`, v `b`],
        to: ["+", v `b`, v `a`],
    },
    {
        from: ["+", v `a`.withPred(isNumber), v `b`.withPred(isNumber)],
        to: v `a + b`.withMatch(({ a, b }) => a + b),
    },
    {
        from: ["+", v `a`, v `a`],
        to: ["*", 2, v `a`],
    },
    {
        from: ["*", v `a`, v `b`],
        to: ["*", v `b`, v `a`],
    },
    {
        from: ["=", ["*", v `a`, v `b`], v `c`],
        to: ["=", v `a`, ["/", v `c`, v `b`]],
    },
    {
        from: ["=", ["/", v `a`, v `b`], v `c`],
        to: ["=", v `a`, ["*", v `c`, v `b`]],
    },
];
const MATCH_FAIL = "MATCH_FAIL";
const match = (pattern, structure, matchesSoFar = {}) => {
    if (pattern.kind === "variable") {
        if (!pattern.pred(structure, matchesSoFar))
            return MATCH_FAIL;
        const prevMatch = pattern.match(matchesSoFar);
        if (prevMatch && JSON.stringify(prevMatch) !== JSON.stringify(structure))
            return MATCH_FAIL;
        return { [pattern.name]: structure };
    }
    else if (Array.isArray(pattern)) {
        if (!Array.isArray(structure))
            return MATCH_FAIL;
        let matches = {};
        for (let i = 0; i < pattern.length; i++) {
            const p = pattern[i];
            const s = structure[i];
            const m = match(p, s, matches);
            if (m === MATCH_FAIL)
                return MATCH_FAIL;
            matches = { ...matches, ...m };
        }
        return matches;
    }
    else {
        if (pattern !== structure)
            return MATCH_FAIL;
        return {};
    }
};
const getRecursiveMatches = (pattern, structure, res = new Map()) => {
    res.set(structure, match(pattern, structure));
    if (Array.isArray(structure))
        for (const substructure of structure)
            getRecursiveMatches(pattern, substructure, res);
    return res;
};
const SUBST_FAIL = "SUBST_FAIL";
const subst = (matches, structure) => {
    if (structure.kind === "variable")
        return structure.match(matches) ?? SUBST_FAIL;
    else if (Array.isArray(structure)) {
        const ms = structure.map((s) => subst(matches, s));
        if (ms.some((m) => m === SUBST_FAIL))
            return SUBST_FAIL;
        return ms;
    }
    else
        return structure;
};
const APPLY_FAIL = "APPLY_FAIL";
const applyRule = ({ from, to, success, failure }, structure) => {
    const m = match(from, structure);
    if (m === MATCH_FAIL) {
        if (failure)
            failure(MATCH_FAIL);
        return APPLY_FAIL;
    }
    const s = subst(m, to);
    if (s === SUBST_FAIL) {
        if (failure)
            failure(SUBST_FAIL);
        return APPLY_FAIL;
    }
    if (success)
        success();
    return s;
};
const tryAllRulesRecursively = (rules, structure) => {
    return [
        ...(Array.isArray(structure)
            ? structure.flatMap((s, i) => tryAllRulesRecursively(rules, s).map((res) => structure.with(i, res)))
            : []),
        ...rules
            .map((r) => {
            const res = applyRule(r, structure);
            if (res === APPLY_FAIL)
                return APPLY_FAIL;
            return res;
        })
            .filter((subRes) => subRes !== APPLY_FAIL),
    ];
};
const rewriteStep = (input, rules) => {
    const neue = [
        ...(Array.isArray(input[1])
            ? rewriteStep(input[1], rules).map((res) => [input[0], res, input[2]])
            : []),
        ...(Array.isArray(input[2])
            ? rewriteStep(input[2], rules).map((res) => [input[0], input[1], res])
            : []),
    ];
    for (const rule of rules) {
        const res = applyRule(rule, input);
        if (res === APPLY_FAIL)
            continue;
        neue.push(res);
    }
    return neue;
};
//const myInput = ["=", ["-", "w", 2], 3];
const myInput1 = ["=", `w`, ["-", `r`, `l`]];
const myInput2 = ["=", `c`, ["+", `l`, ["/", `w`, 2]]];
// GOAL:
// input: l, r, w = r - l, c = l + w/2
// output:
// - given: solution for l and r, given w and c.
const isVar = (x) => x === "w" || x === "r" || x === "l" || x === "c";
const sToRule = (s) => {
    const m = match(["=", v `lhs`.withPred(isVar), v `rhs`], s);
    if (m === MATCH_FAIL)
        return [];
    return [
        {
            m_name: m.lhs,
            from: v `lhs`.withPred((x) => x === m.lhs),
            to: m.rhs,
            success: () => console.log("SUCCESSFULLY APPLIED", m.lhs),
            failure: (fa) => console.log("FAIL APPLIED", fa, m.lhs),
        },
    ];
};
console.log("tryAllRulesRecursively 1", tryAllRulesRecursively(MY_RULES, "a"), tryAllRulesRecursively(MY_RULES, ["a"]));
console.log("tryAllRulesRecursively 2", tryAllRulesRecursively(MY_RULES, ["+", "a", "b"]));
console.log("sToRule 1", sToRule(["=", v `x`, ["+", 1, 2]]));
console.log("sToRule 2", sToRule(["=", ["sin", v `x`], ["+", 1, 2]]));
console.log("sToRule 3", tryAllRulesRecursively([
    {
        from: v `lhs`.withPred((x) => x.kind === "variable" && x.name === "x"),
        to: 22,
    },
], ["sin", v `x`]), tryAllRulesRecursively(sToRule(["=", v `x`, ["+", 1, 2]]), [
    "+",
    33,
    ["-", 1, v `x`],
]));
const mySet1 = new Set();
const mySet2 = new Set();
const see = (set, ob) => set.add(JSON.stringify(ob));
const isSeen = (set, ob) => set.has(JSON.stringify(ob));
const rules = [...MY_RULES];
const toTry1 = [myInput1];
const toTry2 = [myInput2];
for (let i = 0; i < 12; i++) {
    if (toTry1.length === 0 && toTry2.length === 0)
        break;
    if (toTry1.length > 0) {
        const i = toTry1.pop();
        see(mySet1, i);
        const newStructuresToTry = tryAllRulesRecursively(rules, i).filter((res) => !isSeen(mySet1, res));
        toTry1.push(...newStructuresToTry);
        rules.push(...newStructuresToTry.flatMap(sToRule));
    }
    if (toTry2.length > 0) {
        const i = toTry2.pop();
        see(mySet2, i);
        const newStructuresToTry = tryAllRulesRecursively(rules, i).filter((res) => !isSeen(mySet2, res));
        toTry2.push(...newStructuresToTry);
        rules.push(...newStructuresToTry.flatMap(sToRule));
    }
    console.log("hi", toTry1.length);
}
console.log("go go go", [...mySet1.values()].map(JSON.parse), [...mySet2.values()].map(JSON.parse), rules);
// console.log(
//   "SELECT",
//   [...mySet.values()]
//     .map(JSON.parse)
//     .filter(
//       ([[_1, v1], [_2, v2]]) => v1.kind === "variable" && v2.kind === "variable"
//     )
//     .map(([[_1, v1], [_2, v2]]) => [v1.name, v2.name])
// );
