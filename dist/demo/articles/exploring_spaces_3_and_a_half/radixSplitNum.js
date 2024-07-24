const leftZip = (a, b, empty = 0n) => {
    let result = [];
    const l = Math.max(a.length, b.length) + 1;
    for (let i = 1; i < l; i++) {
        result[i - 1] = [a.at(-i) ?? empty, b.at(-i) ?? empty];
    }
    return result;
};
const rightZip = (a, b, empty = 0n) => {
    let result = [];
    const l = Math.max(a.length, b.length);
    for (let i = 0; i < l; i++) {
        result[l - i - 1] = [a.at(i) ?? empty, b.at(i) ?? empty];
    }
    return result;
};
export const radixSplitNumFromNumber = (n, base) => {
    const nBaseStr = n.toString(base).split(".");
    return {
        leftOfRadix: nBaseStr[0].split("").map((c) => BigInt(c)),
        rightOfRadix: nBaseStr[1]?.split("").map((c) => BigInt(c)) ?? [],
    };
};
export const radixSplitNumAdd = (a, b, base) => {
    let carry = 0n;
    const rightOfRadix = rightZip(a.rightOfRadix, b.rightOfRadix)
        .map(([an, bn]) => {
        const result = an + bn + carry;
        carry = result / base;
        return result % base;
    })
        .toReversed();
    let leftOfRadix = leftZip(a.leftOfRadix, b.leftOfRadix)
        .map(([an, bn]) => {
        const result = an + bn + carry;
        carry = result / base;
        return result % base;
    })
        .toReversed();
    if (carry !== 0n)
        leftOfRadix = [carry].concat(leftOfRadix);
    return { leftOfRadix, rightOfRadix };
};
console.log(radixSplitNumAdd(radixSplitNumFromNumber(29.9, 10), radixSplitNumFromNumber(0.1, 10), 10n));
