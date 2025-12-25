
// Assigns Left/Right to the Timeline Items
function updateTimelineLayout() {
    const items = Array.from(document.querySelectorAll(".timeline-item"))
        .filter(item => item.style.display !== "none"); // visible ones only
    items.forEach((item, index) => {
        item.classList.remove("left", "right");
        if (index % 2 === 0) {
            item.classList.add("left");
        } else {
            item.classList.add("right");
        }
    });
}
document.addEventListener("DOMContentLoaded", updateTimelineLayout);

// Filter
const buttons = document.querySelectorAll('.timeline-filters button');
const items = document.querySelectorAll('.timeline-item');

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        items.forEach(item => {
            item.style.display =
                filter === 'all' || item.dataset.category === filter
                ? 'block'
                : 'none';
        });

        updateTimelineLayout();
    });
});

// Popup
const backdrop = document.getElementById("timeline-popup-backdrop");
const titleEl = document.getElementById("popup-title");
const contentEl = document.getElementById("popup-content");

document.querySelectorAll(".timeline-item").forEach(item => {
  item.addEventListener("click", () => {
    titleEl.textContent = item.dataset.title;
    contentEl.innerHTML = item.dataset.descriptionHtml || "";

    backdrop.hidden = false;
  });
});

backdrop.addEventListener("click", e => {
  if (e.target === backdrop) {
    backdrop.hidden = true;
  }
});

document.querySelector(".close-btn").addEventListener("click", () => {
  backdrop.hidden = true;
});
