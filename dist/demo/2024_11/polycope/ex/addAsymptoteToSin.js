// make things crispy
const dpr = window.devicePixelRatio;
const h = c.height;
const w = c.width;
c.width = w * dpr;
c.height = h * dpr;
c.style.width = w + "px";
c.style.height = h + "px";
ctx.scale(dpr, dpr);

const M = [c.width / 2, c.height / 4];
const m = [...M];

addEventListener("mousemove", (e) => {
  m[0] = e.offsetX - c.width / 2;
  m[1] = e.offsetY - c.height / 4;
});

anim();
function anim() {
  requestAnimationFrame(anim);
  ctx.clearRect(0, 0, c.width, c.height);

  const zoom = 1;

  const f = (x) => 600 / (x - m[0]);
  const f2 = (x) => Math.sin(x / 60) * 100;
  const f3 = (x) => f(x) + f2(x);

  ctx.fillStyle = "blue";
  for (let x = -c.width / 2; x < c.width / 2; x += 0.1) {
    ctx.fillRect(x + M[0], f(x) + M[1], 0.1, 0.1);
  }

  ctx.fillStyle = "red";
  for (let x = -c.width / 2; x < c.width / 2; x += 0.1) {
    ctx.fillRect(x + M[0], f2(x) + M[1], 0.1, 0.1);
  }

  ctx.strokeStyle = "purple";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let prev = f3(-c.width / 2) + M[1];
  for (let x = -c.width / 2; x < c.width / 2; x += 0.1) {
    const cur = f3(x) + M[1];
    if (Math.abs(prev - cur) < 200) ctx.lineTo(x + M[0], cur);
    else ctx.moveTo(x + M[0], cur);
    prev = cur;
  }
  ctx.stroke();
}
