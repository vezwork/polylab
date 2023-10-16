export function makeOtherFunctions({ mul, nummul, one, add, }) {
    const numFact = (a) => (a === 0 ? 1 : a * numFact(a - 1));
    const pow = (a) => (b) => b === 0 ? one : mul(a)(pow(a)(b - 1));
    function* convergingExp(x) {
        let cur = one;
        let n = 1;
        while (true) {
            cur = add(cur)(nummul(1 / numFact(n))(pow(x)(n)));
            yield cur;
            n++;
        }
    }
    return { convergingExp, pow };
}
export function makeFieldFunctions({ one, zero, add, neg, mul, inv, }) {
    function* convergingSqrt(init) {
        const oneHalf = div(one)(add(one)(one));
        let cur = init;
        while (true) {
            cur = mul(oneHalf)(add(cur)(div(init)(cur)));
            yield cur;
        }
    }
    const unsuc = (a) => add(a)(neg(one));
    const div = (a) => (b) => mul(a)(inv(b));
    const fact = (a) => mul(a)(fact(unsuc(a)));
    return { convergingSqrt, div, fact };
}
