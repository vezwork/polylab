import { at } from "../structure/Iterable.js";
// TODO: these are actually vector space functions
// because of nummul I think
export function makeOtherFunctions({ mul, neg, zero, nummul, one, add, inv, }) {
    const numFact = (a) => (a === 0 ? 1 : a * numFact(a - 1));
    const intPow = (a) => (b) => b < 1 ? one : mul(a)(intPow(a)(b - 1));
    function* convergingExp(x) {
        let cur = one;
        let n = 1;
        while (true) {
            cur = add(cur)(nummul(1 / numFact(n))(intPow(x)(n)));
            yield cur;
            n++;
        }
    }
    const exp = (x) => at(40)(convergingExp(x));
    const div = (a) => (b) => mul(a)(inv(b));
    const divTo = (b) => (a) => mul(a)(inv(b));
    const two = add(one)(one);
    const oneHalf = div(one)(two);
    function* convergingSqrt(init) {
        let cur = init;
        while (true) {
            // hack for CtxTransform
            // @ts-ignore
            cur = mul(oneHalf, true)(add(cur)(div(init)(cur)));
            yield cur;
        }
    }
    const sqrt = (x) => at(60)(convergingSqrt(x));
    const unsuc = (a) => add(a)(neg(one));
    const fact = (a) => mul(a)(fact(unsuc(a)));
    // NOT WORKING! REQUIRES FINAL NORMALIZATION STEP
    function* convergingLn(x) {
        let cur = x;
        let k = 1;
        while (true) {
            cur = sqrt(cur);
            // hack for CtxTransform
            // @ts-ignore
            yield nummul(2 ** k)(cur);
            k++;
        }
    }
    // NOT WORKING! REQUIRES FINAL NORMALIZATION STEP
    const ln = (x) => at(60)(convergingLn(x));
    // NOT WORKING! REQUIRES LN TO BE WORKING
    // const pow = (x: T) => (n: number) => exp(nummul(n)(ln(x)));
    // n should be 0 to 1
    const fracPow = (x) => (n) => {
        let cur = x;
        let curExp = 1;
        while (Math.abs(curExp - n) > 0.001) {
            if (curExp > n) {
                cur = sqrt(cur);
                curExp = curExp / 2;
            }
            else {
                cur = mul(cur)(sqrt(cur));
                curExp = curExp + curExp / 2;
            }
        }
        return cur;
    };
    const pow = (x) => (n) => {
        let m;
        if (n < 0)
            m = -n;
        else
            m = n;
        const int = intPow(x)(m);
        const frac = fracPow(x)(m % 1);
        const res = mul(int)(frac);
        return n < 0 ? inv(res) : res;
    };
    return {
        convergingSqrt,
        convergingExp,
        convergingLn,
        pow,
        exp,
        ln,
        intPow,
        div,
        divTo,
        fact,
        sqrt,
    };
}
