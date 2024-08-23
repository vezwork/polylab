export const BUILTINS_PREFIX = `
define + as JS((a,b)=>a+b)
define - as JS((a,b)=>a-b)
rule +(a b) ==> +(b a)
rule a = +(b c) <==> b = -(a c)

define * as JS((a,b)=>a*b)
define / as JS((a,b)=>a/b)
rule *(a b) ==> *(b a)
rule a = *(b c) <==> b = /(a c)

define log as JS((...args) => {
  document.getElementById("result").innerText += JSON.stringify(args)
  return true
})

define Array as JS((...args)=>args)
define at as JS((i, arr) => arr.at(i))

JS(
    rules.push({
        from: [pvar("arr").withValue("Array")],
        to: (lookup, eClass) =>
            lookup.arr.children
            .map(find)
            .forEach((itemEClass, i) =>
                eGraph.merge(itemEClass, op("at", i, eClass))
        ),
    });  
)`;
