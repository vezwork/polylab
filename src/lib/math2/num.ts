export type Field<T> = {
  one: T;
  zero: T;
  add: (a: T) => (b: T) => T;
  neg: (a: T) => T;
  mul: (a: T) => (b: T) => T;
  inv: (b: T) => T;
};

export function makeOtherFunctions<T>({
  mul,
  nummul,
  one,
  add,
}: {
  mul: (a: T) => (b: T) => T;
  add: (a: T) => (b: T) => T;
  nummul: (n: number) => (x: T) => T;
  one: T;
}) {
  const numFact = (a: number) => (a === 0 ? 1 : a * numFact(a - 1));

  const pow =
    (a: T) =>
    (b: number): T =>
      b === 0 ? one : mul(a)(pow(a)(b - 1));
  function* convergingExp(x: T) {
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

export function makeFieldFunctions<T>({
  one,
  zero,
  add,
  neg,
  mul,
  inv,
}: Field<T>) {
  function* convergingSqrt(init: T) {
    const oneHalf = div(one)(add(one)(one));
    let cur = init;
    while (true) {
      cur = mul(oneHalf)(add(cur)(div(init)(cur)));
      yield cur;
    }
  }
  const unsuc = (a: T) => add(a)(neg(one));
  const div = (a: T) => (b: T) => mul(a)(inv(b));
  const fact = (a: T) => mul(a)(fact(unsuc(a)));

  return { convergingSqrt, div, fact };
}

// bivector stuff
type vec3 = [number, number, number];
