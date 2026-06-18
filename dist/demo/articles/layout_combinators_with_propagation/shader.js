// source: https://observablehq.com/@vezwork/webgl2-shader

function createShader(gl, type, ...sources) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, sources.join("\n"));
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  throw new Error(gl.getShaderInfoLog(shader));
}
function createProgram(gl, ...shaders) {
  const program = gl.createProgram();
  for (const shader of shaders) gl.attachShader(program, shader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  throw new Error(gl.getProgramInfoLog(program));
}

export function shader({
  width = 640,
  height = 480,
  devicePixelRatio = window.devicePixelRatio,
  preserveDrawingBuffer = false,
  visibility, // if present, only draw when resolves
  inputs = {}, // bind inputs to uniforms
  iTime,
  iMouse,
  sources = [],
  uniforms = {},
}) {
  uniforms = new Map(
    Object.entries(uniforms).map(([name, value]) => {
      let [_, type, dims] = value.match(/([^[]+)((?:\[[\s0-9]+\])*)*/);
      return [name, { type, dims }];
    })
  );
  for (const { type } of uniforms.values())
    if (type !== "float") throw new Error(`unknown type: ${type}`);
  if (iTime && !uniforms.has("iTime")) uniforms.set("iTime", { type: "float" });
  if (iMouse && !uniforms.has("iMouse"))
    uniforms.set("iMouse", { type: "vec4" });

  inputs = new Map(Object.entries(inputs));
  for (const name of inputs.keys())
    if (!uniforms.has(name)) uniforms.set(name, { type: "float" });

  return function () {
    const source = String.raw.apply(String, arguments);
    const canvas = document.createElement("canvas");
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer });
    canvas.style = `max-width: 100%; width: ${width}px; height: auto;`;

    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      `#version 300 es
precision highp float;

${Array.from(
  uniforms,
  ([name, { type, dims }]) => `uniform ${type} ${name}${dims || ""};`
).join("\n")}
 
const vec3 iResolution = vec3(
  ${(width * devicePixelRatio).toFixed(1)}, 
  ${(height * devicePixelRatio).toFixed(1)}, 
  ${devicePixelRatio.toFixed(1)}
);`,
      ...sources,
      source,
      `
out vec4 fragColor;
void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}`
    );

    const vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}`
    );

    const program = createProgram(gl, vertexShader, fragmentShader);
    const positionAttributeLocation = gl.getAttribLocation(
      program,
      "a_position"
    );
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    for (const [name, u] of uniforms)
      u.location = gl.getUniformLocation(program, name);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    async function render() {
      if (visibility !== undefined) await visibility();
      frame = undefined;
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // TODO: hook up some sort of disposal
    const ondispose = new Promise(() => {});
    let disposed = false;
    ondispose.then(() => (disposed = true));

    Object.assign(canvas, {
      update(values = {}) {
        if (disposed) return false;
        for (const name in values) {
          const u = uniforms.get(name);
          if (!u) throw new Error(`unknown uniform: ${name}`);
          gl.uniform1f(u.location, values[name]);
        }
        frame || requestAnimationFrame(render);
        return true;
      },
    });

    for (const [name, input] of inputs) {
      const u = uniforms.get(name);
      if (!u) throw new Error(`unknown uniform: ${name}`);
      gl.uniform1f(u.location, input.value);
      const update = () => {
        gl.uniform1f(u.location, input.value);
        frame || requestAnimationFrame(render);
      };
      input.addEventListener("input", update);
      ondispose.then(() => input.removeEventListener("input", update));
    }

    let u_mouse;
    let mouse = [0, 0];
    let leftDown = 0;
    let rightDown = 0;
    if (iMouse) {
      document.body.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
          leftDown = 1;
        } else if (e.button === 2) {
          rightDown = 1;
        }
        gl.uniform4f(u_mouse, ...mouse, leftDown, rightDown);
        render();
      });
      document.body.addEventListener("mouseup", (e) => {
        if (e.button === 0) {
          leftDown = 0;
        } else if (e.button === 2) {
          rightDown = 0;
        }
        gl.uniform4f(u_mouse, ...mouse, leftDown, rightDown);
        render();
      });
      canvas.addEventListener("mousemove", (e) => {
        mouse = [
          e.offsetX * devicePixelRatio,
          height * devicePixelRatio - e.offsetY * devicePixelRatio,
        ];
        gl.uniform4f(u_mouse, ...mouse, leftDown, rightDown);
        render();
      });

      u_mouse = gl.getUniformLocation(program, "iMouse");
      gl.uniform4f(u_mouse, ...mouse, leftDown, rightDown);
    }

    let frame;
    if (iTime) {
      frame = true; // always rendering
      const u_time = gl.getUniformLocation(program, "iTime");
      let timeframe;
      (async function tick() {
        if (visibility !== undefined) await visibility();
        gl.uniform1f(u_time, performance.now() / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return (timeframe = requestAnimationFrame(tick));
      })();
      ondispose.then(() => cancelAnimationFrame(timeframe));
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    return canvas;
  };
}
