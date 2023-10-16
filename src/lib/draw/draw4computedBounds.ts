import {
  CtxTransform,
  id,
  _,
  apply,
  translation,
  scale,
  zeroTranslate,
  inv,
} from "../math/CtxTransform.js";
import { max } from "../math/Number.js";
import { Vec2, length, x, y, sub, add, mul } from "../math/Vec2.js";

export type DrawTree = {
  caretable?: true;
  d: Drawable;
  children: DrawTree[];
  parent: DrawTree | null;
  t: CtxTransform;
  bound: Vec2;
  draw: (ctx: CanvasRenderingContext2D) => void;
};
interface Drawable {
  parents: Drawable[];
  preDraw(transform: CtxTransform, parent: DrawTree | null): DrawTree;
}

class PathDrawable implements Drawable {
  parents = [];
  private p2d;
  constructor(
    readonly w: number,
    readonly h: number,
    readonly path: string,
    readonly isFilled = true,
    readonly lineWidth = 0
  ) {
    this.p2d = new Path2D(this.path);
  }
  preDraw(t: CtxTransform, parent: DrawTree | null): DrawTree {
    return {
      draw: (ctx) => {
        ctx.save();
        ctx.setTransform(...t);
        if (this.isFilled) ctx.fill(this.p2d);
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

class LineDrawable implements Drawable {
  parents = [];
  readonly w: number;
  readonly h: number;
  constructor(readonly line: Vec2[]) {
    this.w = max(line.map(x));
    this.h = max(line.map(y));
  }
  preDraw(t: CtxTransform, parent: DrawTree | null): DrawTree {
    return {
      draw: (ctx) => {
        const line = this.line;
        ctx.beginPath();
        if (line[0]) ctx.moveTo(...apply(t)(line[0]));
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

class TextDrawable implements Drawable {
  parents = [];
  constructor(
    readonly w: number,
    readonly h: number,
    readonly text: string,
    readonly fontSize: number
  ) {}
  preDraw(t: CtxTransform, parent: DrawTree | null): DrawTree {
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
class TransformDrawable implements Drawable {
  parents: Drawable[] = [];
  constructor(
    /*readonly*/ public drawable: Drawable,
    readonly transform: CtxTransform,
    readonly pad: Vec2 = [0, 0]
  ) {
    drawable.parents.push(this);
  }
  preDraw(t: CtxTransform, parent: DrawTree | null): DrawTree {
    const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));

    const padAndTransform = _(this.transform)(translation(this.pad));
    const newT = _(padAndTransform)(t);
    const drawTree: DrawTree = {
      draw: () => {},
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
  reversePreDraw(t: CtxTransform, child: DrawTree): DrawTree {
    const padAndTransform = _(this.transform)(translation(this.pad));
    const newT = _(t)(inv(padAndTransform));

    const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));

    const drawTree: DrawTree = {
      draw: () => {}, // draw upwards
      bound: add(this.pad, apply(padAndTransform)(child.bound)),
      d: this,
      children: [child],
      t: _(padAndTransform)(t),
      parent: null,
    };
    if (this.parents[0] !== null && scaleFactor < 10) {
      const parent = this.parents[0] as BoxDrawable; // TODO: FIX
      const pDt = parent.reversePreDraw(newT, drawTree);
      drawTree.parent = pDt;

      drawTree.draw = pDt.draw;
    }
    return drawTree;
  }
}
class BoxDrawable implements Drawable {
  parents: Drawable[] = [];
  constructor(/*readonly*/ public drawable: Drawable) {
    drawable.parents.push(this);
  }
  preDraw(t: CtxTransform, parent: DrawTree | null): DrawTree {
    const drawTree: DrawTree = {
      draw: () => {},
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
      ctx.stroke(
        new Path2D(`M0 0 h ${bound[0]} v ${bound[1]} h ${-bound[0]} Z`)
      );
      ctx.restore();
      child.draw(ctx);
    };

    return drawTree;
  }
  reversePreDraw(t: CtxTransform, child: DrawTree): DrawTree {
    const bound = child.bound;
    const drawTree: DrawTree = {
      draw: () => {}, // draw upwards
      bound,
      d: this,
      children: [child],
      t: child.t,
      parent: null,
    };
    if (this.parents[0] !== null) {
      const parent = this.parents[0] as TransformDrawable; // TODO: FIX
      const pDt = parent.reversePreDraw(t, drawTree);
      drawTree.parent = pDt;
      drawTree.bound = child.bound;
      drawTree.draw = (ctx) => {
        ctx.save();
        //ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 5;
        ctx.transform(...t);
        ctx.stroke(
          new Path2D(`M0 0 h ${bound[0]} v ${bound[1]} h ${-bound[0]} Z`)
        );
        ctx.restore();
        pDt.draw(ctx);
      };
    }
    return drawTree;
  }
}

class Drawables implements Drawable {
  parents: Drawable[] = [];
  constructor(readonly drawables: Drawable[]) {
    for (const d of drawables) d.parents.push(this);
  }
  preDraw(t: CtxTransform, parent: DrawTree | null): DrawTree {
    const drawTree: DrawTree = {
      draw: () => {},
      bound: [0, 0],
      d: this,
      children: [],
      t,
      parent,
    };
    const { children, bound } = this.drawables.reduce<{
      children: DrawTree[];
      bound: Vec2;
    }>(
      ({ children, bound }, d) => {
        const shiftedT = translation([bound[0], 0]);
        const tree = d.preDraw(_(shiftedT)(t), drawTree);
        const [w, h] = apply(shiftedT)(tree.bound);
        return {
          children: [...children, tree],
          bound: [w, Math.max(bound[1], h)],
        };
      },
      {
        children: [],
        bound: [0, 0],
      }
    );
    drawTree.children = children;
    drawTree.bound = bound;
    drawTree.draw = (ctx) => children.map((d) => d.draw(ctx));
    return drawTree;
  }
}
export const drawables = (...drawables: Drawable[]) => new Drawables(drawables);

export const transformD =
  (transform: CtxTransform = id, pad?: Vec2) =>
  (drawable: Drawable) =>
    new TransformDrawable(drawable, transform, pad);
export const boxD = (drawable: Drawable) => new BoxDrawable(drawable);
export const scaleD = (s: Vec2) => (drawable: Drawable) =>
  new TransformDrawable(drawable, scale(s));
export const translateD = (t: Vec2) => (drawable: Drawable) =>
  new TransformDrawable(drawable, translation(t));

export const padD = (p: Vec2) => (drawable: Drawable) =>
  new TransformDrawable(drawable, translation(p), mul(2, p));

export const lineD = (line: Vec2[] = []) => new LineDrawable(line);

export const pathD = (
  path: string,
  w: number,
  h: number,
  isFilled?: boolean,
  lineWidth?: number
): PathDrawable => new PathDrawable(w, h, path, isFilled, lineWidth);

export const textD = (
  text: string,
  fontSize: number,
  w: number,
  h: number
): TextDrawable => new TextDrawable(w, h, text, fontSize);
