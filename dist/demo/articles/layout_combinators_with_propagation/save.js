function save(content, name = "index.html") {
  const bl = new Blob([content], { type: "text/html" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(bl);
  a.href = url;
  a.download = name;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
}

document.body.addEventListener("keydown", (e) => {
  if (e.key === "s" && e.metaKey) {
    e.preventDefault();
    const doc = document.getElementsByTagName("html")[0].getHTML();
    save(doc, "editor.html");
  }
});
