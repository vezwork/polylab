import { add, assign } from "../../../lib/math/Vec2.js";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
const GRAVITY = 0.01;
const player = {
    pos: [30, 20],
    spd: [0, 0],
};
const squares = [
    Array(20).fill("air"),
    Array(20).fill("air"),
    Array(20).fill("ground", 0, 10).fill("air", 10, 20),
    Array(20).fill("ground", 0, 10).fill("air", 10, 20),
];
const keysDown = {};
document.addEventListener("keydown", (e) => {
    keysDown[e.key] = true;
});
document.addEventListener("keyup", (e) => {
    keysDown[e.key] = false;
});
draw();
function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, c.width, c.height);
    assign(player.pos)(add(player.pos, player.spd));
    const sqrSpaceL = Math.floor(player.pos[0] / 40);
    const sqrSpaceR = Math.floor((player.pos[0] + 40) / 40);
    const sqrSpaceM = Math.floor((player.pos[0] + 20) / 40);
    const sqrSpaceBot = Math.floor((player.pos[1] + 40) / 40);
    const sqrSpaceTop = Math.floor((player.pos[1] + 40) / 40);
    const sqrSpaceVM = Math.floor((player.pos[1] + 20) / 40);
    if (squares[sqrSpaceBot]?.[sqrSpaceL] === "ground" ||
        squares[sqrSpaceBot]?.[sqrSpaceR] === "ground") {
        player.spd[1] = 0;
        if (keysDown["ArrowDown"]) {
            squares[sqrSpaceBot][sqrSpaceM] = "air";
        }
    }
    else
        player.spd[1] += GRAVITY;
    if (keysDown["ArrowLeft"]) {
        if (squares[sqrSpaceVM][sqrSpaceL] === "air")
            player.spd[0] = -1;
        else
            player.spd[0] = 0;
    }
    else if (keysDown["ArrowRight"]) {
        if (squares[sqrSpaceVM][sqrSpaceR] === "air")
            player.spd[0] = 1;
        else
            player.spd[0] = 0;
    }
    else
        player.spd[0] = 0;
    ctx.fillRect(...player.pos, 40, 40);
    for (let y = 0; y < squares.length; y++) {
        const row = squares[y];
        for (let x = 0; x < row.length; x++) {
            const entry = row[x];
            if (entry === "ground")
                ctx.fillRect(x * 40, y * 40, 40, 40);
        }
    }
    ctx.fillStyle = "rgba(255,0,0,0.5)";
    ctx.fillRect(sqrSpaceL * 40, sqrSpaceVM * 40, 40, 40);
    ctx.fillStyle = "black";
}
