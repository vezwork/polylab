import { makeeGraph } from "./eGraph.js";
import { runRules } from "./matchEGraph.js";
import { find, parents } from "./unionFind.js";
const tryOrError = (f) => {
    try {
        return f();
    }
    catch (e) {
        return e;
    }
};
export const makeAPI = () => {
    const eGraph = makeeGraph();
    const { merge, printEClasses, addENode, unhash, eClassFromId, eClasses, eClassFromENode, rebuild, } = eGraph;
    const rules = [];
    const definitions = {};
    const eNodesFromPatternLookup = (v, lookup) => v.var
        ? find(eClassFromENode.get(lookup[v.var]))
        : addENode(v.value, ...v.children.map((c) => eNodesFromPatternLookup(c, lookup)));
    const makeRule = ({ from, to }) => {
        const fromfrom = Array.isArray(from) ? from : [from];
        const toto = to.equations
            ? (lookup) => to.equations.forEach((equation) => equation.forEach((otherEquation) => merge(eNodesFromPatternLookup(equation[0], lookup), eNodesFromPatternLookup(otherEquation, lookup))))
            : Array.isArray(to) // an array represents an equation `a = b`.
                ? (lookup) => to.forEach((otherTo) => merge(eNodesFromPatternLookup(to[0], lookup), eNodesFromPatternLookup(otherTo, lookup)))
                : (lookup, eClass) => merge(eClass, eNodesFromPatternLookup(to, lookup));
        return {
            from: fromfrom,
            to: toto,
        };
    };
    const makeReplaceRule = ({ from, to }) => {
        const toto = to.equations
            ? (lookup, eClass) => {
                const eNode = lookup.replaceOp;
                for (const child of eNode.children)
                    parents(child).remove(eNode);
                eGraph.deleteNode(eClass, eNode);
                to.equations.forEach((equation, i) => {
                    if (i === to.equations.length - 1) {
                        // if last expression, return it
                        merge(eClass, eNodesFromPatternLookup(Array.isArray(equation) ? equation[0] : equation, lookup));
                    }
                    if (Array.isArray(equation))
                        equation.forEach((otherTo) => {
                            merge(eNodesFromPatternLookup(equation[0], lookup), eNodesFromPatternLookup(otherTo, lookup));
                        });
                });
            }
            : Array.isArray(to) // an array represents an equation `a = b`.
                ? (lookup, eClass) => to.forEach((otherTo) => {
                    const eNode = lookup.replaceOp;
                    for (const child of eNode.children)
                        parents(child).remove(eNode);
                    eGraph.deleteNode(eClass, eNode);
                    merge(eNodesFromPatternLookup(to[0], lookup), eNodesFromPatternLookup(otherTo, lookup));
                })
                : (lookup, eClass) => {
                    const eNode = lookup.replaceOp;
                    for (const child of eNode.children)
                        parents(child).remove(eNode);
                    eGraph.deleteNode(eClass, eNode);
                    merge(eClass, eNodesFromPatternLookup(to, lookup));
                };
        return {
            from: [from],
            to: toto,
        };
    };
    const nodeAnd = (...equations) => ({ equations });
    const nodeEq = (...c) => c;
    const addRule = (r) => rules.push(makeRule(r));
    const addReplaceRule = (r) => rules.push(makeReplaceRule(r));
    const define = (key, f) => {
        definitions[key] = f;
    };
    const todo = [];
    let values = new Map();
    const setValue = (key, value) => values.set(find(addENode(key)), value);
    const valueOf = (eClass) => values.get(find(eClass));
    const eq = (...args) => merge(...args.map((arg) => {
        if (!arg.isEClass) {
            setValue(arg, arg);
            todo.push(find(addENode(arg)));
            return addENode(arg);
        }
        return arg;
    }));
    const op = (value, ...children) => addENode(value, ...children.map((arg) => {
        if (!arg.isEClass) {
            const newENodeClass = find(addENode(arg));
            setValue(arg, arg);
            todo.push(newENodeClass);
            return newENodeClass;
        }
        return arg;
    }));
    const v = ([name]) => addENode(name);
    const build = (n = 3) => {
        console.debug("eClasses before build:");
        printEClasses();
        for (let i = 0; i < n; i++) {
            let startTime = performance.now();
            runRules(eClasses, rules);
            console.debug("# eNodes:", [...eClasses].reduce((acc, cur) => acc + cur.items._set.size, 0), "# rules:", rules.length, "rules time:", performance.now() - startTime);
            startTime = performance.now();
            rebuild();
            console.debug("rebuild time:", performance.now() - startTime);
        }
        const newValues = new Map();
        for (const [k, v] of values) {
            newValues.set(find(k), v);
        }
        values = newValues;
        console.debug("eClasses after build:");
        printEClasses();
    };
    const prevValueSet = new Map();
    const evalC = (clas) => [...find(clas).parents]
        .map(([n, c]) => ({
        c,
        op: n.value,
        argValues: n.children.map((c) => values.get(c)),
    }))
        .filter(({ argValues }) => !argValues.some((v) => v === undefined))
        .forEach(({ c, op, argValues }) => {
        const prevValue = values.get(find(c));
        const newValue = tryOrError(() => definitions[op](...argValues));
        const debugInfo = {
            eClassId: find(c).id,
            op,
            argValues,
            prevValue,
            evalClassId: clas.id,
            newValue,
        };
        if (newValue instanceof Error) {
            if (definitions[op]) {
                console.error(`Error while evaluating operation \`${op}\`.`, debugInfo);
                return;
            }
            else {
                console.error(`Tried to evaluate un-defined operation \`${op}\`.`, debugInfo);
                return;
            }
        }
        if (prevValue !== undefined) {
            if (JSON.stringify(prevValue) === JSON.stringify(newValue)) {
                console.warn("prevValue === newValue", debugInfo);
                return;
            }
            else {
                console.error("conflicting value setting!!", prevValue, "!==", newValue, debugInfo, "previously set by:", prevValueSet.get(find(c)));
                return;
            }
        }
        values.set(find(c), newValue);
        prevValueSet.set(find(c), { op, argValues, evalClassId: clas.id });
        console.debug(debugInfo);
        todo.push(find(c));
        console.debug();
    });
    const evaluate = () => {
        while (todo.length > 0) {
            const next = [...todo];
            todo.length = 0;
            for (const nex of next) {
                evalC(nex);
            }
        }
    };
    return {
        eGraph,
        addRule,
        addReplaceRule,
        build,
        evaluate,
        nodeEq,
        nodeAnd,
        define,
        op,
        v,
        eq,
        valueOf,
        rules,
        definitions,
        makeRule,
        printEClasses,
        rebuild,
        eClassFromENode,
    };
};
