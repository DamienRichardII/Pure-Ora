// products.js — Rendu des produits sur l'accueil (signature) et la boutique (grille).

// Tarifs par zone (aucune conversion automatique) : on affiche toujours les
// deux prix fixés manuellement, chacun accompagné de sa zone, pour éviter
// qu'une cliente pense pouvoir choisir librement la devise.
function productZonePriceLine(product) {
  if (!product.prices) return "";
  return Object.values(product.prices)
    .filter((p) => p && p.amount !== null && p.amount !== undefined)
    .map((p) => `<span class="product-card__zone-price">${window.PureOra.formatZoneAmount(p.amount, p.symbol)} <span class="product-card__zone-label">— ${p.label}</span></span>`)
    .join("");
}

function productCardTemplate(product) {
  const img = product.images?.[0];
  return `
    <a class="product-card" href="produit.html?slug=${encodeURIComponent(product.slug)}" data-reveal data-category="${product.categoryId || ""}">
      <div class="product-card__media hover-zoom ratio-4x5">
        ${img
          ? `<img src="${img.src}" alt="${img.alt}" width="480" height="600" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'media-placeholder ratio-4x5', innerHTML:'<span class=\\'media-placeholder__label\\'>Photo produit<span>à intégrer</span></span>'}))">`
          : `<div class="media-placeholder ratio-4x5"><span class="media-placeholder__label">Photo produit<span>à intégrer</span></span></div>`}
      </div>
      <h3 class="product-card__title">${product.name}</h3>
      <p class="form-hint" style="margin-bottom:.4rem;">${product.subtitle || ""}</p>
      <p class="product-card__price product-card__price--zones">
        ${productZonePriceLine(product)}
      </p>
    </a>`;
}

function renderShopGrid() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;
  const products = window.PureOra.products || [];
  if (products.length === 0) {
    grid.innerHTML = `<p class="shop-empty">Aucun produit disponible pour le moment.</p>`;
    return;
  }
  grid.innerHTML = products.map(productCardTemplate).join("");
  document.dispatchEvent(new CustomEvent("pureora:grid-rendered"));
}

function renderFeaturedProductBits() {
  const products = window.PureOra.products || [];
  const featured = products.find((p) => p.featured) || products[0];
  if (!featured) return;
  window.PureOra.featuredProduct = featured;
  document.dispatchEvent(new CustomEvent("pureora:featured-ready", { detail: featured }));
}

/* ---------- Cartes éditoriales "univers / catégories" (accueil + boutique) ---------- */

function categoryCardTemplate(cat, index) {
  const num = String(index + 1).padStart(2, "0");
  const isAvailable = cat.status === "available";
  return `
    <article class="universe-card ${isAvailable ? "is-available" : "is-coming-soon"}" data-reveal>
      <span class="universe-card__num">${num}</span>
      <div class="media-placeholder ratio-4x5 universe-card__media"><span class="media-placeholder__label">${cat.name}<span>Photo à intégrer</span></span></div>
      <div class="universe-card__body">
        <span class="badge universe-card__status">${cat.statusLabel}</span>
        <h3 class="universe-card__title">${cat.name}</h3>
        <p class="universe-card__text">${cat.description}</p>
        <a href="${cat.page}" class="btn-ghost">${cat.cta}</a>
      </div>
    </article>`;
}

function renderCategoryCards(mountId, filterFn) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const categories = window.PureOra.categories || [];
  const list = filterFn ? categories.filter(filterFn) : categories;
  mount.innerHTML = list.map((cat) => categoryCardTemplate(cat, categories.indexOf(cat))).join("");
}

document.addEventListener("pureora:data-ready", () => {
  renderShopGrid();
  renderFeaturedProductBits();
  renderCategoryCards("universe-cards");
  renderCategoryCards("coming-soon-cards", (c) => c.status !== "available");
  renderCategoryCards("boutique-coming-soon", (c) => c.status !== "available");
});
