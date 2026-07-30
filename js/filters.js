// filters.js — Filtres et recherche de la boutique. Prêt pour plusieurs produits.

function initShopFilters() {
  const search = document.getElementById("shop-search-input");
  const chips = document.querySelectorAll(".filter-chip");
  if (!search && chips.length === 0) return;

  function applyFilters() {
    const query = (search?.value || "").toLowerCase().trim();
    const activeChip = document.querySelector(".filter-chip[aria-pressed='true']");
    const category = activeChip ? activeChip.dataset.category : "all";

    document.querySelectorAll("#shop-grid .product-card").forEach((card) => {
      const name = card.querySelector(".product-card__title")?.textContent.toLowerCase() || "";
      const matchesQuery = !query || name.includes(query);
      const matchesCategory = !category || category === "all" || card.dataset.category === category;
      card.style.display = matchesQuery && matchesCategory ? "" : "none";
    });
  }

  search?.addEventListener("input", applyFilters);
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      applyFilters();
    });
  });

  document.addEventListener("pureora:grid-rendered", applyFilters);
}

document.addEventListener("pureora:components-ready", initShopFilters);
