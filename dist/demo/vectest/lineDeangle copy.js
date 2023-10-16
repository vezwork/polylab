import { setupFullscreenCanvas } from "../../lib/draw/setupFullscreenCanvas.js";
import { randomCssRgb } from "../../lib/math/Color.js";
import { subAngles } from "../../lib/math/Number.js";
import { angleBetween, distance, normalVec2FromAngle, rotateAround, } from "../../lib/math/Vec2.js";
const ctx = setupFullscreenCanvas("c");
const c = ctx.canvas;
const mouse = [0, 0];
let mousedown = false;
const paths = [
    { color: randomCssRgb(), path: [] },
];
c.addEventListener("mousemove", (e) => {
    mouse[0] = e.offsetX;
    mouse[1] = e.offsetY;
});
c.addEventListener("mousedown", (e) => {
    mousedown = true;
});
c.addEventListener("mouseup", (e) => {
    mousedown = false;
});
function draw() {
    ctx.fillStyle = "DarkSlateBlue";
    ctx.fillRect(0, 0, c.width, c.height);
    {
        const { path, color } = paths.at(-1);
        if (!mousedown && path.length > 0) {
            paths.push({ color: randomCssRgb(), path: [] });
        }
        if (mousedown &&
            mouse[0] !== path.at(-1)?.[0] &&
            mouse[1] !== path.at(-1)?.[1])
            path.push([...mouse]);
    }
    for (const { path, color } of paths) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.lineJoin = "bevel";
        if (path[0])
            ctx.moveTo(...path[0]);
        for (let i = 0; i < path.length; i++) {
            const p_1 = path[i + 1];
            const p0 = path[i];
            const p1 = path[i - 1];
            const p2 = path[i - 2];
            const p3 = path[i - 3];
            if (p0)
                ctx.lineTo(...p0);
            // minimize something like the 2nd derivative??
            if (p0 && p1 && p2) {
                const curAngle = subAngles(angleBetween(p0, p1), angleBetween(p1, p2));
                const prevAngle = p_1
                    ? subAngles(angleBetween(p_1, p0), angleBetween(p0, p1))
                    : curAngle;
                const nextAngle = p3
                    ? subAngles(angleBetween(p1, p2), angleBetween(p2, p3))
                    : curAngle;
                const targetAngle = angleBetween(normalVec2FromAngle(prevAngle), normalVec2FromAngle(nextAngle));
                const interiorAngleGo = targetAngle + curAngle;
                // with path length weighting
                let lenToI = 0;
                let totalLen = 0;
                for (let j = 1; j < path.length; j++) {
                    const p0 = path[j - 1];
                    const p1 = path[j];
                    const d = distance(p0, p1);
                    if (j < i - 1)
                        lenToI += d;
                    totalLen += d;
                }
                const b = lenToI / totalLen;
                for (let j = i; j < path.length; j++) {
                    const pp = path[j];
                    const res = rotateAround(p1)(pp, b * interiorAngleGo * 0.01);
                    pp[0] = res[0];
                    pp[1] = res[1];
                }
                for (let j = i - 2; j >= 0; j--) {
                    const pp = path[j];
                    const res = rotateAround(p1)(pp, (1 - b) * -interiorAngleGo * 0.01);
                    pp[0] = res[0];
                    pp[1] = res[1];
                }
            }
        }
        ctx.stroke();
    }
    ctx.fillStyle = "red";
    ctx.fillRect(...mouse, 10, 10);
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
