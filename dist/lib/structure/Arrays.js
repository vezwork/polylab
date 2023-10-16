import { forkLift } from "./Functions.js";
import { clamp } from "../math/Number.js";
export const arrLiftFn = (fn) => (ps) => ps.map(fn);
export const arrFork = forkLift(arrLiftFn);
export const at = (index) => (array) => array.at(index);
export function findIndex2D(array2D, predicate) {
    return array2D.reduce((acc, line, i) => {
        const foundIndex = line.findIndex(predicate);
        if (foundIndex !== -1)
            return [i, foundIndex];
        else
            return acc;
    }, [-1, -1]);
}
export function compareIndex2D([y1, x1], [y2, x2]) {
    if (y1 < y2)
        return -1;
    if (y1 === y2) {
        if (x1 < x2)
            return -1;
        if (x1 === x2)
            return 0;
        return 1;
    }
    return 1;
}
/**
 * note: non-commutative.
 * note: wraps horizontally, does not wrap vertically. Clamped to start and end of array.
 */
export function wrapLinesAddXIndex2D(array2D, [y, x], addX) {
    let newY = y;
    let newX = x + addX;
    if (newX > array2D[newY].length - 1) {
        while (newX > array2D[newY].length - 1) {
            newX -= array2D[newY].length;
            newY += 1;
            if (newY > array2D.length - 1)
                return [Infinity, Infinity];
        }
    }
    if (newX < 0) {
        while (newX < 0) {
            newY -= 1;
            if (newY < 0)
                return [-Infinity, -Infinity];
            newX += array2D[newY].length;
        }
    }
    return [newY, newX];
}
/**
 * note: non-commutative.
 * note: wraps horizontally, does not wrap vertically. Clamped to start and end of array.
 */
export function wrapLinesAddXIndex2DClamped(array2D, index, addX) {
    const [y, x] = wrapLinesAddXIndex2D(array2D, index, addX);
    const clampY = clamp(0, y, array2D.length - 1);
    const clampX = clamp(0, x, array2D[clampY].length - 1);
    return [clampY, clampX];
}
// finds the maximum valued element
export function most(els, valueOf) {
    return sortFirst(els, (el1, el2) => valueOf(el1) - valueOf(el2));
}
export function least(els, valueOf) {
    return sortFirst(els, (el1, el2) => valueOf(el2) - valueOf(el1));
}
// the same as sort, but just takes the first element. Linear time.
// 0 represents "equal", >0 means el1 > el2, <0 means el2 > el2
export function sortFirst(els, compare) {
    return els.reduce((acc, el) => (acc === null || compare(el, acc) > 0 ? el : acc), null);
}
// adapted from https://stackoverflow.com/a/20261974/5425899
export function locationOf(element, array, comparer, start = 0, end = array.length) {
    if (array.length === 0)
        return -1;
    var pivot = (start + end) >> 1; // should be faster than dividing by 2
    var c = comparer(element, array[pivot]);
    if (end - start <= 1)
        return c == -1 ? pivot - 1 : pivot;
    switch (c) {
        case -1:
            return locationOf(element, array, comparer, start, pivot);
        case 0:
            return pivot;
        case 1:
            return locationOf(element, array, comparer, pivot, end);
    }
}
export function insert(element, array, comparer) {
    array.splice(locationOf(element, array, comparer) + 1, 0, element);
    return array;
}
