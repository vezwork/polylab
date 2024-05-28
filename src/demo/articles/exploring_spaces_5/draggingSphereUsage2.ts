import {
  createDot,
  createDraggableDot,
  sphereToTwoUnitDisks,
  twoUnitDisksToSphere,
  uiDiskToUnitDisk,
  unitDiskToHemisphere,
  unitDiskToUIDisk,
} from "./draggingSphere.js";
import { angleOf, length } from "../../../lib/math/Vec2.js";
import { V3, v3normalize, v3rot } from "./v3.js";
import { qap, qfromAxisAngle } from "./quat.js";
//import { dotState } from "./draggingRP2.js";
import { saxis } from "./draggingSphereUsage.js";
import { mod } from "../../../lib/math/Number.js";

const SVG1 = document.querySelector("#dragging3a");
const SVG2 = document.querySelector("#dragging3b");
const SVG3 = document.querySelector("#dragging4a");
const SVG4 = document.querySelector("#dragging4b");

// colorful stuff

let dots: any[] = [];
const dotMap = new Map();
const lchValsToCssLchString = ([l, c, h]) =>
  `lch(${l.toFixed(1)}% ${c.toFixed(1)} ${h.toFixed(1)}rad)`;
const SPACING = 3;
const SIZE = "1";
const CHROMA = 77;

let rotationAxis = v3normalize([0, 1, 0]);
for (let angle = 0; angle < Math.PI; angle += Math.PI / 32) {
  const qr = qfromAxisAngle(rotationAxis, angle);
  const sphereXYZ = qap(qr)([1, 0, 0]);
  const tt = sphereToTwoUnitDisks(sphereXYZ);
  const d1 = createDot(SVG1, SVG2, "red", SIZE);
  const d2 = createDot(SVG3, SVG4, "red", SIZE);
  dotMap.set(d1, d2);
  dots.push(d1);
  const ds = [d1, d2];
  for (const dot of ds) {
    dot.pos = unitDiskToUIDisk(tt.v);
    dot.disk = tt.disk;
    dot.render();
  }
}
rotationAxis = v3normalize([0, 0, 1]);
for (let angle = 0; angle < Math.PI; angle += Math.PI / 32) {
  const qr = qfromAxisAngle(rotationAxis, angle);
  const sphereXYZ = qap(qr)([1, 0, 0]);
  const tt = sphereToTwoUnitDisks(sphereXYZ);
  const d1 = createDot(SVG1, SVG2, "blue", SIZE);
  const d2 = createDot(SVG3, SVG4, "blue", SIZE);
  dotMap.set(d1, d2);
  dots.push(d1);
  const ds = [d1, d2];
  for (const dot of ds) {
    dot.pos = unitDiskToUIDisk(tt.v);
    dot.disk = tt.disk;
    dot.render();
  }
}
rotationAxis = v3normalize([1, 0, 0]);
for (let angle = 0; angle < Math.PI; angle += Math.PI / 32) {
  const qr = qfromAxisAngle(rotationAxis, angle);
  const sphereXYZ = qap(qr)([0, 1, 0]);
  const tt = sphereToTwoUnitDisks(sphereXYZ);
  const d1 = createDot(SVG1, SVG2, "green", SIZE);
  const d2 = createDot(SVG3, SVG4, "green", SIZE);
  dotMap.set(d1, d2);
  dots.push(d1);
  const ds = [d1, d2];
  for (const dot of ds) {
    dot.pos = unitDiskToUIDisk(tt.v);
    dot.disk = tt.disk;
    dot.render();
  }
}

// for (let x = -50; x < 50; x += SPACING) {
//   for (let y = -50; y < 50; y += SPACING) {
//     if (length([x, y]) < 50) {
//       const hemicoord = unitDiskToHemisphere([x / 50, y / 50]);
//       const color = lchValsToCssLchString([
//         50 + hemicoord[2] * 50,
//         CHROMA,
//         angleOf([x, y]),
//       ]);
//       const dot = createDot(SVG1, SVG2, color, SIZE);
//       dot.pos = [x, y];
//       dot.render();
//       dots.push(dot);
//     }
//   }
// }
// for (let x = -50; x < 50; x += SPACING) {
//   for (let y = -50; y < 50; y += SPACING) {
//     if (length([x, y]) < 50) {
//       const hemicoord = unitDiskToHemisphere([x / 50, y / 50]);
//       const color = lchValsToCssLchString([
//         50 - hemicoord[2] * 50,
//         CHROMA,
//         angleOf([-x, -y]),
//       ]);
//       const dot = createDot(SVG1, SVG2, color, SIZE);
//       dot.pos = [x, y];
//       dot.disk = 1;
//       dot.render();
//       dots.push(dot);
//     }
//   }
// }

function draw() {
  requestAnimationFrame(draw);
  for (const s of dots) {
    const otherS = dotMap.get(s);
    const h = twoUnitDisksToSphere({
      disk: s.disk,
      v: uiDiskToUnitDisk(s.pos),
    });
    const rh = v3rot(
      twoUnitDisksToSphere({
        disk: saxis.disk,
        v: uiDiskToUnitDisk(saxis.pos),
      }) as V3,
      //unitDiskToHemisphere(uiDiskToUnitDisk(dotState.pos)) as V3,
      (mod(window.scrub ?? 0, 400) / 400) * Math.PI * 2
    )(h as V3);

    const go = sphereToTwoUnitDisks(rh);
    otherS.pos = unitDiskToUIDisk(go.v);
    otherS.disk = go.disk;
    otherS.render();
  }
  SVG1.append(document.getElementById("dragging3a_background_rect")!);
  SVG2.append(document.getElementById("dragging3b_background_rect")!);
}
requestAnimationFrame(draw);

// make the background draw on-top
SVG1.append(document.getElementById("dragging3a_background_rect")!);
SVG2.append(document.getElementById("dragging3b_background_rect")!);
