function makeDraggable(state, el) {
    // from https://www.redblobgames.com/making-of/draggable/
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        //if (event.target instanceof SVGTextElement) return;
        let { x, y } = state.eventToCoordinates(event);
        state.dragging = { dx: state.pos.x - x, dy: state.pos.y - y };
        el.classList.add("dragging");
        el.setPointerCapture(event.pointerId);
    }
    function end(_event) {
        state.dragging = null;
        el.classList.remove("dragging");
    }
    function move(event) {
        if (!state.dragging)
            return;
        event.preventDefault();
        let { x, y } = state.eventToCoordinates(event);
        state.pos = { x: x + state.dragging.dx, y: y + state.dragging.dy };
    }
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointermove", move);
    el.addEventListener("touchstart", (e) => e.preventDefault());
}
const svg = document.querySelector("#dragging1");
const createLine = () => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add("line");
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", "0");
    l.setAttribute("y1", "-10");
    l.setAttribute("x2", "0");
    l.setAttribute("y2", "10");
    l.setAttribute("stroke", "black");
    l.setAttribute("stroke-width", "1");
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", "0");
    t.setAttribute("y", "25");
    t.setAttribute("text-anchor", "middle");
    g.append(l, t);
    svg.append(g);
    return g;
};
const getLine = (i) => {
    const lines = document.querySelectorAll("#dragging1 .line");
    const line = lines[i];
    if (line)
        return line;
    else
        return createLine();
};
let zoom = 10;
const RATE = 50;
const WIDTH = 280;
const MAXSIZE = 1.5;
const FALLOFF = WIDTH * 0.87;
const bump = (n) => Math.max(0, -((n / FALLOFF) ** 2) + MAXSIZE);
// smooth partial geometric series formula ref: https://activecalculus.org/single/sec-8-2-geometric.html
const geomSeries = (a, r) => (n) => (a * (1 - r ** n)) / (1 - r);
const approachOne = (ratio) => geomSeries(ratio, 1 - ratio);
const f = (n, z) => approachOne(1 / 5)(Math.abs(n) * z) * Math.sign(n);
let state = {
    eventToCoordinates(event) {
        return { x: event.clientX, y: event.clientY };
    },
    dragging: null,
    _pos: undefined,
    get pos() {
        return this._pos;
    },
    set pos(p) {
        this._pos = { x: p.x, y: p.y };
        this.render();
    },
    render() {
        if (!this._pos)
            return;
        const x = -this._pos.x / RATE;
        const px = (n) => f(n - x, zoom) * WIDTH;
        const WIDTH_ZOOM1 = 35;
        const pwidth = (x, zoom) => [
            x - WIDTH_ZOOM1 / zoom,
            x + WIDTH_ZOOM1 / zoom,
        ];
        const [min, max] = pwidth(x, zoom);
        let linei = 0;
        const insertp = (n, prevn, nextn) => {
            const pos = px(n);
            const prevpos = px(prevn);
            const nextpos = px(nextn);
            if (Math.abs(nextpos - pos) > 10) {
                insertp((n + nextn) / 2, n, nextn);
            }
            if (Math.abs(prevpos - pos) > 10) {
                insertp((n + prevn) / 2, prevn, n);
            }
            const size = Math.min(Math.abs(prevpos - nextpos) / 300, 2);
            // const depth = Math.abs(prevn - nextn) / 2;
            // const o = Math.abs(zoom - 1 / depth);
            // const oo = Math.max(1 - (o / 2) ** 2, 0);
            // const size = depth * bump(pos);
            const line = getLine(linei);
            line?.setAttribute("transform", `translate(${pos.toFixed(3)} 0) scale(${size.toFixed(3)})`);
            line.querySelector("text").textContent = n.toFixed(2);
            linei++;
        };
        let gap = 1;
        for (let i = Math.trunc(x); i < Math.ceil(max); i += gap) {
            insertp(i, i - gap, i + gap);
        }
        for (let i = Math.trunc(x - gap); i > Math.floor(min); i -= gap) {
            insertp(i, i - gap, i + gap);
        }
        // hide unused lines
        const lines = document.querySelectorAll("#dragging1 .line");
        for (linei; linei < lines.length; linei++) {
            const line = lines[linei];
            line?.setAttribute("transform", `translate(60000)`);
        }
    },
};
function draw() {
    requestAnimationFrame(draw);
    zoom += 0.001;
    console.log(zoom);
    state.render();
}
//draw();
state.pos = { x: 0, y: 0 };
makeDraggable(state, document.querySelector("#dragging1"));
export {};
