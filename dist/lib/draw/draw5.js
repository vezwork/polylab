import { _, apply, zeroTranslate, } from "../math/CtxTransform.js";
import { max } from "../math/Number.js";
import { length, x, y } from "../math/Vec2.js";
export const line = (line) => {
    const d = ({ draw, t }) => {
        draw.beginPath();
        if (line[0])
            draw.moveTo(...apply(t)(line[0]));
        for (const p of line)
            draw.lineTo(...apply(t)(p));
        draw.stroke();
        draw.closePath();
        return {
            d,
            bound: [max(line.map(x)), max(line.map(y))],
            children: [],
            t,
        };
    };
    return d;
};
export const trans = (myT) => (drawable) => {
    const d = (c) => {
        const { draw, t: parentT } = c;
        const t = _(myT)(parentT);
        const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
        if (scaleFactor < 0.02)
            return null; // dont render small stuff
        const dInfo = drawable({ draw, t });
        if (dInfo === null)
            return null; // dont render if child doesn't render
        return {
            d,
            bound: apply(t)(dInfo.bound),
            children: [dInfo],
            t,
        };
    };
    return d;
};
export const ds = (...drawables) => {
    const d = (c) => {
        const children = drawables.map((d) => d(c));
        const w = children.reduce((prev, cur) => Math.max(cur?.bound[0] ?? 0, prev), 0);
        const h = children.reduce((prev, cur) => Math.max(cur?.bound[1] ?? 0, prev), 0);
        return {
            d,
            bound: [w, h],
            children,
            t: c.t,
        };
    };
    return d;
};
