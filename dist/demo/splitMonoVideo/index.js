import { lerp } from "../../lib/math/Line2.js";
import { clamp } from "../../lib/math/Number.js";
import { add, angleBetween, distance, mul, sub, } from "../../lib/math/Vec2.js";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
if (ctx === null)
    throw "";
const { CanvasCapture } = CanvasCaptureLib;
CanvasCapture.init(c, { showRecDot: true } // Options are optional, more info below.
);
const TOPLEFT = [120, 20];
const BOTTOMRIGHT = [320, 220];
const CENTER = add(TOPLEFT, mul(1 / 2, sub(BOTTOMRIGHT, TOPLEFT)));
const MIDDLELEFT = add(TOPLEFT, [0, (BOTTOMRIGHT[1] - TOPLEFT[1]) / 2]);
const MAXDIST = distance(CENTER, MIDDLELEFT);
const LY = 245;
const LLEFT = 120;
const LRIGHT = 320;
let t = 5;
const endPos = (x, y) => [LLEFT + (lchVals(x, y, 1)[0] / 100) * (LRIGHT - LLEFT), LY];
const cartersianFromSpherical = (inclination, azimuth) => [
    Math.sin(inclination) * Math.cos(azimuth),
    Math.sin(inclination) * Math.sin(azimuth),
    Math.cos(inclination),
];
const sphericalFromPolar = (dist, angle) => [2 * Math.atan(1 / dist), angle];
const polarFromCartesian = (center, p) => [
    distance(center, p),
    angleBetween(center, p),
];
const degFromRad = (thetaRad) => (thetaRad / Math.PI) * 180;
const lchVals = (x, y, greyish) => {
    const [dist, theta] = polarFromCartesian(CENTER, [x, y]);
    const thetaDeg = degFromRad(theta) + 180;
    const distPercent = (dist / MAXDIST) * 100;
    //if (distPercent < 0) return false;
    return [distPercent * 1.1, (100 - distPercent) * 1.5 * greyish, thetaDeg];
};
const lchValsToCssLchString = ([l, c, h]) => `lch(${l.toFixed(1)}% ${c.toFixed(1)} ${h.toFixed(1)})`;
const getColor = (x, y, greyish) => lchValsToCssLchString(lchVals(x, y, greyish));
const DENSITY = 1.5;
const rand = {};
for (let x = TOPLEFT[0]; x < BOTTOMRIGHT[0]; x += DENSITY) {
    rand[x] = {};
    for (let y = TOPLEFT[1]; y < BOTTOMRIGHT[1]; y += DENSITY) {
        rand[x][y] = Math.random();
    }
}
const STAGE2 = 24;
function easeInOutExpo(x) {
    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5
                ? Math.pow(2, 20 * x - 10) / 2
                : (2 - Math.pow(2, -20 * x + 10)) / 2;
}
const draw = () => {
    requestAnimationFrame(draw);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    t += 0.05;
    if (t < STAGE2) {
        for (let x = TOPLEFT[0]; x < BOTTOMRIGHT[0]; x += DENSITY) {
            for (let y = TOPLEFT[1]; y < BOTTOMRIGHT[1]; y += DENSITY) {
                const pp = distance(BOTTOMRIGHT, [x, y]);
                const p = pp / 10 + rand[x][y];
                if (y > CENTER[1] && distance([x, y], CENTER) > MAXDIST)
                    break;
                ctx.fillStyle = getColor(x, y, clamp(0, 1 - (t - p), 1));
                ctx.fillRect(...lerp([[x, y], endPos(x, y)])(clamp(0, t - p, 1)), 1, 1);
            }
        }
    }
    else {
        //stage 2
        const nt = t - STAGE2;
        for (let x = LLEFT; x < LRIGHT; x += 0.1) {
            const targetX = CENTER[0] + (x - LLEFT) / 2;
            const targetY = CENTER[1];
            const p = (LRIGHT - x) / 10;
            ctx.fillStyle = getColor(targetX, targetY, clamp(0, nt - p, 1));
            ctx.fillRect(...lerp([
                [x, LY],
                [targetX, targetY],
            ])(clamp(0, easeInOutExpo(nt - p), 1)), 1, 1);
        }
        //arrow 2
        ctx.globalAlpha = (t - STAGE2) / 15;
        ctx.beginPath();
        ctx.moveTo(...sub(MIDDLELEFT, [60, -100]));
        ctx.lineTo(...sub(MIDDLELEFT, [60, -15]));
        ctx.moveTo(...sub(MIDDLELEFT, [70, -25]));
        ctx.lineTo(...sub(MIDDLELEFT, [60, -15]));
        ctx.lineTo(...sub(MIDDLELEFT, [50, -25]));
        ctx.moveTo(...sub(MIDDLELEFT, [70, -110]));
        ctx.lineTo(...sub(MIDDLELEFT, [60, -100]));
        ctx.lineTo(...sub(MIDDLELEFT, [50, -110]));
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    //circle
    ctx.beginPath();
    ctx.arc(...CENTER, MAXDIST, 0, 2 * Math.PI);
    ctx.stroke();
    //line
    ctx.beginPath();
    ctx.moveTo(LLEFT, LY - 10);
    ctx.lineTo(LLEFT, LY + 10);
    ctx.moveTo(LRIGHT, LY - 10);
    ctx.lineTo(LRIGHT, LY + 10);
    ctx.moveTo(LLEFT, LY);
    ctx.lineTo(LRIGHT, LY);
    ctx.stroke();
    //text
    ctx.fillStyle = "black";
    ctx.font = "16px sans-serif";
    ctx.fillText("COLOR", ...sub(MIDDLELEFT, [100, -5]));
    ctx.fillText("LIGHTNESS", LLEFT - 100, LY + 5);
    ctx.font = "12px sans-serif";
    ctx.fillText("0", LLEFT - 3, LY + 25);
    ctx.fillText("1", LRIGHT - 4, LY + 25);
    // arrow 1
    ctx.globalAlpha = (t - 5) / 19;
    ctx.moveTo(...sub(MIDDLELEFT, [90, -15]));
    ctx.lineTo(...sub(MIDDLELEFT, [90, -110]));
    ctx.moveTo(...sub(MIDDLELEFT, [100, -100]));
    ctx.lineTo(...sub(MIDDLELEFT, [90, -110]));
    ctx.lineTo(...sub(MIDDLELEFT, [80, -100]));
    ctx.moveTo(...sub(MIDDLELEFT, [100, -90]));
    ctx.lineTo(...sub(MIDDLELEFT, [90, -100]));
    ctx.lineTo(...sub(MIDDLELEFT, [80, -90]));
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (CanvasCapture.isRecording())
        CanvasCapture.recordFrame();
};
requestAnimationFrame(draw);
CanvasCapture.beginVideoRecord({
    format: CanvasCapture.MP4,
    name: "myVideo",
});
c.addEventListener("click", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    const [dist, angle] = polarFromCartesian(CENTER, [x, y]);
    const spherical = sphericalFromPolar(dist, angle);
    const cart = cartersianFromSpherical(spherical[0], spherical[1]);
    console.log("polar", dist, angle);
    console.log("spherical", spherical);
    console.log("cart", cart);
    console.log(`${x}, ${y} => %c ${getColor(x, y, 1)}`, `background:${getColor(x, y, 1)}; color: white;`);
    // if (!CanvasCapture.isRecording()) {
    //   CanvasCapture.beginVideoRecord({
    //     format: CanvasCapture.MP4,
    //     quality: 1,
    //     name: "myVideo",
    //   });
    // } else {
    //   CanvasCapture.stopRecord();
    // }
});
