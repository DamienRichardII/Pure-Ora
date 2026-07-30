// products.js — Rendu des produits sur l'accueil (signature) et la boutique (grille).

function productCardTemplate(product) {
  const img = product.images?.[0];
  const price = window.PureOra.formatPrice(product.price, product.currency);
  return `
    <a class="product-card" href="produit.html?slug=${encodeURIComponent(product.slug)}" data-reveal>
      <div class="product-card__media hover-zoom ratio-4x5">
        ${img
          ? `<img src="${img.src}" alt="${img.alt}" width="480" height="600" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'media-placeholder ratio-4x5', innerHTML:'<span class=\\'media-placeholder__label\\'>Photo produit<span>à intégrer</span></span>'}))">`
          : `<div class="media-placeholder ratio-4x5"><span class="media-placeholder__label">Photo produit<span>à intégrer</span></span></div>`}
      </div>
      <h3 class="product-card__title">${product.name}</h3>
      <p class="form-hint" style="margin-bottom:.4rem;">${product.subtitle || ""}</p>
      <p class="product-card__price">
        ${product.compareAtPrice ? `<span class="product-card__old-price">${window.PureOra.formatPrice(product.compareAtPrice, product.currency)}</span>` : ""}
        ${price}
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

document.addEventListener("pureora:data-ready", () => {
  renderShopGrid();
  renderFeaturedProductBits();
});
