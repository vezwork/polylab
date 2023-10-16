export const test = (p, parserName) => (inp) => {
    console.group("TEST: " + parserName);
    try {
        console.log(inp, "\n----->");
        const result = p.forward(inp).result;
        console.log(result);
        console.log("----->\n");
        console.log(p.backward(result).str);
    }
    finally {
        console.groupEnd();
    }
};
