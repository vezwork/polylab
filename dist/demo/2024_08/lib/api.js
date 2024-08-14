import { makeeGraph } from "./eGraph.js";
import { runRules } from "./matchEGraph.js";
import { find } from "./unionFind.js";
export const makeAPI = () => {
    const eGraph = makeeGraph();
    const { merge, printEClasses, addENode, unhash, eClassFromId, eClasses, eClassFromENode, rebuild, } = eGraph;
    const eNodesFromPatternLookup = (v, lookup) => v.var
        ? find(eClassFromENode.get(lookup[v.var]))
        : addENode(v.value, ...v.children.map((c) => eNodesFromPatternLookup(c, lookup)));
    const makeRule = ({ from, to }) => {
        const fromfrom = Array.isArray(from) ? from : [from];
        const toto = to.equations
            ? (lookup) => to.equations.forEach((equation) => equation.forEach((otherEquation) => merge(eNodesFromPatternLookup(equation[0], lookup), eNodesFromPatternLookup(otherEquation, lookup))))
            : Array.isArray(to)
                ? (lookup) => to.forEach((otherTo) => merge(eNodesFromPatternLookup(to[0], lookup), eNodesFromPatternLookup(otherTo, lookup)))
                : (lookup, eClass) => merge(eClass, eNodesFromPatternLookup(to, lookup));
        return {
            from: fromfrom,
            to: toto,
        };
    };
    const nodeAnd = (...equations) => ({ equations });
    const nodeEq = (...c) => c;
    const addRule = (r) => rules.push(makeRule(r));
    const rules = [];
    const definitions = {};
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
            setValue(arg, arg);
            todo.push(find(addENode(arg)));
            return addENode(arg);
        }
        return arg;
    }));
    const v = ([name]) => addENode(name);
    const build = (n = 3) => {
        console.debug("eClasses before build:");
        printEClasses();
        for (let i = 0; i < n; i++) {
            runRules(eClasses, rules);
            rebuild();
        }
        const newValues = new Map();
        for (const [k, v] of values) {
            newValues.set(find(k), v);
        }
        values = newValues;
        console.debug("eClasses after build:");
        printEClasses();
    };
    const evalC = (clas) => [...find(clas).parents]
        .filter(([n, c]) => values.get(find(c)) === undefined)
        .map(([n, c]) => ({
        c,
        op: n.value,
        argValues: n.children.map((c) => values.get(c)),
    }))
        .filter(({ argValues }) => !argValues.some((v) => v === undefined))
        .forEach(({ c, op, argValues }) => {
        try {
            values.set(find(c), definitions[op](...argValues) ?? true); // don't set falsy values otherwise this value will be filled in multiple times (see the filter above)
            console.debug({
                eClassId: find(c).id,
                op,
                argValues,
                resultOfOpOnArgValues: values.get(find(c)),
            });
            todo.push(find(c));
        }
        catch (e) {
            console.error(`couldn't evaluate operation: ${op}. Did you define it?`);
        }
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
    };
};
