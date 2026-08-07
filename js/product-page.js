// product-page.js — Logique de la fiche produit et du bloc "produit signature" de l'accueil.
//
// Tarification par zone : chaque produit expose product.prices.{france,kinshasa}
// (deux prix fixés manuellement, jamais convertis l'un depuis l'autre) et
// product.paymentLinks.{france,kinshasa}. Le sélecteur de zone (fieldset de
// radios accessibles) affiche toujours les deux tarifs sans en privilégier un,
// et c'est la zone choisie qui détermine le prix affiché, le lien de paiement
// utilisé et les données envoyées au panier.

function getRequestedProduct() {
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const products = window.PureOra.products || [];
  return products.find((p) => p.slug === slug) || products.find((p) => p.featured) || products[0] || null;
}

function buildGallery(product, mount) {
  if (!mount) return;
  const images = product.images || [];
  if (images.length === 0) {
    mount.innerHTML = `<div class="media-placeholder ratio-4x5"><span class="media-placeholder__label">Galerie produit<span>Photos à intégrer</span></span></div>`;
    return;
  }
  mount.innerHTML = `
    <div class="gallery-main ratio-4x5 hover-zoom" id="gallery-main" style="border-radius:var(--radius-md);overflow:hidden;cursor:zoom-in;">
      <img src="${images[0].src}" alt="${images[0].alt}" id="gallery-main-img" width="600" height="750" onerror="this.parentElement.innerHTML='<div class=\\'media-placeholder ratio-4x5\\'><span class=\\'media-placeholder__label\\'>Photo produit<span>à intégrer</span></span></div>'">
    </div>
    <div class="gallery-thumbs" id="gallery-thumbs">
      ${images.map((img, i) => `<img src="${img.src}" alt="${img.alt}" data-index="${i}" class="${i === 0 ? "is-active" : ""}" onerror="this.style.opacity=0.15">`).join("")}
    </div>`;

  const mainImg = mount.querySelector("#gallery-main-img");
  const mainWrap = mount.querySelector("#gallery-main");
  mount.querySelectorAll("[data-index]").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const idx = Number(thumb.getAttribute("data-index"));
      mainImg.src = images[idx].src;
      mainImg.alt = images[idx].alt;
      mount.querySelectorAll("[data-index]").forEach((t) => t.classList.remove("is-active"));
      thumb.classList.add("is-active");
    });
  });
  mainWrap?.addEventListener("click", () => window.PureOraLightbox?.open(images, 0));
}

function renderVariantGroup(mountId, values, label) {
  const group = document.getElementById(mountId);
  if (!group) return null;
  if (!values || values.length === 0) {
    group.hidden = true;
    return null;
  }
  group.hidden = false;
  group.innerHTML = `<p class="form-field label" style="font-weight:700;margin-bottom:.5rem;">${label}</p>
    <div class="variant-options">
      ${values.map((v, i) => `<button type="button" class="variant-swatch" data-value="${v}" aria-pressed="${i === 0}">${v}</button>`).join("")}
    </div>`;
  let selected = values[0];
  group.querySelectorAll(".variant-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      group.querySelectorAll(".variant-swatch").forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      selected = btn.getAttribute("data-value");
    });
  });
  return () => selected;
}

function initQuantitySelector(root, onChange) {
  const el = root.querySelector("[data-qty-selector]");
  if (!el) return () => 1;
  let qty = 1;
  const display = el.querySelector("[data-qty-display]");
  el.querySelector("[data-qty-minus]").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    display.textContent = qty;
    onChange?.(qty);
  });
  el.querySelector("[data-qty-plus]").addEventListener("click", () => {
    qty += 1;
    display.textContent = qty;
    onChange?.(qty);
  });
  return () => qty;
}

// ---------------------------------------------------------------------------
// Sélecteur "Où souhaitez-vous être livrée ?" — le composant lui-même (gros
// boutons tactiles, toutes les zones actives de data/shipping.json, aucune
// présélection sauf choix déjà enregistré) vit dans cart.js et est partagé
// avec la page panier. Ici on se contente de l'instancier pour la fiche produit.
// ---------------------------------------------------------------------------

function promptForZone(zoneSelector) {
  if (!zoneSelector) return;
  zoneSelector.scrollIntoView();
  zoneSelector.focus();
  window.alert("Où souhaitez-vous être livrée ? Merci de choisir votre zone de livraison avant de continuer.");
}

function initProductSignature(product) {
  const root = document.getElementById("product-signature");
  if (!root || !product) return;

  root.querySelector("[data-product-name]") && (root.querySelector("[data-product-name]").textContent = product.name);
  const stockEl = root.querySelector("[data-product-stock]");
  if (stockEl) stockEl.textContent = product.stockDisplay || "";

  const galleryMount = root.querySelector("[data-product-gallery]");
  buildGallery(product, galleryMount);

  const zoneSelector = window.PureOra.renderShippingSelector("zone-selector-home", { product });

  const getColor = renderVariantGroup("variant-color-home", product.variants?.colors, "Couleur");
  const getLength = renderVariantGroup("variant-length-home", product.variants?.lengths, "Longueur");
  const getTexture = renderVariantGroup("variant-texture-home", product.variants?.textures, "Texture");

  const getQty = initQuantitySelector(root);
  wireActions(root, product, { getColor, getLength, getTexture, getQty, zoneSelector });
}

