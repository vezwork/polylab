import { add, angleOf, length, setAngle, setLength, sub, } from "../../../lib/math/Vec2.js";
import { setPos } from "./dragging4.js";
import { setSphereCanvasPoint } from "./sphereCanvas.js";
import { v3normalize, v3rot } from "./v3.js";
const RADIUS = 100;
const circleRevert = (v) => length(v) === 0 // hack so 0 vector doesn't get mapped to [NaN, NaN]
    ? [1e10, 1e10]
    : setLength(RADIUS - length(v), setAngle(angleOf(v) + Math.PI)(v));
const uiDiskToUnitDisk = ([x, y]) => [(x / RADIUS) * 2, (y / RADIUS) * 2];
const unitDiskToUIDisk = ([x, y]) => [(x * RADIUS) / 2, (y * RADIUS) / 2];
const unitDiskToHemisphereStereo = ([x, y]) => {
    const h = x ** 2 + y ** 2;
    return [(2 * x) / (h + 1), (2 * y) / (h + 1), -(h - 1) / (h + 1)];
};
const hemisphereToUnitDiskStereo = ([x, y, z]) => [
    x / (1 + z),
    y / (1 + z),
];
const unitDiskToHemisphereVertical = ([x, y]) => [
    x,
    y,
    Math.sqrt(1 - x ** 2 - y ** 2),
];
const hemisphereToUnitDiskVertical = ([x, y, z]) => [x, y];
const unitDiskToHemisphere = unitDiskToHemisphereStereo;
const hemisphereToUnitDisk = hemisphereToUnitDiskStereo;
const twoUnitDisksToSphere = ({ disk, v }) => {
    const hemi = unitDiskToHemisphere(v);
    return disk === 0 ? hemi : [-hemi[0], -hemi[1], -hemi[2]];
};
const sphereToTwoUnitDisks = ([x, y, z]) => ({
    disk: z > 0 ? 0 : 1,
    v: z > 0
        ? hemisphereToUnitDisk([x, y, z])
        : hemisphereToUnitDisk([-x, -y, Math.abs(z)]),
});
function makeDraggable(state, el, ...clones) {
    let pos = [0, 0];
    let dragging = null;
    // modified from https://www.redblobgames.com/making-of/draggable/
    function start(event) {
        if (event.button !== 0)
            return; // left button only
        let { x, y } = state.eventToCoordinates(event);
        dragging = [pos[0] - x, pos[1] - y];
        el.classList.add("dragging");
        for (const clone of clones)
            clone.classList.add("dragging");
        el.setPointerCapture(event.pointerId);
    }
    function end(_event) {
        dragging = null;
        el.classList.remove("dragging");
        for (const clone of clones)
            clone.classList.remove("dragging");
    }
    function move(event) {
        if (dragging === null)
            return;
        let { x, y } = state.eventToCoordinates(event);
        const newPos = [x + dragging[0], y + dragging[1]];
        const diff = sub(newPos, pos);
        pos = newPos;
        state.movePos(diff);
    }
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointermove", move);
    el.addEventListener("touchstart", (e) => e.preventDefault());
}
function eventToSvgCoordinates(event, el = event.currentTarget) {
    const svg = el.ownerSVGElement;
    let p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    p = p.matrixTransform(svg.getScreenCTM().inverse());
    return p;
}
const makeCircleAndClone = (svg, show = true, draggable = true, r = "6", fill = "white") => {
    /*
    <circle class="draggable" r="6" mask="url(#myMask)"></circle>
      <circle class="clone draggable" r="6" cx="100" mask="url(#myMask)"></circle>
    */
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.append(circle);
    if (draggable)
        circle.classList.add("draggable");
    circle.setAttribute("r", r);
    //circle.setAttribute("mask", "url(#myMask)");
    circle.style.fill = fill;
    circle.style.visibility = show ? "visible" : "hidden";
    const clone = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.append(clone);
    if (draggable)
        clone.classList.add("draggable");
    clone.classList.add("clone");
    clone.setAttribute("r", r);
    clone.setAttribute("cx", "100");
    clone.style.fill = fill;
    //clone.setAttribute("mask", "url(#myMask)");
    return { circle, clone };
};
const createDot = (color = "red", r = "3") => {
    const { circle: ela, clone: clonea } = makeCircleAndClone(document.querySelector("#dragging2a"), true, false, r, color);
    const { circle: elb, clone: cloneb } = makeCircleAndClone(document.querySelector("#dragging2b"), false, false, r, color);
    let state = {
        el: ela,
        clone: cloneb,
        eventToCoordinates: eventToSvgCoordinates,
        dragging: null,
        pos: [0, 0],
        disk: 0,
        color(c) {
            ela.style.fill = c;
            elb.style.fill = c;
        },
        movePos(delta) {
            this.pos = add(this.pos, delta);
            if (length(this.pos) > 50) {
                this.disk ^= 1;
                this.pos = circleRevert(this.pos);
            }
            this.render();
        },
        render() {
            if (this.disk === 0) {
                ela.style.visibility = "visible";
                elb.style.visibility = "hidden";
                this.el = ela;
                cloneb.style.visibility = "visible";
                clonea.style.visibility = "hidden";
                this.clone = cloneb;
            }
            else {
                elb.style.visibility = "visible";
                ela.style.visibility = "hidden";
                this.el = elb;
                clonea.style.visibility = "visible";
                cloneb.style.visibility = "hidden";
                this.clone = clonea;
            }
            const cpos = circleRevert(this.pos);
            if (!Number.isNaN(cpos[0])) {
                this.clone?.setAttribute("cx", cpos[0] + "");
                this.clone?.setAttribute("cy", cpos[1] + "");
                this.el?.setAttribute("cx", this.pos[0] + "");
                this.el?.setAttribute("cy", this.pos[1] + "");
            }
        },
    };
    return state;
};
const createDraggableDot = () => {
    const { circle: ela, clone: clonea } = makeCircleAndClone(document.querySelector("#dragging2a"));
    const { circle: elb, clone: cloneb } = makeCircleAndClone(document.querySelector("#dragging2b"), false);
    let state = {
        el: ela,
        clone: cloneb,
        eventToCoordinates: eventToSvgCoordinates,
        dragging: null,
        pos: [0, 0],
        disk: 0,
        color(c) {
            ela.style.fill = c;
            elb.style.fill = c;
        },
        movePos(delta) {
            this.pos = add(this.pos, delta);
            if (length(this.pos) > 50) {
                this.disk ^= 1;
                this.pos = circleRevert(this.pos);
            }
            this.render();
        },
        render(shouldSetPos = true) {
            if (this.disk === 0) {
                ela.style.visibility = "visible";
                elb.style.visibility = "hidden";
                this.el = ela;
                cloneb.style.visibility = "visible";
                clonea.style.visibility = "hidden";
                this.clone = cloneb;
            }
            else {
                elb.style.visibility = "visible";
                ela.style.visibility = "hidden";
                this.el = elb;
                clonea.style.visibility = "visible";
                cloneb.style.visibility = "hidden";
                this.clone = clonea;
            }
            const cpos = circleRevert(this.pos);
            if (!Number.isNaN(cpos[0])) {
                // TODO: why is this sometimes NaN?
                this.clone?.setAttribute("cx", cpos[0] + "");
                this.clone?.setAttribute("cy", cpos[1] + "");
                this.el?.setAttribute("cx", this.pos[0] + "");
                this.el?.setAttribute("cy", this.pos[1] + "");
            }
            try {
                setSphereCanvasPoint(twoUnitDisksToSphere({
                    disk: this.disk,
                    v: uiDiskToUnitDisk(this.pos),
                }));
                if (shouldSetPos) {
                    const h = Math.abs(this.pos[1]);
                    const circleWidthAtY = Math.sqrt(50 ** 2 - h ** 2);
                    const ww = this.pos[0] / circleWidthAtY;
                    const hh = h / 50;
                    const v = [ww, hh];
                    if (this.disk === 0 && this.pos[1] >= 0) {
                        const ypart = [100 + hh * 100, 100 + hh * 100];
                        const xpart = [
                            (ww * 50 - 50) * (1 - hh),
                            (-ww * 50 + 50) * (1 - hh),
                        ];
                        setPos(...add(xpart, ypart));
                    }
                    else if (this.disk === 0 && this.pos[1] < 0) {
                        const ypart = [100 - hh * 100, 100 - hh * 100];
                        const xpart = [
                            (ww * 50 - 50) * (1 - hh),
                            (-ww * 50 + 50) * (1 - hh),
                        ];
                        setPos(...add(xpart, ypart));
                    }
                    else if (this.disk === 1 && this.pos[1] < 0) {
                        const ypart = [100 + hh * 100, 100 + hh * 100];
                        const xpart = [
                            -(-ww * 50 - 50) * (1 - hh),
                            -(ww * 50 + 50) * (1 - hh),
                        ];
                        setPos(...add(xpart, ypart));
                    }
                    else {
                        const ypart = [100 - hh * 100, 100 - hh * 100];
                        const xpart = [
                            -(-ww * 50 - 50) * (1 - hh),
                            -(ww * 50 + 50) * (1 - hh),
                        ];
                        setPos(...add(xpart, ypart));
                    }
                }
            }
            catch (e) { }
        },
    };
    makeDraggable(state, ela, cloneb, elb, clonea);
    makeDraggable(state, elb, clonea, ela, cloneb);
    makeDraggable(state, clonea, elb, ela, cloneb);
    makeDraggable(state, cloneb, elb, ela, clonea);
    return state;
};
let dots = [];
const lchValsToCssLchString = ([l, c, h]) => `lch(${l.toFixed(1)}% ${c.toFixed(1)} ${h.toFixed(1)}rad)`;
const SPACING = 3;
const SIZE = "3.8";
const todoDots = [];
const CHROMA = 77;
for (let x = -50; x < 50; x += SPACING) {
    for (let y = -50; y < 50; y += SPACING) {
        if (length([x, y]) < 50) {
            const hemicoord = unitDiskToHemisphere([x / 50, y / 50]);
            const color = lchValsToCssLchString([
                50 + hemicoord[2] * 50,
                CHROMA,
                angleOf([x, y]),
            ]);
            todoDots.push({ hemicoord, color, x, y, disk: 0 });
            // const dot = createDot(color, SIZE);
            // dot.pos = [x, y];
            // dot.render();
            // dots.push(dot);
        }
    }
}
for (let x = -50; x < 50; x += SPACING) {
    for (let y = -50; y < 50; y += SPACING) {
        if (length([x, y]) < 50) {
            const hemicoord = unitDiskToHemisphere([x / 50, y / 50]);
            const color = lchValsToCssLchString([
                50 - hemicoord[2] * 50,
                CHROMA,
                angleOf([-x, -y]),
            ]);
            todoDots.push({ hemicoord, color, x, y, disk: 1 });
            // const dot = createDot(color, SIZE);
            // dot.pos = [x, y];
            // dot.disk = 1;
            // dot.render();
            // dots.push(dot);
        }
    }
}
todoDots.sort(() => Math.random() - 0.5);
for (const { color, x, y, disk } of todoDots) {
    const dot = createDot(color, SIZE);
    dot.pos = [x, y];
    dot.disk = disk;
    dot.render();
    dots.push(dot);
}
// const s1 = createDraggableDot();
// s1.pos = [49.99, 0];
// s1.render();
// const s2 = createDraggableDot();
// s2.pos = [-49.99, 0];
// s2.render();
// const s3 = createDraggableDot();
// s3.pos = [0, 49.99];
// s3.render();
// const s4 = createDraggableDot();
// s4.pos = [0, -49.99];
// s4.render();
// const s5 = createDraggableDot();
// s5.pos = [0, 0];
// s5.render();
// const s6 = createDraggableDot();
// s6.pos = [0, 0];
// s6.disk = 1;
// s6.render();
// I want to try doing an axis-angle rotation on all points!
// const s = s1;
// const h = twoUnitDisksToSphere({
//   disk: s.disk,
//   v: uiDiskToUnitDisk(s.pos),
// }) as V3;
// const rh = qap(qfromAxisAngle([0, 0, 1], 0.1))(h);
// const go = sphereToTwoUnitDisks(rh);
// console.log(s.pos, go.disk, unitDiskToUIDisk(go.v));
const AXIS = v3normalize([1, 0, 1]);
const saxis = createDraggableDot();
const tt = sphereToTwoUnitDisks(AXIS);
saxis.pos = unitDiskToUIDisk(tt.v);
saxis.disk = tt.disk;
// saxis.color("red");
saxis.render();
const points = []; //[s1, s2, s3, s4, s5, s6];
function draw() {
    requestAnimationFrame(draw);
    let i = 0;
    for (const s of [...points, ...dots]) {
        const h = twoUnitDisksToSphere({
            disk: s.disk,
            v: uiDiskToUnitDisk(s.pos),
        });
        const rh = v3rot(twoUnitDisksToSphere({
            disk: saxis.disk,
            v: uiDiskToUnitDisk(saxis.pos),
        }), 0.05)(h);
        const go = sphereToTwoUnitDisks(rh);
        s.pos = unitDiskToUIDisk(go.v);
        s.disk = go.disk;
        s.render();
        i++;
    }
}
//requestAnimationFrame(draw);
// make the background draw on-top
document
    .querySelector("#dragging2a")
    .append(document.getElementById("dragging2a_background_rect"));
document
    .querySelector("#dragging2b")
    .append(document.getElementById("dragging2b_background_rect"));
document
    .querySelector("#dragging2a")
    .append(document.getElementById("dragging2a_border"));
document
    .querySelector("#dragging2b")
    .append(document.getElementById("dragging2b_border"));
export const colorPickerSetPos = (x, y, disk) => {
    saxis.pos = [x, y];
    saxis.disk = disk;
    saxis.render(false);
};
