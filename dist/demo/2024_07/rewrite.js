"use strict";
const match = (pattern, structure) => {
    if (structure[0] !== pattern[0])
        return false;
    const a = Array.isArray(pattern[1])
        ? match(pattern[1], structure[1])
        : { [pattern[1]]: structure[1] };
    if (!a)
        return false;
    const b = Array.isArray(pattern[2])
        ? match(pattern[2], structure[2])
        : { [pattern[2]]: structure[2] };
    if (!b)
        return false;
    return {
        ...a,
        ...b,
    };
};
const subst = (matches, [op, a, b]) => [
    op,
    Array.isArray(a) ? subst(matches, a) : matches[a],
    Array.isArray(b) ? subst(matches, b) : matches[b],
];
const rewriteStep = (input, rules) => {
    const neue = [
        ...(Array.isArray(input[1])
            ? rewriteStep(input[1], rules).map((res) => [input[0], res, input[2]])
            : []),
        ...(Array.isArray(input[2])
            ? rewriteStep(input[2], rules).map((res) => [input[0], input[1], res])
            : []),
    ];
    for (const { from, to } of rules) {
        const m = match(from, input);
        if (!m)
            continue;
        neue.push(subst(m, to));
    }
    return neue;
};
const rules = [
    {
        from: ["=", ["+", "a", "b"], "c"],
        to: ["=", "a", ["-", "c", "b"]],
    },
    {
        from: ["=", ["-", "a", "b"], "c"],
        to: ["=", "a", ["+", "c", "b"]],
    },
    {
        from: ["=", "a", "b"],
        to: ["=", "b", "a"],
    },
    {
        from: ["+", "a", "b"],
        to: ["+", "b", "a"],
    },
    /* next: {
      from: ["-", { name: "a", pred: isNum }, { name: "b", isNum }],
      to: { args: ["a", "b"], calc: (a, b)=>a-b },
    },*/
];
const mySet = new Set();
const see = (ob) => mySet.add(JSON.stringify(ob));
const isSeen = (ob) => mySet.has(JSON.stringify(ob));
const myInput = ["=", ["-", "w", 2], 3];
const toTry = [myInput];
while (toTry.length > 0) {
    const i = toTry.pop();
    see(i);
    toTry.push(...rewriteStep(i, rules).filter((res) => !isSeen(res)));
}
console.log([...mySet.values()].map(JSON.parse));
