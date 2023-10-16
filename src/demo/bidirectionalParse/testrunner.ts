export const test = (p) => (inp) => {
  console.group("bidirectional parse test");
  try {
    console.log(inp, "\n----->");
    const result = p.forward(inp).result;
    console.log(result);
    console.log("----->\n");
    console.log(p.backward(result).str);
  } finally {
    console.groupEnd();
  }
};
