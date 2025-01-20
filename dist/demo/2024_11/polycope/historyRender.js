import { SetMap } from "../../../lib/structure/data.js";
export const createHistoryTreeVis = (setHistoryHead, bigreduce, sandboxedEval, lastCheckpoint, getHistoryRoot, CHECKPOINT_THUMB_SIZE, e1) => {
    // HISTORY TREE STUFF
    const filteredNexts = (node, f) => {
        let todo = [node];
        let done = [];
        while (todo.length > 0) {
            const cur = todo.pop();
            for (const next of cur.next.toReversed()) {
                if (f(next))
                    done.push(next);
                else
                    todo.push(next);
            }
        }
        return done;
    };
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    // Handle dpr
    const dpr = window.devicePixelRatio;
    c.width = (window.innerWidth - 20) * dpr;
    c.height = 750 * dpr;
    c.style.width = window.innerWidth - 20 + "px";
    c.style.height = 750 + "px";
    ctx.scale(dpr, dpr);
    const square = (w, h, img, isLastCheckpoint) => {
        const obj = { w, h };
        obj.draw = (x, y, ctx) => {
            obj.x = x;
            obj.y = y;
            if (img) {
                const pattern = ctx.createPattern(img, "no-repeat");
                if (pattern) {
                    pattern.setTransform({
                        a: w / CHECKPOINT_THUMB_SIZE,
                        b: 0,
                        c: 0,
                        d: h / CHECKPOINT_THUMB_SIZE,
                        e: x,
                        f: y,
                    });
                    ctx.fillStyle = pattern;
                }
                else {
                    ctx.fillStyle = "violet";
                }
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 5);
                ctx.fill();
                if (isLastCheckpoint) {
                    ctx.fillStyle = "violet";
                    ctx.fillRect(x + w / 2 - 2.5, y + h, 5, 5);
                    ctx.strokeStyle = "violet";
                }
                else {
                    ctx.strokeStyle = "black";
                }
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        };
        return obj;
    };
    const centerX = (...ds) => {
        const w = Math.max(...ds.map((d) => d.w));
        const h = Math.max(...ds.map((d) => d.h));
        const obj = { w, h };
        const draw = (x, y, ctx) => {
            obj.x = x;
            obj.y = y;
            const cw = x + w / 2;
            for (const d of ds) {
                const dHalfW = d.w / 2;
                d.draw(cw - dHalfW, y, ctx);
            }
        };
        obj.draw = draw;
        return obj;
    };
    const juxtH = (pad, ...ds) => {
        const w = ds.reduce((prev, cur) => prev + cur.w, 0) + pad * (ds.length - 1);
        const h = Math.max(...ds.map((d) => d.h));
        const obj = { w, h };
        const draw = (x, y, ctx) => {
            obj.x = x;
            obj.y = y;
            let curX = x;
            for (const d of ds) {
                d.draw(curX, y, ctx);
                curX += d.w + pad;
            }
        };
        obj.draw = draw;
        return obj;
    };
    const juxtV = (pad, ...ds) => {
        const h = ds.reduce((prev, cur) => prev + cur.h, 0) + pad * (ds.length - 1);
        const w = Math.max(...ds.map((d) => d.w));
        const obj = { w, h };
        const draw = (x, y, ctx) => {
            obj.x = x;
            obj.y = y;
            let curY = y;
            for (const d of ds) {
                d.draw(x, curY, ctx);
                curY += d.h + pad;
            }
        };
        return { w, h, draw };
    };
    const rels = new SetMap();
    const checkpoints = new Map();
    const t = (checkpoint, ...ds) => {
        const root = square(50, 50, checkpoint?.image, checkpoint === lastCheckpoint()?.checkpoint);
        checkpoints.set(root, checkpoint);
        for (const [r] of ds)
            rels.add(root, r);
        return [root, juxtH(12, root, juxtV(16, ...ds.map((d) => d[1])))];
    };
    const historyToTree = (hNode) => t(hNode.checkpoint, ...filteredNexts(hNode, (n) => n.checkpoint).map(historyToTree));
    let origin = [-50, 20];
    drawHistoryTree();
    function drawHistoryTree() {
        //requestAnimationFrame(draw);
        ctx.clearRect(0, 0, c.width, c.height);
        rels.clear();
        checkpoints.clear();
        historyToTree(getHistoryRoot())[1].draw(...origin, ctx);
        for (const [p, cs] of rels) {
            for (const c of cs) {
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;
                ctx.beginPath();
                const s = [p.x + p.w, p.y + p.h / 2];
                const e = [c.x, c.y + c.w / 2];
                ctx.moveTo(...s);
                ctx.lineTo(s[0] + (e[0] - s[0]) / 2, s[1]);
                ctx.lineTo(s[0] + (e[0] - s[0]) / 2, e[1]);
                ctx.lineTo(...e);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(drawHistoryTree);
    let mouseDown = false;
    c.addEventListener("mousedown", (e) => {
        mouseDown = true;
    });
    document.addEventListener("mouseup", (e) => {
        mouseDown = false;
    });
    document.addEventListener("mousemove", (e) => {
        if (mouseDown) {
            origin[0] += e.movementX;
            origin[1] += e.movementY;
            drawHistoryTree();
        }
    });
    c.addEventListener("click", (e) => {
        const x = e.offsetX;
        const y = e.offsetY;
        for (const [n, h] of checkpoints) {
            if (x > n.x && x < n.x + n.w && y > n.y && y < n.y + n.h) {
                setHistoryHead(h.node);
                bigreduce();
                const toEval = e1.str.join("");
                sandboxedEval(toEval, () => drawHistoryTree());
                return;
            }
        }
    });
    return { c, drawHistoryTree };
};
