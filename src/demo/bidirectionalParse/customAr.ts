import {
  _,
  _headTail,
  any,
  call,
  cases,
  char,
  flatStrings,
  i_,
  ichar,
  istar,
  iw,
  marker,
  or,
  star,
  until,
  unwrap,
} from "../../lib/parse/bidirectional1.js";
import { test } from "./testrunner.js";

const OBJECT_START = "[";
const OBJECT_END = "]";
const VALUE_END = ",";

const customArEntry = i_(
  iw,
  unwrap(
    flatStrings(
      until(or(char(VALUE_END), char(OBJECT_END)))(
        cases(
          [(a) => a?.message, call(() => marker("hi")(customAr))],
          [() => true, any]
        )
      )
    )
  ),
  ichar(VALUE_END),
  iw
);

// map({
//     forward: Object.fromEntries,
//     backward: Object.entries,
//   })
const customAr = i_(
  ichar(OBJECT_START),
  star(customArEntry),
  ichar(OBJECT_END)
);

test(customAr)("[3, [re,123,],   ,  123,  ]");
// test(customAr)("[[ 3, re, ],  123,   ]");

test(
  istar(
    cases(
      [(a) => a?.message, call(() => marker("hi")(customAr))],
      [() => true, any]
    )
  )
)(
  `const a = [ [ 3, re, ],  123,   ];
  let b = a[0]`
);
