import { subAngles } from "../../lib/math/Number.js";
import { add, angleBetween, mul, normalVec2FromAngle, } from "../../lib/math/Vec2.js";
const c = document.getElementById("c");
const ctx = c.getContext("2d");
if (ctx === null)
    throw "";
const mouse = [0, 0];
const center = [c.width / 2, c.height / 2];
let prevAngle = 0;
let movement = 0;
const draw = () => {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, c.width, c.height);
    const theta = angleBetween(center, mouse);
    movement += subAngles(prevAngle, theta);
    prevAngle = theta;
    const n = mul(20, normalVec2FromAngle(theta));
    ctx.fillRect(...center, 5, 5);
    ctx.fillRect(100 + movement * 5, 10, 10, 10);
    ctx.fillRect(...add([movement * 10, 0], add(center, n)), 10, 10);
};
requestAnimationFrame(draw);
window.addEventListener("mousemove", (e) => {
    mouse[0] = e.offsetX;
    mouse[1] = e.offsetY;
});
c.addEventListener("click", (e) => { });
