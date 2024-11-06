import { plus, δ, grad, F, vec, atom, symb, spr, wr, } from "./implicit_lifting.js";
function isNumeric(str) {
    if (typeof str != "string")
        return false; // we only process strings!
    return (!isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))); // ...and ensure strings of whitespace fail
}
const ops = {
    "+": plus,
    δ,
    atom: wr(atom),
    "∇": grad,
    div: wr((id) => wr((val) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = val;
            return el;
        }
        else {
            const newEl = document.createElement("div");
            document.body.append(newEl);
            newEl.id = id;
            newEl.innerText = val;
            return newEl;
        }
    })),
};
const defs = {};
const constructors = {
    "..": spr,
    vec,
    symb,
    def: (name, val) => {
        defs[name] = hackyInterp(val);
        return ["def", name, hackyInterp(val)];
    },
    emit: (atm, val) => atm.emit(val),
    log: console.log,
    listen: (atm, listener) => atm.listen(listener),
};
export function hackyInterp(parsed) {
    if (parsed.op) {
        const { op, args, js } = parsed;
        if (op === "JS") {
            return eval(js);
        }
        const processedArgs = args.map(hackyInterp);
        let f = ops[op];
        if (defs[op]) {
            f = defs[op];
            for (const arg of processedArgs) {
                f = f[F](arg);
            }
            return f;
        }
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
    }
    else {
        if (isNumeric(parsed))
            return parseFloat(parsed);
        else if (defs[parsed])
            return defs[parsed];
        else
            return parsed;
    }
    throw "UNEXPECTED HACKY INTERP CASE";
}
