const windows = document.querySelectorAll("[data-window]");
let topZ = 10;
let activeDrag = null;

function bringToFront(panel) {
  topZ += 1;
  panel.style.setProperty("--z", topZ);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function viewportLimitedPosition(panel, left, top) {
  const maxLeft = window.innerWidth - panel.offsetWidth - 8;
  const maxTop = window.innerHeight - panel.offsetHeight - 8;

  return {
    left: clamp(left, 8, Math.max(8, maxLeft)),
    top: clamp(top, 8, Math.max(8, maxTop)),
  };
}

function beginDrag(panel, event) {
  if (window.matchMedia("(max-width: 760px)").matches) {
    return;
  }

  const closeButton = event.target.closest(".box-button");
  const handle = event.target.closest("[data-handle]");

  if (!handle || closeButton) {
    return;
  }

  event.preventDefault();
  bringToFront(panel);
  panel.classList.add("is-dragging");

  const rect = panel.getBoundingClientRect();
  activeDrag = {
    panel,
    startX: event.clientX,
    startY: event.clientY,
    startLeft: rect.left,
    startTop: rect.top,
  };
}

function moveDrag(event) {
  if (!activeDrag) {
    return;
  }

  const next = viewportLimitedPosition(
    activeDrag.panel,
    activeDrag.startLeft + event.clientX - activeDrag.startX,
    activeDrag.startTop + event.clientY - activeDrag.startY
  );

  activeDrag.panel.style.left = `${next.left}px`;
  activeDrag.panel.style.top = `${next.top}px`;
}

function endDrag() {
  if (!activeDrag) {
    return;
  }

  activeDrag.panel.classList.remove("is-dragging");
  activeDrag = null;
}

windows.forEach((panel) => {
  const closeButton = panel.querySelector(".box-button");

  panel.addEventListener("pointerdown", (event) => beginDrag(panel, event));
  panel.addEventListener("mousedown", (event) => beginDrag(panel, event));
  panel.addEventListener("click", () => bringToFront(panel));

  closeButton.addEventListener("click", () => {
    panel.hidden = true;
  });
});

document.addEventListener("pointermove", moveDrag);
document.addEventListener("mousemove", moveDrag);
document.addEventListener("pointerup", endDrag);
document.addEventListener("mouseup", endDrag);
document.addEventListener("pointercancel", endDrag);
