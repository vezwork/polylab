import {
  centerCenter,
  leftCenter,
  rightCenter,
  centerTop,
  centerBottom,
  leftTop,
  rightTop,
  leftBottom,
  rightBottom,
  x,
  y,
  top,
  bottom,
  left,
  right,
  set,
  set2,
  eq,
  eq2,
} from "./alga_api.js";

export const addInterval2Sugar = (interval2) => {
  const sugared = {
    ...interval2,
    // 1D getters
    get top() {
      return top(interval2);
    },
    get left() {
      return left(interval2);
    },
    get right() {
      return right(interval2);
    },
    get bottom() {
      return bottom(interval2);
    },
    // 1D setters
    set top(v) {
      if (v.hasOwnProperty("v")) eq(top(interval2), v);
      else set(top(interval2), v);
    },
    set left(v) {
      if (v.hasOwnProperty("v")) eq(left(interval2), v);
      else set(left(interval2), v);
    },
    set right(v) {
      if (v.hasOwnProperty("v")) eq(right(interval2), v);
      else set(right(interval2), v);
    },
    set bottom(v) {
      if (v.hasOwnProperty("v")) eq(bottom(interval2), v);
      else set(bottom(interval2), v);
    },
    // 2D getters
    get leftTop() {
      return leftTop(interval2);
    },
    get leftCenter() {
      return leftCenter(interval2);
    },
    get leftBottom() {
      return leftBottom(interval2);
    },
    get centerTop() {
      return centerTop(interval2);
    },
    get centerCenter() {
      return centerCenter(interval2);
    },
    get centerBottom() {
      return centerBottom(interval2);
    },
    get rightTop() {
      return rightTop(interval2);
    },
    get rightCenter() {
      return rightCenter(interval2);
    },
    get rightBottom() {
      return rightBottom(interval2);
    },
    // 2D setters
    set leftTop(v) {
      if (v.hasOwnProperty("v")) eq2(leftTop(interval2), v);
      else set2(leftTop(interval2), v);
    },
    set leftCenter(v) {
      if (v.hasOwnProperty("v")) eq2(leftCenter(interval2), v);
      else set2(leftCenter(interval2), v);
    },
    set leftBottom(v) {
      if (v.hasOwnProperty("v")) eq2(leftBottom(interval2), v);
      else set2(leftBottom(interval2), v);
    },
    set centerTop(v) {
      if (v.hasOwnProperty("v")) eq2(centerTop(interval2), v);
      else set2(centerTop(interval2), v);
    },
    set centerCenter(v) {
      if (v.hasOwnProperty("v")) eq2(centerCenter(interval2), v);
      else set2(centerCenter(interval2), v);
    },
    set centerBottom(v) {
      if (v.hasOwnProperty("v")) eq2(centerBottom(interval2), v);
      else set2(centerBottom(interval2), v);
    },
    set rightTop(v) {
      if (v.hasOwnProperty("v")) eq2(rightTop(interval2), v);
      else set2(rightTop(interval2), v);
    },
    set rightCenter(v) {
      if (v.hasOwnProperty("v")) eq2(rightCenter(interval2), v);
      else set2(rightCenter(interval2), v);
    },
    set rightBottom(v) {
      if (v.hasOwnProperty("v")) eq2(rightBottom(interval2), v);
      else set2(rightBottom(interval2), v);
    },
  };
  interval2.x.l.interval2 = sugared;
  interval2.x.r.interval2 = sugared;
  interval2.y.l.interval2 = sugared;
  interval2.y.r.interval2 = sugared;
  return sugared;
};

export const addPointSugar = (p) => {
  p[0].point = p;
  p[1].point = p;
  return p;
};
