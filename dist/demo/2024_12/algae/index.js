// want each drawable to have its x and y filled in
// before being drawn
// for now we couuld give each drawable a renderInfo map
// actually we can make draw be called with the result of
// the things it depends on
import { SetMap } from "../../../lib/structure/data.js";
const onSet = new SetMap();
const addOnSet = (ob, f) => onSet.add(ob, f);
const getOnSet = (ob) => onSet.get(ob) ?? [];
const set = (ob) => (v) => {
    if (ob.val !== undefined)
        return;
    ob.val = v;
    for (const f of getOnSet(ob))
        f(v);
};
const eq = (ob1, ob2) => {
    addOnSet(ob1, set(ob2));
    addOnSet(ob2, set(ob1));
};
// when ob1 is set, set ob2
const toEq = (ob2, ob1) => {
    addOnSet(ob1, set(ob2));
};
const all = (...obs) => {
    const allOb = {};
    const afterAll = () => {
        if (obs.every(({ val }) => val !== undefined))
            set(allOb)(obs.map(({ val }) => val));
    };
    for (const ob of obs)
        addOnSet(ob, afterAll);
    return allOb;
};
const map = (ob) => (f) => {
    const mappedOb = {};
    addOnSet(ob, (v) => set(mappedOb)(f(v)));
    return mappedOb;
};
const mapAll = (...obs) => (f) => {
    const mappedOb = {};
    addOnSet(all(...obs), (v) => set(mappedOb)(f(...v)));
    return mappedOb;
};
const add = (...obs) => mapAll(...obs)((...vs) => vs.reduce((s, v) => s + v));
const mul = (...obs) => mapAll(...obs)((...vs) => vs.reduce((s, v) => s * v));
const min = (...obs) => mapAll(...obs)(Math.min);
const max = (...obs) => mapAll(...obs)(Math.max);
const sub = (ob1, ob2) => mapAll(ob1, ob2)((v1, v2) => v1 - v2);
const div = (ob1, ob2) => mapAll(ob1, ob2)((v1, v2) => v1 / v2);
// TODO: defaults
// TODO?: ownership
const interval = () => {
    const x = {};
    const w = {};
    let cachedP = {};
    let prevP;
    const p = (v) => {
        if (v === 0)
            return x;
        if (cachedP[v])
            return cachedP[v];
        const pv = {};
        cachedP[v] = pv;
        toEq(pv, add(x, mul({ val: v }, w)));
        toEq(w, mul({ val: 1 / v }, sub(pv, x)));
        toEq(x, sub(pv, mul({ val: v }, w)));
        if (prevP !== undefined) {
            const [v2, pv2] = prevP;
            toEq(w, mul({ val: 1 / (v2 - v) }, sub(pv2, pv)));
        }
        prevP = [v, pv];
        return pv;
    };
    return { w, p };
};
const drawable = (draw) => {
    const { p: px, w } = interval();
    const { p: py, w: h } = interval();
    const x = px(0);
    const y = py(0);
    mapAll(x, y, w, h)(draw);
    return { w, h, x, y, px, py };
};
let id = 0;
let sett = new SetMap();
const group = (...ds) => {
    id += 1;
    const minY = min(...ds.map((d) => d.y));
    const maxY = max(...ds.map((d) => add(d.y, d.h)));
    const dxs = ds.map((d) => d.x);
    const minX = min(...dxs);
    const maxX = max(...ds.map((d) => add(d.x, d.w)));
    const h = sub(maxY, minY);
    const w = sub(maxX, minX);
    const x = minX;
    const y = minY;
    return { x, y, w, h };
};
const forLaterStackPad = [];
const stackPad = (x, w) => (pad) => (...ds) => {
    for (let i = 0; i < ds.length - 1; i++) {
        const cur = ds[i];
        const next = ds[i + 1];
        toEq(x(next), add(x(cur), w(cur), { val: pad }));
        toEq(x(cur), sub(sub(x(next), w(cur)), { val: pad }));
    }
};
const stackPadV = (pad) => (...ds) => {
    // TODO: make reverse w and x work
    // if something outside the stack sets the stack's x:
    // then check that this doesn't make anything in the stack fall outside of its width
    // and change the defaults for things in the stack so they don't default to outside of it
    const g = group(...ds);
    const totalPad = (ds.length - 1) * pad;
    const h = add(...ds.map((d) => d.h), { val: totalPad });
    const y = ds[0].y;
    stackPad((d) => d.y, (d) => d.h)(pad)(...ds);
    return { x: g.x, w: g.w, h, y };
};
const stackPadH = (pad) => (...ds) => {
    // TODO: make reverse w and x work
    // if something outside the stack sets the stack's x:
    // then check that this doesn't make anything in the stack fall outside of its width
    // and change the defaults for things in the stack so they don't default to outside of it
    const g = group(...ds);
    const totalPad = (ds.length - 1) * pad;
    const w = add(...ds.map((d) => d.w), { val: totalPad });
    const x = ds[0].x;
    stackPad((d) => d.x, (d) => d.w)(pad)(...ds);
    return { y: g.y, h: g.h, x, w };
};
const stackV = stackPadV(0);
const stackH = stackPadH(0);
const align = (p) => (...ds) => {
    // only one x should be set, create a loop to set all others
    for (let i = 0; i < ds.length; i++) {
        const cur = ds.at(i);
        const next = ds.at((i + 1) % ds.length);
        toEq(p(next), p(cur));
    }
    return group(...ds);
};
const alignH = (zeroToOneAlign) => (...ds) => {
    const g = group(...ds);
    const w = max(...ds.map((d) => d.w));
    // only one x should be set, create a loop to set all others
    for (let i = 0; i < ds.length; i++) {
        const cur = ds.at(i);
        const next = ds.at((i + 1) % ds.length);
        const curC = add(cur.x, map(cur.w)((w) => w * zeroToOneAlign));
        const nextHalfW = map(next.w)((w) => w * zeroToOneAlign);
        toEq(next.x, sub(curC, nextHalfW));
    }
    return { w, x: g.x, h: g.h, y: g.y };
};
const centerH = alignH(0.5);
// const alignV = (zeroToOneAlign: number) => align((d) => d.py(zeroToOneAlign));
// const centerV = alignV(0.5);
const c = document.getElementById("c");
const ctx = c.getContext("2d");
const d1 = drawable((...vs) => {
    ctx.fillStyle = "orange";
    ctx.fillRect(...vs);
});
const d2 = drawable((...vs) => {
    ctx.fillStyle = "violet";
    ctx.fillRect(...vs);
});
const d3 = drawable((...vs) => {
    ctx.fillStyle = "CornflowerBlue";
    ctx.fillRect(...vs);
});
const d4 = drawable((...vs) => {
    ctx.fillStyle = "YellowGreen";
    ctx.fillRect(...vs);
});
const v = stackV(d1, d2, d4);
stackH(v, d3);
centerH(d1, d2, d4);
mapAll(d2.x, d2.y, d3.x, d3.y)((x1, y1, x2, y2) => {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
});
const b = group(d1, d2, d3, v);
mapAll(b.x, b.y, b.w, b.h)((x, y, w, h) => {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.lineTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.stroke();
});
set(d1.h)(100);
set(d1.w)(100);
set(d2.h)(100);
set(d2.w)(200);
set(d3.h)(100);
set(d3.w)(100);
set(d4.h)(20);
set(d4.w)(20);
set(d1.y)(100);
// set(d1.x)(100);
set(d2.x)(120);
set(d3.y)(0);
const d5 = drawable((...vs) => {
    ctx.fillStyle = "red";
    ctx.fillRect(...vs);
});
const d6 = drawable((...vs) => {
    ctx.fillStyle = "blue";
    ctx.fillRect(...vs);
});
const d7 = drawable((...vs) => {
    ctx.fillStyle = "green";
    ctx.fillRect(...vs);
});
const d8 = drawable((...vs) => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(...vs);
});
// const doLater: Function[] = [];
// const tree = (...ts) => {
//   const d = drawable((...vs) => {
//     ctx.fillStyle = "violet";
//     ctx.fillRect(...vs);
//   });
//   doLater.push(() => {
//     set(d.h)(10);
//     set(d.w)(10);
//   });
//   if (ts.length > 0) {
//     const children = stackPadH(0)(...ts);
//     const s = stackPadV(10)(d, children); // WARNING!!! THIS HAS LESS HORIZONTAL INFO THAN YOU MIGHT EXPECT
//     centerH(d, children); // THIS LINE SHOULD ADD THAT HORIZONTAL INFO SOMEHOW!
//     // IN GENERAL THOUGH: we would need to do analysis on the relationships
//     // TODO: return d and children, not just d
//     // really need to properly implement defaults and use them for setting group properties
//     console.log("children", children, "s", s);
//     return s;
//   }
//   console.log("d", d);
//   return d;
// };
// const root = tree(tree(tree(), tree()));
// set(root.x)(100);
// set(root.y)(400);
// for (const f of doLater) f();
// // const d = drawable(() => {});
// // map(d.px(1))(console.log);
// // set(d.px(0.5))(0);
// // set(d.x)(-8);
// while (forLaterStackPad.length > 0) forLaterStackPad.pop()!();
