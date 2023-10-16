export const onKeyDown = (key) => (f) => document.body.addEventListener("keydown", (e) => (typeof key === "function" && key(e.key)) || e.key === key
    ? f(e.key)
    : null);
export const onArrowKeyDown = (f) => onKeyDown((key) => key.startsWith("Arrow"))(f);
