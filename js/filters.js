// filters.js — Filtres catégorie + recherche de la boutique, pilotés par data/categories.json.

function renderShopFilterChips() {
  const mount = document.getElementById("shop-filters");
  if (!mount) return;

  const categories = window.PureOra.categories || [];
  const params = new URLSearchParams(location.search);
  const requested = params.get("categorie") || "all";

  const chips = [{ slug: "all", name: "Tous les produits" }, ...categories.map((c) => ({ slug: c.slug, name: c.name, categoryId: c.id }))];

  mount.innerHTML = chips.map((c) => `
    <button type="button" class="filter-chip" data-category-id="${c.categoryId || "all"}" data-slug="${c.slug}" aria-pressed="${c.slug === requested ? "true" : "false"}">${c.name}</button>`).join("");
}

function initShopFilters() {
  const search = document.getElementById("shop-search-input");
  const mount = document.getElementById("shop-filters");

  function applyFilters() {
    const query = (search?.value || "").toLowerCase().trim();
    const activeChip = mount?.querySelector(".filter-chip[aria-pressed='true']");
    const categoryId = activeChip ? activeChip.dataset.categoryId : "all";

    let visibleCount = 0;
    document.querySelectorAll("#shop-grid .product-card").forEach((card) => {
      const name = card.querySelector(".product-card__title")?.textContent.toLowerCase() || "";
      const matchesQuery = !query || name.includes(query);
      const matchesCategory = !categoryId || categoryId === "all" || card.dataset.category === categoryId;
      const visible = matchesQuery && matchesCategory;
      card.style.display = visible ? "" : "none";
      if (visible) visibleCount += 1;
    });

    const emptyMsg = document.getElementById("shop-empty-message");
    if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
  }

  search?.addEventListener("input", applyFilters);

  mount?.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    mount.querySelectorAll(".filter-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
    chip.setAttribute("aria-pressed", "true");
    applyFilters();
  });

  document.addEventListener("pureora:grid-rendered", applyFilters);
}

document.addEventListener("pureora:data-ready", renderShopFilterChips);
document.addEventListener("pureora:components-ready", initShopFilters);
