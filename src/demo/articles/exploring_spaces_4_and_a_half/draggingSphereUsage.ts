import {
  createDraggableDot,
  sphereToTwoUnitDisks,
  unitDiskToUIDisk,
} from "./draggingSphere.js";
import { v3normalize } from "./v3.js";

const AXIS = v3normalize([1, 0, 1]);
export const saxis = createDraggableDot(
  document.querySelector("#dragging2a"),
  document.querySelector("#dragging2b")
  //   rp2SetPos
);
const tt = sphereToTwoUnitDisks(AXIS);
saxis.pos = unitDiskToUIDisk(tt.v);
saxis.disk = tt.disk;
// saxis.color("red");
saxis.render();

export const colorPickerSetPos = (x, y, didCircleRevert) => {
  saxis.pos = [x, y];
  if (didCircleRevert) {
    saxis.disk ^= 1;
  }
  saxis.render(false);
};

// make the background draw on-top
document
  .querySelector("#dragging2a")!
  .append(document.getElementById("dragging2a_background_rect")!);
document
  .querySelector("#dragging2b")!
  .append(document.getElementById("dragging2b_background_rect")!);
document
  .querySelector("#dragging2a")!
  .append(document.getElementById("dragging2a_border")!);
document
  .querySelector("#dragging2b")!
  .append(document.getElementById("dragging2b_border")!);
