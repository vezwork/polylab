const error = (e) => {
  throw e;
};
const bigIntMax = (...args) => args.reduce((m, e) => (e > m ? e : m));
const bigIntMin = (...args) => args.reduce((m, e) => (e < m ? e : m));
// TODO: bigInt log ref: https://stackoverflow.com/questions/70382306/logarithm-of-a-bigint

export type SciNumber = { n: bigint; pow10: bigint };
export const sci = (n: bigint | number, pow10: bigint | number = 0n) => ({
  n: BigInt(n),
  pow10: BigInt(pow10),
});
export const fromSci = (a: SciNumber) => a.n * 10n ** a.pow10;
export const sciLowerPower = (a: SciNumber, pow10: bigint) =>
  pow10 > a.pow10
    ? error("pow10 > a.pow10")
    : {
        n: a.n * 10n ** (a.pow10 - pow10),
        pow10,
      };
export const sciAdd = (a: SciNumber, b: SciNumber) => {
  const minPow10 = bigIntMin(a.pow10, b.pow10);
  const loweredA = sciLowerPower(a, minPow10);
  const loweredB = sciLowerPower(b, minPow10);
  return {
    n: loweredA.n + loweredB.n,
    pow10: minPow10,
  };
};
export const sciSub = (a: SciNumber, b: SciNumber) => {
  const minPow10 = bigIntMin(a.pow10, b.pow10);
  const loweredA = sciLowerPower(a, minPow10);
  const loweredB = sciLowerPower(b, minPow10);
  return {
    n: loweredA.n - loweredB.n,
    pow10: minPow10,
  };
};
export const sciMul = (a: SciNumber, b: SciNumber) => ({
  n: a.n * b.n,
  pow10: a.pow10 + b.pow10,
});
// TODO: sciDiv is broken! See DIV TEST below.
// how would I even deal with 1 / 3 in this system???
const sciDiv = (a: SciNumber, b: SciNumber) => ({
  n: a.n / b.n,
  pow10: a.pow10 - b.pow10,
});
export const sciPow = (a: SciNumber, b: SciNumber) => ({
  n: a.n ** sciLowerPower(b, 0n).n,
  pow10: a.pow10 * sciLowerPower(b, 0n).n,
});
console.log("ADD TEST", sciAdd({ n: 70n, pow10: 2n }, { n: 22n, pow10: 3n }));
console.log("POW TEST", fromSci(sciPow(sci(3, 2), sci(7))) === 300n ** 7n);
console.log("MUL TEST", sciMul(sci(1), sci(2, -1)));
console.log("DIV TEST", sci(1), sci(2), sciDiv(sci(1), sci(2)));
