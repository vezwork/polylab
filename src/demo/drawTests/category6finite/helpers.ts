import { multiple, datum, func } from "./api.js";
import { to } from "./core.js";

// IMPORTANT: Update order matters!
// e.g. if `c` updates but not `b` or `a`, then this will only set `a` with `a = c - b`.
export const plus = (a, b) => {
  const c = func((a, b) => a + b)(a, b);
  func((b, c) => c - b, a)(b, c); // IMPORTANT: the order of these last two lines matters
  //func((a, c) => c - a, b)(a, c);
  return c;
};
export const sub = (a, b) => {
  const c = [undefined];
  to(([[a, b]], c) => (c[0] = a - b))(multiple(a, b))(c);
  to(([[b, c]], a) => (a[0] = c + b))(multiple(b, c))(a); // IMPORTANT: the order of these last two lines matters
  to(([[a, c]], b) => (b[0] = a - c))(multiple(a, c))(b);
  return c;
};
export const mul = (a, b) => {
  const c = [undefined];
  to(([[a, b]], c) => (c[0] = a * b))(multiple(a, b))(c);
  to(([[b, c]], a) => (a[0] = c / b))(multiple(b, c))(a); // IMPORTANT: the order of these last two lines matters
  to(([[a, c]], b) => (b[0] = c / a))(multiple(a, c))(b);
  return c;
};
export const div = (a, b) => {
  const c = [undefined];
  to(([[a, b]], c) => (c[0] = a / b))(multiple(a, b))(c);
  to(([[b, c]], a) => (a[0] = c * b))(multiple(b, c))(a); // IMPORTANT: the order of these last two lines matters
  to(([[a, c]], b) => (b[0] = a / c))(multiple(a, c))(b);
  return c;
};

export const log = (...items: (string | any)[]) => func(console.log)(...items);
