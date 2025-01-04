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
const drawable = (draw) => {
    const x = {};
    const y = {};
    const w = {};
    const h = {};
    mapAll(x, y, w, h)(draw);
    let prevP;
    let done = false;
    const px = (v) => {
        // if (done) throw "cannot set so many p"; // TODO: but what about get?
        const pv = {};
        toEq(pv, add(x, mul({ val: v }, w)));
        toEq(w, mul({ val: 1 / v }, sub(pv, x)));
        toEq(x, sub(pv, mul({ val: v }, w)));
        if (prevP !== undefined) {
            const [v2, pv2] = prevP;
            toEq(w, mul({ val: 1 / (v2 - v) }, sub(pv2, pv)));
            done = true;
        }
        prevP = [v, pv];
        return pv;
    };
    // const x2 = p(1);
    // const c = p(0.5);
    return { w, h, x, y, px };
};
const group = (...ds) => {
    const minY = min(...ds.map((d) => d.y));
    const maxY = max(...ds.map((d) => add(d.y, d.h)));
    const minX = min(...ds.map((d) => d.x));
    const maxX = max(...ds.map((d) => add(d.x, d.w)));
    const h = sub(maxY, minY);
    const w = sub(maxX, minX);
    const x = minX;
    const y = minY;
    return { x, y, w, h };
};
const stackPadV = (pad) => (...ds) => {
    // TODO: make reverse w and x work
    // if something outside the stack sets the stack's x:
    // then check that this doesn't make anything in the stack fall outside of its width
    // and change the defaults for things in the stack so they don't default to outside of it
    for (let i = 0; i < ds.length - 1; i++) {
        const cur = ds[i];
        const next = ds[i + 1];
        toEq(next.y, add(cur.y, cur.h, { val: pad }));
        toEq(cur.y, add(sub(next.y, cur.h), { val: pad }));
    }
    return group(...ds);
};
const stackV = stackPadV(30);
const alignH = (zeroToOneAlign) => (...ds) => {
    // only one x should be set, create a loop to set all others
    for (let i = 0; i < ds.length; i++) {
        const cur = ds.at(i);
        const next = ds.at((i + 1) % ds.length);
        const curC = add(cur.x, map(cur.w)((w) => w * zeroToOneAlign));
        const nextHalfW = map(next.w)((w) => w * zeroToOneAlign);
        toEq(next.x, sub(curC, nextHalfW));
    }
    return group(...ds);
};
const centerH = alignH(0.5);
const stackH = (...ds) => {
    const h = map(all(...ds.flatMap((d) => [d.y, d.h])))((yhs) => {
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < yhs.length; i += 2) {
            const y = yhs[i];
            const h = yhs[i + 1];
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y + h);
        }
        return maxY - minY;
    });
    const y = map(all(...ds.map((d) => d.y)))((vs) => Math.min(...vs));
    const w = map(all(...ds.map((d) => d.w)))((ws) => ws.reduce((acc, w) => acc + w, 0));
    const x = ds[0].x;
    for (let i = 0; i < ds.length - 1; i++) {
        toEq(ds[i + 1].x, map(all(ds[i].x, ds[i].w))(([x, w]) => w + x));
        toEq(ds[i].x, map(all(ds[i + 1].x, ds[i].w))(([x, w]) => x - w));
    }
    return {
        w,
        h,
        x,
        y,
    };
};
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
const doLater = [];
const tree = (...ts) => {
    const d = drawable((...vs) => {
        ctx.fillStyle = "violet";
        ctx.fillRect(...vs);
    });
    console.log("hi", d);
    doLater.push(() => {
        set(d.h)(10);
        set(d.w)(10);
    });
    if (ts.length > 0) {
        const children = stackH(...ts);
        stackPadV(20)(d, children);
        centerH(d, children);
    }
    return d;
};
const root = tree(tree());
set(root.x)(100);
set(root.y)(100);
for (const f of doLater)
    f();
const d = drawable(() => { });
map(d.px(1))(console.log);
set(d.px(0.5))(0);
set(d.x)(-8);
