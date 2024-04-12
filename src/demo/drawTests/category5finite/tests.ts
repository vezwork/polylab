import { changed, d, eq, left, mof, p, plus, right } from "./helpers.js";
import { and, mo, push } from "./lib.js";

const TEST1 = () => {
  const a1 = [9];
  const d2 = [10];
  const d3 = [];
  const d4 = [];
  const d5 = [];
  const d6 = [8];

  const d1xd2 = p(a1, d2);
  const d1xd2xd6 = p(d1xd2, d6);

  const plus10 = mo((a, b) => (b[0] = a[0] + 10));
  const minus10 = mo((a, b) => (b[0] = a[0] - 10));

  plus10(a1)(d2);
  minus10(d2)(a1);

  plus10(d2)(d3);

  plus10(d3)(d4);

  plus10(d4)(d5);

  minus10(d6)(d5);
  plus10(d5)(d6);

  console.log(
    a1[0],
    d2[0],
    d3[0],
    d4[0],
    d5[0],
    d6[0],
    [...d1xd2],
    [...d1xd2xd6]
  );
  push(a1, d2);
  console.log(
    a1[0],
    d2[0],
    d3[0],
    d4[0],
    d5[0],
    d6[0],
    [...d1xd2],
    [...d1xd2xd6]
  );
};

const TEST2 = () => {
  changed.clear();
  const test = d();
  const testa = d(1);
  const testb = d(7);
  eq(testb, plus(test, testa));
  push(...changed);
  console.log("ISSUE WHERE ORDER OF ARGS MATTERS!", test, testa, testb);
};
//TEST2();

const TEST4 = () => {
  changed.clear();

  const a = p(d(1), d(2));
  const b = p(d(), d());
  eq(left(b), plus(left(a), right(a)));

  push(...changed);
  console.log(a, b);
};
//TEST4();
