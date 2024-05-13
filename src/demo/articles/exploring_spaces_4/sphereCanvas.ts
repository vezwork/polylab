import { Quat, qap, qfromAxisAngle, qmul, qnormalize } from "./quat.js";
import { V3, v3normalize } from "./v3.js";

const c = document.getElementById("sphereCanvas") as HTMLCanvasElement;
const ctx = c.getContext("2d")!;

let point = [1, 0, 0] as V3;
export const setSphereCanvasPoint = (p) => {
  point = p;
};

const qbaseRot = qfromAxisAngle(v3normalize([0, 0.2, 0]), 0.001);
let qbase = qnormalize([1, 0.3, -0.3, 0]);

requestAnimationFrame(draw);
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  qbase = qmul(qbase, qbaseRot);

  let rotationAxis = v3normalize([0, 1, 0]);
  for (let angle = 0; angle < Math.PI / 2; angle += Math.PI / 16) {
    const qr = qfromAxisAngle(rotationAxis, angle);
    // const fullq = qmul(qbase, qr);
    // const [x, y] = qap(fullq)([1, 0, 0]);
    // ctx.lineTo(c.width / 2 + x * 100, c.height / 2 + y * 100);

    ctx.beginPath();
    for (let angle2 = 0; angle2 < Math.PI / 2; angle2 += 0.04) {
      const qr2 = qfromAxisAngle([0, 0, 1], angle2);
      const fullq = qmul(qmul(qbase, qr), qr2);
      const [x, y] = qap(fullq)([1, 0, 0]);
      ctx.lineTo(c.width / 2 + x * 100, c.height / 2 + y * 100);
    }
    ctx.strokeStyle = "LightGray";
    ctx.stroke();

    ctx.beginPath();
    for (let angle2 = Math.PI / 2; angle2 < Math.PI; angle2 += 0.04) {
      const qr2 = qfromAxisAngle([0, 0, 1], angle2);
      const fullq = qmul(qmul(qbase, qr), qr2);
      const [x, y] = qap(fullq)([1, 0, 0]);
      ctx.lineTo(c.width / 2 + x * 100, c.height / 2 + y * 100);
    }
    ctx.stroke();
  }

  rotationAxis = v3normalize([0, 1, 0]);

  for (let angle2 = 0; angle2 < Math.PI / 2; angle2 += Math.PI / 24) {
    ctx.beginPath();
    for (let angle = 0; angle < Math.PI; angle += 0.01) {
      const qr = qfromAxisAngle(rotationAxis, angle);

      const qr2 = qfromAxisAngle([1, 0, 0], angle2);
      const fullq = qmul(qbase, qr);
      const [x, y] = qap(fullq)(qap(qr2)([0, 1, 0]));
      ctx.lineTo(c.width / 2 + x * 100, c.height / 2 + y * 100);
    }
    ctx.strokeStyle = "LightGray";
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.setLineDash([15, 15]);
  rotationAxis = v3normalize([0, 0, 1]);
  for (let angle = 0; angle < Math.PI; angle += 0.1) {
    const qr = qfromAxisAngle(rotationAxis, angle);
    const fullq = qmul(qbase, qr);
    const [x, y] = qap(fullq)([1, 0, 0]);
    ctx.lineTo(c.width / 2 + x * 100, c.height / 2 + y * 100);
  }
  ctx.closePath();
  ctx.strokeStyle = "black";
  ctx.stroke();
  ctx.setLineDash([]);

  const [x, y, z] = qap(qbase)(point);
  const R = 5;
  ctx.lineWidth = 3;
  ctx.strokeStyle = z < 0 ? "black" : "LightGray";
  ctx.beginPath();
  ctx.arc(c.width / 2 + x * 100, c.height / 2 + y * 100, R, 0, 2 * Math.PI);
  if (z < 0) {
    ctx.fillStyle = "white";
    ctx.fill();
  }
  ctx.stroke();
  ctx.lineWidth = 1;
}
