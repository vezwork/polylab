export const onKeyDown =
  <K extends string>(key: K | ((key: string) => key is K)) =>
  (f: (key: K) => void) =>
    document.body.addEventListener("keydown", (e) =>
      (typeof key === "function" && key(e.key)) || e.key === key
        ? f(e.key as K)
        : null
    );

export type ArrowKey = "ArrowUp" | "ArrowLeft" | "ArrowRight" | "ArrowDown";
export const onArrowKeyDown = (f: (key: ArrowKey) => void) =>
  onKeyDown((key): key is ArrowKey => key.startsWith("Arrow"))(f);
