import {
  CtxTransform,
  id,
  _,
  apply,
  translation,
  scale,
  zeroTranslate,
} from "../math/CtxTransform.js";
import { max } from "../math/Number.js";
import { Vec2, length, x, y, sub } from "../math/Vec2.js";

export type DrawTree = {
  caretable?: true;
  d: BoundedDrawable;
  children: DrawTree[];
  parent: DrawTree | null;
  t: CtxTransform;
};
interface Drawable {
  draw(
    ctx: CanvasRenderingContext2D,
    transform: CtxTransform,
    parent: DrawTree | null
  ): DrawTree;
}
export const draw =
  (ctx: CanvasRenderingContext2D, t: CtxTransform = id) =>
  (d: Drawable) =>
    d.draw(ctx, t, null);

export interface BoundedDrawable extends Drawable {
  readonly w: number;
  readonly h: number;
}

class PathDrawable implements BoundedDrawable {
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
  draw(
    ctx: CanvasRenderingContext2D,
    t: CtxTransform,
    parent: DrawTree | null
  ): DrawTree {
    ctx.save();
    ctx.setTransform(...t);
    if (this.isFilled) ctx.fill(this.p2d);
    if (this.lineWidth !== 0) {
      ctx.lineWidth = this.lineWidth;
      ctx.stroke(this.p2d);
    }
    ctx.restore();
    return {
      d: this,
      children: [],
      parent,
      t,
    };
  }
}
class LineDrawable implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(readonly line: Vec2[]) {
    this.w = max(line.map(x));
    this.h = max(line.map(y));
  }
  draw(
    ctx: CanvasRenderingContext2D,
    t: CtxTransform,
    parent: DrawTree | null
  ): DrawTree {
    const line = this.line;
    ctx.beginPath();
    if (line[0]) ctx.moveTo(...apply(t)(line[0]));
    for (const p of line) {
      ctx.lineTo(...apply(t)(p));
    }
    ctx.stroke();
    ctx.closePath();
    return {
      d: this,
      children: [],
      parent,
      t,
    };
  }
}
class ImageDrawable implements BoundedDrawable {
  constructor(
    readonly w: number,
    readonly h: number,
    readonly image: CanvasImageSource
  ) {}
  draw(
    ctx: CanvasRenderingContext2D,
    t: CtxTransform,
    parent: DrawTree | null
  ): DrawTree {
    ctx.setTransform(...t);
    ctx.drawImage(this.image, 0, 0);

    ctx.resetTransform();
    return {
      d: this,
      children: [],
      parent,
      t,
    };
  }
}
export const image = (
  image: CanvasImageSource,
  width = typeof image?.width === "object" && "animVal" in image?.width
    ? image.width.animVal.value
    : image.width,
  height = typeof image?.height === "object" && "animVal" in image?.height
    ? image.height.animVal.value
    : image.height
) => new ImageDrawable(width, height, image);

class TextDrawable implements BoundedDrawable {
  constructor(
    readonly w: number,
    readonly h: number,
    readonly text: string,
    readonly fontSize: number
  ) {}
  draw(
    ctx: CanvasRenderingContext2D,
    t: CtxTransform,
    parent: DrawTree | null
  ): DrawTree {
    ctx.setTransform(...t);

    ctx.translate(0, this.h);
    ctx.font = `${this.fontSize}px monospace`;
    ctx.textBaseline = "bottom";
    ctx.fillText(this.text, 0, 0);

    ctx.resetTransform();
    return {
      d: this,
      children: [],
      parent,
      t,
    };
  }
}
class TransformDrawable implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(
    /*readonly*/ public drawable: BoundedDrawable,
    readonly transform: CtxTransform,
    w?: number,
    h?: number
  ) {
    const [tw, th] = apply(transform)([drawable.w, drawable.h]);
    this.w = tw;
    this.h = th;
    if (w !== undefined) this.w = w;
    if (h !== undefined) this.h = h;
  }
  draw(
    ctx: CanvasRenderingContext2D,
    t: CtxTransform,
    parent: DrawTree | null
  ): DrawTree {
    const scaleFactor = length(apply(zeroTranslate(t))([1, 1]));
    const drawTree: DrawTree = {
      d: this,
      children: [],
      t,
      parent,
    };
    drawTree.children =
      scaleFactor < 0.1
        ? []
        : [this.drawable.draw(ctx, _(this.transform)(t), drawTree)]; // dont render small stuff
    return drawTree;
  }
}
class CaretableDrawable implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(/*readonly*/ public drawable: BoundedDrawable) {
    this.w = drawable.w;
    this.h = drawable.h;
  }
  draw(
    ctx: CanvasRenderingContext2D,
    t: CtxTransform,
    parent: DrawTree | null
  ): DrawTree {
    const drawTree: DrawTree = {
      caretable: true,
      d: this,
      children: [],
      t,
      parent,
    };
    drawTree.children = [this.drawable.draw(ctx, t, drawTree)];
    return drawTree;
  }
}
export const caretable = (slot: BoundedDrawable) => new CaretableDrawable(slot);

