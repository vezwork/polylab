import { applyPath, create, edge, edgeMap, inv, reverseEdgeMap, } from "./lib.js";
import { EMPTY, contain } from "./libContain.js";
const runContainTests = () => {
    const exampleContain = contain(() => ({}));
    console.assert(exampleContain.value === EMPTY);
    console.assert(exampleContain.get() === exampleContain.get());
    console.assert(exampleContain.value !== EMPTY);
    const exampleContain2 = contain(() => ({}));
    console.assert(exampleContain2.value === EMPTY);
    exampleContain2.set("hi");
    console.assert(exampleContain2.get() === exampleContain2.get());
    console.assert(exampleContain2.get() === "hi");
};
runContainTests();
const runEdgeTests = () => {
    const A = Symbol("A");
    const B = Symbol("B");
    edge(A, B);
    edge(A, A);
    console.assert(edgeMap.get(A).length === 2);
    console.assert(!edgeMap.get(B));
    console.assert(reverseEdgeMap.get(A).length === 1);
    console.assert(reverseEdgeMap.get(B).length === 1);
    console.assert(reverseEdgeMap.get(B).find((e) => edgeMap.get(A)[0] === e) !== undefined);
};
runEdgeTests();
const runTests = () => {
    const R = Symbol("R");
    const G = Symbol("G");
    const RR = edge(R, R);
    const RG = edge(R, G);
    const GR = edge(G, R, () => [inv(RG), RR]);
    const r0 = create(R);
    const g0 = applyPath(r0, [RG]);
    tests("1: RG GR = RR", [
        "RG GR = RR",
        applyPath(r0, [RG, GR]) === applyPath(r0, [RR]),
    ]);
    tests("2: GR goes to R", ["GR goes to R", applyPath(g0, [GR]).symbol === R]);
    tests("3: GR and inv(GR)", ["GR = inv(RG) RR", applyPath(g0, [GR]) === applyPath(g0, [inv(RG), RR])], [
        "inv(GR) = inv(RR) RG",
        applyPath(r0, [inv(GR)]) === applyPath(r0, [inv(RR), RG]),
    ], ["RR inv(RR) = id", applyPath(r0, [RR, inv(RR)]) === r0], ["GR inv(GR) = id", applyPath(g0, [GR, inv(GR)]) === g0]);
    const X = Symbol("X");
    const XX = edge(X, X, () => [inv(XX)]);
    const x0 = create(X);
    tests("4: XX 2-cycle", ["XX = inv(XX)", applyPath(x0, [XX]) === applyPath(x0, [inv(XX)])], ["XX XX = id", x0, applyPath(x0, [XX, XX]) === x0]);
    // NOTE: THIS DOES NOT WORK
    const A = Symbol("A");
    const AA1 = edge(A, A, () => [inv(AA1), AA2, AA1]);
    const AA2 = edge(A, A);
    const a0 = create(A); // COMMENTED OUT BECAUSE THIS DOES NOT WORK
    // tests("5: commuting edges AA1 and AA2", ["just works", applyPath(a0, [AA2])]);
    function tests(title, ...items) {
        let failures = 0;
        for (const [name, test] of items) {
            if (!test) {
                console.log(`%c❌ ${name}`, "color: red;");
                failures++;
            }
        }
        if (failures === 0)
            console.log(`%c✅ ${title}`, "font-style: bold; font-size: 16px; color: green;");
        else
            console.log(`%c❌ ${title}`, "font-style: bold; font-size: 16px; color: red;");
    }
};
runTests();
