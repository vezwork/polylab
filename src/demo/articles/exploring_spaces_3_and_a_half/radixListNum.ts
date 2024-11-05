const example = { n: [1n, 1n], radix: 1, isNeg: false };

const at = ({ n, radix }, i) => n[radix - i - 1] ?? 0n;
const framed = (a, start, end) => {
  const res = [];
  for (let i = start - 1; i >= end; i--) {
    res.push(at(a, i));
  }
  return { n: res, radix: start, isNeg: a.isNeg };
};
const lhs = ({ n, radix }) => n.slice(0, radix);
const rhs = ({ n, radix }) => n.slice(radix);
const l = ({ n, radix }) => radix;
const r = ({ n, radix }) => -(n.length - radix);
const normalizeRadix = (a) => framed(a, Math.max(l(a), 0), Math.min(r(a), 0));
const print = (a) => {
  const na = normalizeRadix(a);
  return (na.isNeg ? "-" : "") + na.n.toSpliced(na.radix, 0, ".").join("");
};

const zipRtoL = function* (a, b) {
  const max = Math.max(l(a), l(b));
  const min = Math.min(r(a), r(b));
  for (let i = min; i < max; i++) {
    yield [at(a, i), at(b, i), max - 1 - i];
  }
};
const add = (a, b, base) => {
  const n = [];
  let carry = 0n;
  const max = Math.max(l(a), l(b));
  const min = Math.min(r(a), r(b));
  for (let i = min; i < max; i++) {
    const result = at(a, i) + at(b, i) + carry;
    carry = result / base;
    n[max - 1 - i] = result % base;
  }
  if (carry !== 0n) return { n: [carry, ...n], radix: max + 1 };
  return { n, radix: max };
};
const unsignedCompare = (a, b) => {
  const max = Math.max(l(a), l(b));
  const min = Math.min(r(a), r(b));
  for (let i = max - 1; i >= min; i--) {
    if (at(a, i) > at(b, i)) return 1;
    if (at(a, i) < at(b, i)) return -1;
  }
  return 0;
};
const compare = (a, b) => {
  if (!a.isNeg && b.isNeg) return 1;
  if (a.isNeg && !b.isNeg) return -1;
  if (!a.isNeg && !b.isNeg) return unsignedCompare(a, b);
  if (a.isNeg && b.isNeg) return unsignedCompare(b, a);
};
const neg = (a) => ({ ...a, isNeg: !a.isNeg });
const sub = (a, b, base) => {
  if (a.isNeg && b.isNeg)
    return unsignedCompare(a, b) === 1
      ? neg(mainsub(a, b, base))
      : mainsub(b, a, base);
  if (!a.isNeg && !b.isNeg)
    return unsignedCompare(a, b) === 1
      ? mainsub(a, b, base)
      : neg(mainsub(b, a, base));
  if (!a.isNeg && b.isNeg) return add(a, b, base);
  if (a.isNeg && !b.isNeg) return neg(add(a, b, base));
};
// assumes `a.isNeg === b.isNeg` and `compare(a,b)===1 or 0`
const mainsub = (a, b, base) => {
  const n = [];
  let borrow = 0n;
  const max = Math.max(l(a), l(b));
  const min = Math.min(r(a), r(b));
  for (let i = min; i < max; i++) {
    const ad = at(a, i) - borrow;
    const bd = at(b, i);

    const res = ad - bd;
    if (res < 0) {
      borrow = 1n;
      n[max - 1 - i] = res + base;
    } else {
      borrow = 0n;
      n[max - 1 - i] = res;
    }
  }
  return { n, radix: max };
};