class DebugDrawable implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(/*readonly*/ public drawable: BoundedDrawable) {
    this.w = drawable.w;
    this.h = drawable.h;
  }
  draw(
    ctx: CanvasRenderingContext2D,
    t: CtxTransform,
    parent: DrawTree | null
  ): DrawTree {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "red";
    ctx.transform(...t);
    ctx.stroke(new Path2D(`M0 0 h ${this.w} v ${this.h} h ${-this.w} Z`));
    ctx.restore();

    const drawTree: DrawTree = {
      d: this,
      children: [],
      t,
      parent,
    };
    drawTree.children = [this.drawable.draw(ctx, t, drawTree)];
    return drawTree;
  }
}
class Drawables implements BoundedDrawable {
  readonly w: number;
  readonly h: number;
  constructor(readonly drawables: BoundedDrawable[]) {
    this.w = drawables.reduce((prev, cur) => Math.max(cur.w, prev), 0);
    this.h = drawables.reduce((prev, cur) => Math.max(cur.h, prev), 0);
  }
  draw(
    ctx: CanvasRenderingContext2D,
    t: CtxTransform,
    parent: DrawTree | null
  ): DrawTree {
    const drawTree: DrawTree = {
      d: this,
      children: [],
      t,
      parent,
    };
    drawTree.children = this.drawables.map((d) => d.draw(ctx, t, drawTree));
    return drawTree;
  }
}
export const drawables = (...drawables: BoundedDrawable[]) =>
  new Drawables(drawables);

export const debug = (drawable: BoundedDrawable) => new DebugDrawable(drawable);

export const besideReducerThing =
  <D extends BoundedDrawable>(
    f: (x: number, h: number, d: D) => CtxTransform
  ) =>
  (...children: D[]): Drawables => {
    const h = children.reduce((prev, cur) => Math.max(cur.h, prev), 0);
    let transXAccum = 0;
    return new Drawables(
      children.map((d) => {
        const transX = transXAccum;
        transXAccum += d.w;
        return new TransformDrawable(d, f(transX, h, d));
      })
    );
  };

export const justBesideD = besideReducerThing((x) => translation([x, 0]));
export const centerBesideD = besideReducerThing((x, h, d) =>
  translation([x, (h - d.h) / 2])
);
const scaleToHT = (d: BoundedDrawable, h: number): CtxTransform =>
  scale([1, h / d.h]);
export const besideD = besideReducerThing((x, h, d) =>
  _(translation([x, 0]))(scaleToHT(d, h))
);

export const overReducerThing =
  <D extends BoundedDrawable>(
    f: (x: number, w: number, d: D) => CtxTransform
  ) =>
  (...children: D[]): Drawables => {
    const w = children.reduce((prev, cur) => Math.max(cur.w, prev), 0);
    let transYAccum = 0;
    return new Drawables(
      children.map((d) => {
        const transY = transYAccum;
        transYAccum += d.h;
        return new TransformDrawable(d, f(transY, w, d));
      })
    );
  };
export const justOverD = overReducerThing((y) => translation([0, y]));
export const centerOverD = overReducerThing((y, w, d) =>
  translation([(w - d.w) / 2, y])
);
const scaleToWT = (d: BoundedDrawable, w: number): CtxTransform =>
  scale([w / d.w, 1]);
export const overD = overReducerThing((y, w, d) =>
  _(translation([0, y]))(scaleToWT(d, w))
);

export const transformD =
  (transform: CtxTransform = id) =>
  (drawable: BoundedDrawable) =>
    new TransformDrawable(drawable, transform);
export const scaleD = (s: Vec2) => (drawable: BoundedDrawable) =>
  new TransformDrawable(drawable, scale(s));
export const translateD = (t: Vec2) => (drawable: BoundedDrawable) =>
  new TransformDrawable(drawable, translation(t));

export const padD = (p: Vec2) => (drawable: BoundedDrawable) =>
  new TransformDrawable(
    drawable,
    translation(p),
    drawable.w + p[0] * 2,
    drawable.h + p[1] * 2
  );

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

export const getBounds = (e: DrawTree) => {
  const [x1, y1] = apply(e.t)([0, 0]);
  const [width1, height1] = sub(apply(e.t)([e.d.w, e.d.h]), [x1, y1]);
  const [x, y] = [x1 + 1, y1 + 1]; // hack: slightly offset actual bounds
  const [width, height] = [width1 - 2, height1 - 2];
  return {
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    width,
    height,
    x,
    y,
  };
};
