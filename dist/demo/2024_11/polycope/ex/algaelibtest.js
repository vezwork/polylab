import {
  d,
  put,
  draw,
  xStack,
  above,
  beside,
  yStack,
  toDefault,
} from "./ex/algaelib.js";

const make = (color = "red") => {
  const dd = d((x, x2, y, y2) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, x2 - x, y2 - y);
  });
  put(dd.w)(110);
  put(dd.h)(Math.random() * 350);
  return dd;
};
const dr = make("red");
const dd = make("orange");
const dd2 = make("purple");
const dd3 = make("YellowGreen");
const dd4 = make("cornflowerblue");
const dr2 = make("maroon");
const dg = xStack(dd, dd2, dd3, dd4);
const dyg = yStack(dr, dg);
//beside(
//  dyg,
//dr2)
//put(dr2.x)(520)
//put(dr2.yc)(350)
//while (toDefault.length > 0) {
//  const ob = toDefault.shift()
//  if (ob.v === 0)
//    put(ob)(ob.v)
//}
console.log(dr, dg);
draw();
