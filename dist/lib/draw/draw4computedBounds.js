import { id, _, apply, translation, scale, zeroTranslate, inv, } from "../math/CtxTransform.js";
import { max } from "../math/Number.js";
import { length, x, y, add, mul } from "../math/Vec2.js";
class PathDrawable {
    w;
    h;
    path;
    isFilled;
    lineWidth;
    parents = [];
    p2d;
    constructor(w, h, path, isFilled = true, lineWidth = 0) {
        this.w = w;
        this.h = h;
        this.path = path;
        this.isFilled = isFilled;
        this.lineWidth = lineWidth;
        this.p2d = new Path2D(this.path);
    }
    preDraw(t, parent) {
        return {
            draw: (ctx) => {
                ctx.save();
                ctx.setTransform(...t);
                if (this.isFilled)
                    ctx.fill(this.p2d);
                if (this.lineWidth !== 0) {
                    ctx.lineWidth = this.lineWidth;
                    ctx.stroke(this.p2d);
                }
                ctx.restore();
            },
            bound: [this.w, this.h],
            d: this,
            children: [],
            parent,
            t,
        };
    }
}
class LineDrawable {
    line;
    parents = [];
    w;
    h;
    constructor(line) {
        this.line = line;
        this.w = max(line.map(x));
        this.h = max(line.map(y));
    }
    preDraw(t, parent) {
        return {
            draw: (ctx) => {
                const line = this.line;
                ctx.beginPath();
                if (line[0])
                    ctx.moveTo(...apply(t)(line[0]));
                for (const p of line) {
                    ctx.lineTo(...apply(t)(p));
                }
                ctx.stroke();
                ctx.closePath();
            },
            bound: [this.w, this.h],
            d: this,
            children: [],
            parent,
            t,
        };
    }
}
class TextDrawable {
    w;
    h;
    text;
    fontSize;
    parents = [];
    constructor(w, h, text, fontSize) {
        this.w = w;
        this.h = h;
        this.text = text;
        this.fontSize = fontSize;
    }
    preDraw(t, parent) {
        return {
            draw: (ctx) => {
                ctx.setTransform(...t);
                ctx.translate(0, this.h);
                ctx.font = `${this.fontSize}px monospace`;
                ctx.textBaseline = "bottom";
                ctx.fillText(this.text, 0, 0);
                ctx.resetTransform();
            },
            bound: [this.w, this.h],
            d: this,
            children: [],
            parent,
            t,
        };
    }
}
class TransformDrawable {
    drawable;
    transform;
    pad;
    parents = [];
    constructor(
    /*readonly*/ drawable, transform, pad = [0, 0]) {
        this.drawable = drawable;
        this.transform = transform;
        this.pad = pad;
        drawable.parents.push(this);
    }
    preDraw(t, parent) {
        const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
        const padAndTransform = _(this.transform)(translation(this.pad));
        const newT = _(padAndTransform)(t);
        const drawTree = {
            draw: () => { },
            bound: [0, 0],
            d: this,
            children: [],
            t,
            parent,
        };
        if (scaleFactor > 0.1) {
            const child = this.drawable.preDraw(newT, drawTree);
            drawTree.children = [child];
            drawTree.bound = add(this.pad, apply(padAndTransform)(child.bound)); // local coords
            drawTree.draw = child.draw;
        }
        return drawTree;
    }
    reversePreDraw(t, child) {
        const padAndTransform = _(this.transform)(translation(this.pad));
        const newT = _(t)(inv(padAndTransform));
        const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
        const drawTree = {
            draw: () => { },
            bound: add(this.pad, apply(padAndTransform)(child.bound)),
            d: this,
            children: [child],
            t: _(padAndTransform)(t),
            parent: null,
        };
        if (this.parents[0] !== null && scaleFactor < 10) {
            const parent = this.parents[0]; // TODO: FIX
            const pDt = parent.reversePreDraw(newT, drawTree);
            drawTree.parent = pDt;
            drawTree.draw = pDt.draw;
        }
        return drawTree;
    }
}
class BoxDrawable {
    drawable;
    parents = [];
    constructor(/*readonly*/ drawable) {
        this.drawable = drawable;
        drawable.parents.push(this);
    }
    preDraw(t, parent) {
        const drawTree = {
            draw: () => { },
            bound: [0, 0],
            d: this,
            children: [],
            t,
            parent,
        };
        const child = this.drawable.preDraw(t, drawTree);
        drawTree.children = [child];
        const bound = child.bound;
        drawTree.bound = bound;
        drawTree.draw = (ctx) => {
            ctx.save();
            //ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 5;
            ctx.transform(...t);
            ctx.stroke(new Path2D(`M0 0 h ${bound[0]} v ${bound[1]} h ${-bound[0]} Z`));
            ctx.restore();
            child.draw(ctx);
        };
        return drawTree;
    }
    reversePreDraw(t, child) {
        const bound = child.bound;
        const drawTree = {
            draw: () => { },
            bound,
            d: this,
            children: [child],
            t: child.t,
            parent: null,
        };
        if (this.parents[0] !== null) {
            const parent = this.parents[0]; // TODO: FIX
            const pDt = parent.reversePreDraw(t, drawTree);
            drawTree.parent = pDt;
            drawTree.bound = child.bound;
            drawTree.draw = (ctx) => {
                ctx.save();
                //ctx.setLineDash([5, 5]);
                ctx.strokeStyle = "red";
                ctx.lineWidth = 5;
                ctx.transform(...t);
                ctx.stroke(new Path2D(`M0 0 h ${bound[0]} v ${bound[1]} h ${-bound[0]} Z`));
                ctx.restore();
                pDt.draw(ctx);
            };
        }
        return drawTree;
    }
}
class Drawables {
    drawables;
    parents = [];
    constructor(drawables) {
        this.drawables = drawables;
        for (const d of drawables)
            d.parents.push(this);
    }
    preDraw(t, parent) {
        const drawTree = {
            draw: () => { },
            bound: [0, 0],
            d: this,
            children: [],
            t,
            parent,
        };
        const { children, bound } = this.drawables.reduce(({ children, bound }, d) => {
            const shiftedT = translation([bound[0], 0]);
            const tree = d.preDraw(_(shiftedT)(t), drawTree);
            const [w, h] = apply(shiftedT)(tree.bound);
            return {
                children: [...children, tree],
                bound: [w, Math.max(bound[1], h)],
            };
        }, {
            children: [],
            bound: [0, 0],
        });
        drawTree.children = children;
        drawTree.bound = bound;
        drawTree.draw = (ctx) => children.map((d) => d.draw(ctx));
        return drawTree;
    }
}
export const drawables = (...drawables) => new Drawables(drawables);
export const transformD = (transform = id, pad) => (drawable) => new TransformDrawable(drawable, transform, pad);
export const boxD = (drawable) => new BoxDrawable(drawable);
export const scaleD = (s) => (drawable) => new TransformDrawable(drawable, scale(s));
export const translateD = (t) => (drawable) => new TransformDrawable(drawable, translation(t));
export const padD = (p) => (drawable) => new TransformDrawable(drawable, translation(p), mul(2, p));
export const lineD = (line = []) => new LineDrawable(line);
export const pathD = (path, w, h, isFilled, lineWidth) => new PathDrawable(w, h, path, isFilled, lineWidth);
export const textD = (text, fontSize, w, h) => new TextDrawable(w, h, text, fontSize);
