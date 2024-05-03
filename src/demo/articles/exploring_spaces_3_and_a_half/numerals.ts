type Numerals = { numerals: bigint[]; sign: -1n | 0n | 1n; base: bigint };

const sign = (n) => (n === 0n ? 0n : n < 0n ? -1n : 1n);
const abs = (n) => (n < 0n ? -n : n);
// https://cs.stackexchange.com/a/10321
//  """Convert a positive number n to its digit representation in base b."""
const toNumerals = (n: bigint, base: bigint): Numerals => {
  let num = abs(n);
  const numerals: bigint[] = [];
  while (num > 0) {
    numerals.unshift(num % base);
    num = num / base;
  }
  return { numerals, sign: sign(n), base };
};
// """Compute the number given by digits in base b."""
const fromNumerals = ({ numerals, sign, base }: Numerals): bigint => {
  let n = 0n;
  for (const d of numerals) n = base * n + d;
  return n * sign;
};
//"""Convert the digits representation of a number from base b to base c."""
const convertBase = (numerals: Numerals, toBase: bigint) =>
  toNumerals(fromNumerals(numerals), toBase);

export type BaseExpNumerals = Numerals & { baseExponent: bigint };
export const BaseExpNumerals = (
  num: number | bigint,
  base: number | bigint,
  baseExponent: number | bigint
) => ({
  ...toNumerals(BigInt(num), BigInt(base)),
  baseExponent: BigInt(baseExponent),
});

export const changeTrailingZeroesIntoBaseExponent = ({
  numerals,
  sign,
  base,
  baseExponent,
}: BaseExpNumerals): BaseExpNumerals => {
  // address repeated 0n entries e.g. `numerals: [0n, 0n]`:
  if (sign === 0n) return { numerals: [], sign: 0n, base, baseExponent: 0n };

  const rev = numerals.toReversed();
  let numberOfZeroes = 0n;
  for (const num of rev) {
    if (num === 0n) numberOfZeroes++;
    else break;
  }
  return {
    numerals: numerals.slice(0, numerals.length - Number(numberOfZeroes)),
    sign,
    base,
    baseExponent: baseExponent + numberOfZeroes,
  };
};

type RadixNumerals = { numerals: (bigint | ".")[]; sign: bigint; base: bigint };
// produces a radix number without any trailing zeroes after the radix
export const bigNumberToRadixNumber = (big: BaseExpNumerals): RadixNumerals => {
  const { numerals, sign, base, baseExponent } =
    changeTrailingZeroesIntoBaseExponent(big);
  return {
    numerals:
      baseExponent >= 0n
        ? numerals.concat(Array(Number(baseExponent)).fill(0n))
        : Array(Math.max(0, -Number(numerals.length) - Number(baseExponent)))
            .fill(0n)
            .concat(numerals)
            .toSpliced(Number(baseExponent), 0, "."),
    sign,
    base,
  };
};
// doesn't work for over base 10 because, for e.g. [10n] and [1n, 0n] in base 11 would be displayed the same.
export const displayRadixNumeralsBase10OrLess = (radixNum: RadixNumerals) =>
  (radixNum.sign === 0n ? "0" : radixNum.sign === -1n ? "-" : "") +
  radixNum.numerals.join("");