function initProductPage(product) {
  const root = document.getElementById("product-page-root");
  if (!root || !product) return;

  document.title = `${product.name} — Pure Ora`;
  root.querySelector("[data-product-name]") && (root.querySelector("[data-product-name]").textContent = product.name);
  root.querySelector("[data-product-subtitle]") && (root.querySelector("[data-product-subtitle]").textContent = product.subtitle || "");
  root.querySelector("[data-product-description]") && (root.querySelector("[data-product-description]").textContent = product.longDescription || "");
  const priceNote = root.querySelector("[data-product-price-note]");
  if (priceNote) priceNote.textContent = product.priceNote || "";
  const stockEl = root.querySelector("[data-product-stock]");
  if (stockEl) stockEl.textContent = product.stockDisplay || "";

  const benefitsEl = root.querySelector("[data-product-benefits]");
  if (benefitsEl) benefitsEl.innerHTML = (product.benefits || []).map((b) => `<li>${b}</li>`).join("");

  const galleryMount = root.querySelector("[data-product-gallery]");
  buildGallery(product, galleryMount);

  const zoneSelector = window.PureOra.renderShippingSelector("zone-selector", { product });

  const getColor = renderVariantGroup("variant-color", product.variants?.colors, "Couleur");
  const getLength = renderVariantGroup("variant-length", product.variants?.lengths, "Longueur");
  const getTexture = renderVariantGroup("variant-texture", product.variants?.textures, "Texture");

  const getQty = initQuantitySelector(root);
  wireActions(root, product, { getColor, getLength, getTexture, getQty, zoneSelector });

  // CTA mobile fixe — reflète la zone sélectionnée, sans en imposer une par défaut.
  const mobileBar = document.getElementById("mobile-buybar");
  if (mobileBar) {
    const mobilePriceEl = mobileBar.querySelector("[data-mobile-price]");
    const updateMobilePrice = () => {
      const zoneId = zoneSelector?.getZone();
      const zonePrice = zoneId ? product.prices?.[zoneId] : null;
      mobilePriceEl.textContent = zonePrice ? window.PureOra.formatZoneAmount(zonePrice.amount, zonePrice.symbol) : "Choisissez votre zone";
    };
    updateMobilePrice();
    zoneSelector?.onChange(updateMobilePrice);
    mobileBar.querySelector("[data-mobile-add]")?.addEventListener("click", () => addProductToCart(product, { getColor, getLength, getTexture, getQty: () => 1, zoneSelector }));
  }
}

function variantLabel({ getColor, getLength, getTexture }) {
  return [getColor?.(), getLength?.(), getTexture?.()].filter(Boolean).join(" / ");
}

function addProductToCart(product, opts) {
  const zoneId = opts.zoneSelector?.getZone();
  if (!zoneId) {
    promptForZone(opts.zoneSelector);
    return false;
  }
  const zonePrice = product.prices?.[zoneId];
  if (!zonePrice) return false;

  const added = window.PureOraCart.addItem({
    id: product.id,
    name: product.name,
    price: zonePrice.amount,
    currency: zonePrice.currency,
    currencySymbol: zonePrice.symbol,
    image: product.images?.[0]?.src,
    variantLabel: variantLabel(opts),
    qty: opts.getQty ? opts.getQty() : 1,
    zoneId,
  });
  if (!added) return false; // l'utilisateur a refusé de basculer le panier vers cette zone

  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  drawer?.classList.add("is-open");
  overlay?.classList.add("is-open");
  return true;
}

function wireActions(root, product, opts) {
  root.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    btn.addEventListener("click", () => addProductToCart(product, opts));
  });
  root.querySelectorAll("[data-buy-now]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const zoneId = opts.zoneSelector?.getZone();
      if (!zoneId) {
        promptForZone(opts.zoneSelector);
        return;
      }
      const link = product.paymentLinks?.[zoneId];
      if (!link || link.trim() === "") {
        const zoneLabel = product.prices?.[zoneId]?.label || zoneId;
        window.alert(`Le paiement n'est pas encore configuré pour la zone ${zoneLabel} (environnement de développement). Ajoutez le lien dans data/products.json ("paymentLinks.${zoneId}").`);
        return;
      }
      const added = addProductToCart(product, opts);
      if (added) window.location.href = link;
    });
  });
}

function initProductTabs() {
  const nav = document.querySelector(".product-tabs__nav");
  if (!nav) return;
  const buttons = [...nav.querySelectorAll("button")];
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-selected", "false"));
      btn.setAttribute("aria-selected", "true");
      document.querySelectorAll(".product-tabs__panel").forEach((p) => p.classList.remove("is-active"));
      document.getElementById(btn.getAttribute("aria-controls"))?.classList.add("is-active");
    });
  });
}

document.addEventListener("pureora:featured-ready", (e) => initProductSignature(e.detail));
document.addEventListener("pureora:data-ready", () => {
  const product = getRequestedProduct();
  initProductPage(product);
  initProductTabs();
});
