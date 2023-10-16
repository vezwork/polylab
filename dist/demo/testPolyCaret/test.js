"use strict";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
const data = ["a", "b"];
function render() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = "16px monospace";
    let offsetX = 0;
    for (const d of data) {
        if (typeof d === "string") {
            ctx.fillText(d, offsetX, 20);
            offsetX += ctx.measureText(d).width + 1;
        }
        if (typeof d === "object")
            offsetX += 2 + drawTree(d, offsetX, 0);
    }
}
render();
const NODE = 8;
function drawTree(t, x, y) {
    const width = treeWidth(t);
    const pos = [x + width / 2 - NODE / 2 + 2, y];
    ctx.fillRect(...pos, NODE - 2, NODE - 2);
    let offsetX = 0;
    for (const st of t.s) {
        const stWidth = drawTree(st, x + offsetX, y + NODE * 2);
        offsetX += stWidth;
        const mid = x + offsetX - stWidth / 2;
        ctx.beginPath(); // Start a new path
        ctx.moveTo(x + width / 2 + 1, y + NODE - 2); // Move the pen to (30, 50)
        ctx.lineTo(mid + 1, y + NODE * 2); // Draw a line to (150, 100)
        ctx.stroke();
    }
    return width;
}
function treeWidth(t) {
    if (t.s.length === 0)
        return NODE;
    let width = 0;
    for (const st of t.s)
        width += treeWidth(st);
    return width;
}
document.addEventListener("keydown", (e) => {
    console.log(e.key);
    if (e.key === "Backspace")
        data.pop();
    if (e.key === "ArrowRight" && typeof data.at(-1) === "object") {
        data.at(-1).s.push({ s: [] });
    }
    if (e.key === "ArrowDown" && typeof data.at(-1) === "object") {
        let cur = data.at(-1);
        while (true) {
            if (cur.s.length === 0)
                break;
            cur = cur.s[0];
        }
        cur.s.push({ s: [] });
    }
    if (e.key === "Tab")
        data.push({
            s: [],
        });
    if (e.key.length === 1)
        data.push(e.key);
    e.preventDefault();
    render();
});
