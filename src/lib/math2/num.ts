import { at } from "../structure/Iterable.js";

export type Field<T> = {
  one: T;
  zero: T;
  add: (a: T) => (b: T) => T;
  neg: (a: T) => T;
  mul: (a: T) => (b: T) => T;
  inv: (b: T) => T;
};

// TODO: these are actually vector space functions
// because of nummul I think
export function makeOtherFunctions<T>({
  mul,
  neg,
  zero,
  nummul,
  one,
  add,
  inv,
}: {
  mul: (a: T) => (b: T) => T;
  neg: (a: T) => T;
  add: (a: T) => (b: T) => T;
  nummul: (n: number) => (x: T) => T;
  one: T;
  zero: T;
  inv: (b: T) => T;
}) {
  const numFact = (a: number) => (a === 0 ? 1 : a * numFact(a - 1));

  const intPow =
    (a: T) =>
    (b: number): T =>
      b < 1 ? one : mul(a)(intPow(a)(b - 1));
  function* convergingExp(x: T) {
    let cur = one;
    let n = 1;
    while (true) {
      cur = add(cur)(nummul(1 / numFact(n))(intPow(x)(n)));
      yield cur;
      n++;
    }
  }
  const exp = (x: T) => at(40)(convergingExp(x)) as T;

  const div = (a: T) => (b: T) => mul(a)(inv(b));
  const divTo = (b: T) => (a: T) => mul(a)(inv(b));

  const two = add(one)(one);
  const oneHalf = div(one)(two);
  function* convergingSqrt(init: T) {
    let cur = init;
    while (true) {
      // hack for CtxTransform
      // @ts-ignore
      cur = mul(oneHalf, true)(add(cur)(div(init)(cur)));
      yield cur;
    }
  }
  const sqrt = (x: T) => at(60)(convergingSqrt(x)) as T;

  const unsuc = (a: T) => add(a)(neg(one));
  const fact = (a: T) => mul(a)(fact(unsuc(a)));

  // NOT WORKING! REQUIRES FINAL NORMALIZATION STEP
  function* convergingLn(x: T) {
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
  const ln = (x: T) => at(60)(convergingLn(x)) as T;

  // NOT WORKING! REQUIRES LN TO BE WORKING
  // const pow = (x: T) => (n: number) => exp(nummul(n)(ln(x)));

  // n should be 0 to 1
  const fracPow = (x: T) => (n: number) => {
    let cur = x;
    let curExp = 1;
    while (Math.abs(curExp - n) > 0.001) {
      if (curExp > n) {
        cur = sqrt(cur);
        curExp = curExp / 2;
      } else {
        cur = mul(cur)(sqrt(cur));
        curExp = curExp + curExp / 2;
      }
    }
    return cur;
  };
  const pow = (x: T) => (n: number) => {
    if (n === 0) return one;
    let m;
    if (n < 0) m = -n;
    else m = n;
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

// bivector stuff
type vec3 = [number, number, number];
