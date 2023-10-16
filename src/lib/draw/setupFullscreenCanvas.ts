export const setupFullscreenCanvas = (elementId: string) => {
  const c = document.getElementById("c") as HTMLCanvasElement;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;

  //https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
  const makeCanvasFullscreen = () => {
    const dpr = window.devicePixelRatio;
    // Set the "actual" size of the canvas
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;

    // Set the "drawn" size of the canvas
    c.style.width = `${window.innerWidth}px`;
    c.style.height = `${window.innerHeight}px`;
  };
  makeCanvasFullscreen();
  window.addEventListener("resize", makeCanvasFullscreen);
  return ctx;
};
