export function styleCredits() {
  const credits = document.getElementById("credits");
  if (!credits) return;

  credits.style.position = "fixed";
  credits.style.left = "50%";
  credits.style.bottom = "12px";
  credits.style.transform = "translateX(-50%)";
  credits.style.padding = "8px 12px";
  credits.style.background = "rgba(0, 0, 0, 0.35)";
  credits.style.backdropFilter = "blur(8px)";
  credits.style.borderRadius = "10px";
  credits.style.color = "#e9f4ff";
  credits.style.fontFamily = "Inter, system-ui, -apple-system, sans-serif";
  credits.style.fontSize = "12px";
  credits.style.lineHeight = "1.5";
  credits.style.whiteSpace = "nowrap";
  credits.style.zIndex = "20";
  credits.style.boxShadow = "0 10px 28px rgba(0, 0, 0, 0.25)";

  credits.querySelectorAll("a").forEach((a) => {
    a.style.color = "#b9e0ff";
    a.style.textDecoration = "none";
    a.style.padding = "0 2px";
    a.onmouseenter = () => (a.style.textDecoration = "underline");
    a.onmouseleave = () => (a.style.textDecoration = "none");
  });

  const details = credits.querySelector(".credits-details");
  if (details) {
    details.style.display = "none";
    credits.onmouseenter = () => (details.style.display = "inline");
    credits.onmouseleave = () => (details.style.display = "none");
  }
}
