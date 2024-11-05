import { hackyParse } from "./lisp.js";
import { plus, δ, grad, F, vec, atom, symb, spr } from "./implicit_lifting.js";

function isNumeric(str) {
  if (typeof str != "string") return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

const ops = {
  "+": plus,
  δ,
  "∇": grad,
};
const constructors = {
  "..": spr,
  vec,
  atom,
  symb,
};

export function hackyInterp(parsed) {
  if (parsed.op) {
    const { op, args } = parsed;
    const processedArgs = args.map(hackyInterp);
    let f = ops[op];
    if (f) {
      for (const arg of processedArgs) {
        f = f[F](arg);
      }
      return f;
    }
    const c = constructors[op];
    if (c) {
      return c(...processedArgs);
    }
  } else {
    if (isNumeric(parsed)) return parseFloat(parsed);
    else return parsed;
  }
  throw "UNEXPECTED HACKY INTERP CASE";
}
