// cart.js — Panier client géré en localStorage. Architecture prête pour plusieurs produits/variantes.
//
// Tarification par zone : Pure Ora vend le même produit à deux prix fixés manuellement
// (35 € France/Europe, 45 $ Kinshasa) — ce n'est jamais une conversion de devise automatique.
// La zone choisie (pureOraShippingZone) détermine à la fois le prix affiché et la livraison,
// et un panier ne peut jamais contenir des articles dans deux devises différentes.

const CART_STORAGE_KEY = "pureora_cart_v1";
const SHIPPING_ZONE_KEY = "pureOraShippingZone";

const ZONE_LABELS = {
  france: "France / Europe",
  kinshasa: "Kinshasa, RDC",
};

function formatPrice(amount, currency) {
  if (amount === null || amount === undefined) return "Prix à venir";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "EUR" }).format(amount);
}

// Format court recommandé pour les prix de zone : "35 €", "45 $" (pas de conversion, juste le montant fixé).
function formatZoneAmount(amount, symbol) {
  if (amount === null || amount === undefined) return "Prix à venir";
  return `${amount} ${symbol || ""}`.trim();
}

const Cart = {
  read() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  write(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("pureora:cart-updated", { detail: { items } }));
  },

  /**
   * Ajoute un article au panier pour une zone donnée.
   * Si le panier contient déjà des articles pour une AUTRE zone (donc une autre devise),
   * demande confirmation avant de vider le panier et de repartir sur la nouvelle zone.
   * Retourne false si l'ajout a été annulé par la cliente.
   */
  addItem({ id, name, price, currency, currencySymbol, image, variantLabel = "", zoneId, qty = 1 }) {
    const items = this.read();
    const existingZone = items[0]?.shippingZone;

    if (items.length > 0 && existingZone && zoneId && existingZone !== zoneId) {
      const message = `Votre panier est actuellement configuré pour la ${ZONE_LABELS[existingZone] || existingZone}. Souhaitez-vous le passer sur la zone ${ZONE_LABELS[zoneId] || zoneId} ?`;
      const confirmed = window.confirm(message);
      if (!confirmed) return false;
      items.length = 0;
    }

    const lineId = `${id}::${variantLabel}`;
    const existing = items.find((i) => i.lineId === lineId);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ lineId, id, name, price, currency, currencySymbol, image, variantLabel, qty, shippingZone: zoneId });
    }
    this.write(items);
    if (zoneId) this.setShippingZone(zoneId);
    return true;
  },

  updateQty(lineId, qty) {
    let items = this.read();
    if (qty <= 0) {
      items = items.filter((i) => i.lineId !== lineId);
    } else {
      items = items.map((i) => (i.lineId === lineId ? { ...i, qty } : i));
    }
    this.write(items);
  },
  removeItem(lineId) {
    const items = this.read().filter((i) => i.lineId !== lineId);
    this.write(items);
  },
  clear() {
    this.write([]);
  },
  count() {
    return this.read().reduce((sum, i) => sum + i.qty, 0);
  },
  subtotal() {
    return this.read().reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
  },
  hasUnpricedItems() {
    return this.read().some((i) => i.price === null || i.price === undefined);
  },
  /** Devise actuellement utilisée par le panier (déterminée par ses articles, pas par la zone seule). */
  currentCurrency() {
    return this.read()[0]?.currency || null;
  },
  getShippingZone() {
    return localStorage.getItem(SHIPPING_ZONE_KEY) || "";
  },
  setShippingZone(zoneId) {
    localStorage.setItem(SHIPPING_ZONE_KEY, zoneId);
    document.dispatchEvent(new CustomEvent("pureora:shipping-zone-changed", { detail: { zoneId } }));
  },

  /**
   * Change la zone active depuis la page panier. Si le panier contient déjà des articles
   * dans une autre devise, demande confirmation puis met à jour tous les articles avec
   * le tarif de la nouvelle zone (à partir des prix du produit fourni).
   */
  changeZone(newZoneId, product) {
    const items = this.read();
    const existingZone = items[0]?.shippingZone;

    if (items.length === 0 || !existingZone || existingZone === newZoneId) {
      this.setShippingZone(newZoneId);
      return true;
    }

    const message = `Votre panier est actuellement configuré pour la ${ZONE_LABELS[existingZone] || existingZone}. Souhaitez-vous le passer sur la zone ${ZONE_LABELS[newZoneId] || newZoneId} ?`;
    const confirmed = window.confirm(message);
    if (!confirmed) return false;

    const zonePrice = product?.prices?.[newZoneId];
    const remapped = items.map((item) => ({
      ...item,
      shippingZone: newZoneId,
      price: zonePrice ? zonePrice.amount : item.price,
      currency: zonePrice ? zonePrice.currency : item.currency,
      currencySymbol: zonePrice ? zonePrice.symbol : item.currencySymbol,
    }));
    this.write(remapped);
    this.setShippingZone(newZoneId);
    return true;
  },
};

window.PureOraCart = Cart;
window.PureOra = window.PureOra || {};
window.PureOra.formatPrice = formatPrice;
window.PureOra.formatZoneAmount = formatZoneAmount;
window.PureOra.zoneLabels = ZONE_LABELS;

/* ---------- Rendu du panier (drawer + header + page panier) ---------- */

function renderCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const count = Cart.count();
  el.textContent = String(count);
  el.hidden = count === 0;
}

function cartLineTemplate(item) {
  const currency = item.currency || "EUR";
  const zoneLabel = ZONE_LABELS[item.shippingZone] || "";
  return `
    <div class="cart-line" data-line-id="${item.lineId}">
      <div class="cart-line__thumb ratio-1x1">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" width="76" height="76" loading="lazy">` : `<div class="media-placeholder ratio-1x1"></div>`}
      </div>
      <div class="cart-line__body">
        <span class="cart-line__title">${item.name}</span>
        ${item.variantLabel ? `<span class="form-hint">${item.variantLabel}</span>` : ""}
        ${zoneLabel ? `<span class="form-hint">Livraison : ${zoneLabel}</span>` : ""}
        <span>${formatPrice(item.price, currency)}</span>
        <div class="cart-line__qty">
          <button type="button" data-qty-decrease aria-label="Réduire la quantité">−</button>
          <span>${item.qty}</span>
          <button type="button" data-qty-increase aria-label="Augmenter la quantité">+</button>
        </div>
        <button type="button" class="cart-line__remove" data-remove-line>Supprimer</button>
      </div>
    </div>`;
}

function attachLineEvents(container) {
  container.querySelectorAll("[data-line-id]").forEach((lineEl) => {
    const lineId = lineEl.getAttribute("data-line-id");
    const items = Cart.read();
    const item = items.find((i) => i.lineId === lineId);
    if (!item) return;
    lineEl.querySelector("[data-qty-decrease]")?.addEventListener("click", () => Cart.updateQty(lineId, item.qty - 1));
    lineEl.querySelector("[data-qty-increase]")?.addEventListener("click", () => Cart.updateQty(lineId, item.qty + 1));
    lineEl.querySelector("[data-remove-line]")?.addEventListener("click", () => Cart.removeItem(lineId));
  });
}

function renderCartDrawer() {
  const itemsContainer = document.getElementById("cart-drawer-items");
  const foot = document.getElementById("cart-drawer-foot");
  if (!itemsContainer) return;
  const items = Cart.read();

  if (items.length === 0) {
    itemsContainer.innerHTML = `<p class="cart-empty">Votre panier est vide pour le moment.</p>`;
    if (foot) foot.hidden = true;
    return;
  }

  itemsContainer.innerHTML = items.map(cartLineTemplate).join("");
  attachLineEvents(itemsContainer);

  if (foot) {
    foot.hidden = false;
    const subtotalEl = document.getElementById("cart-drawer-subtotal");
    if (subtotalEl) subtotalEl.textContent = Cart.hasUnpricedItems() ? "Prix à venir" : formatPrice(Cart.subtotal(), Cart.currentCurrency());
  }
}

function renderCartPage() {
  const container = document.getElementById("cart-page-items");
  if (!container) return;
  const items = Cart.read();

  if (items.length === 0) {
    container.innerHTML = `<div class="cart-empty">
      <p style="margin-bottom:1rem;">Votre panier est vide pour le moment.</p>
      <a href="boutique.html" class="btn btn-primary">Découvrir la boutique</a>
    </div>`;
  } else {
    container.innerHTML = items.map(cartLineTemplate).join("");
    attachLineEvents(container);
  }

  updateCartPageSummary();
}

function updateCartPageSummary() {
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");
  const shippingEl = document.getElementById("cart-shipping-line");
  if (!subtotalEl) return;

  const currency = Cart.currentCurrency();
  const subtotal = Cart.subtotal();
  const hasUnpriced = Cart.hasUnpricedItems();
  subtotalEl.textContent = hasUnpriced ? "Prix à venir" : formatPrice(subtotal, currency);

  const zones = window.PureOra?.shipping?.zones || [];
  const zoneId = Cart.getShippingZone();
  const zone = zones.find((z) => z.id === zoneId);

  if (shippingEl) {
    if (!zone) {
      shippingEl.textContent = "Sélectionnez votre zone de livraison";
    } else if (zone.price === null || zone.price === undefined) {
      shippingEl.textContent = zone.note || "Tarif de livraison communiqué lors de la commande";
    } else {
      shippingEl.textContent = formatPrice(zone.price, zone.currency || currency);
    }
  }

  if (totalEl) {
    if (hasUnpriced || !zone || zone.price === null || zone.price === undefined) {
      totalEl.textContent = "Communiqué lors de la commande";
    } else {
      totalEl.textContent = formatPrice(subtotal + zone.price, currency);
    }
  }

  const checkoutBtn = document.getElementById("go-to-checkout");
  if (checkoutBtn) checkoutBtn.classList.toggle("is-disabled", Cart.read().length === 0);
}

function populateShippingZoneSelect() {
  const select = document.getElementById("shipping-zone-select");
  if (!select) return;
  const zones = window.PureOra?.shipping?.zones || [];
  select.innerHTML = `<option value="">Choisir une zone de livraison</option>` +
    zones.map((z) => `<option value="${z.id}">${z.name} — ${z.estimatedTime}</option>`).join("");
  const saved = Cart.getShippingZone();
  if (saved) select.value = saved;
  select.addEventListener("change", () => {
    const product = window.PureOra?.featuredProduct;
    const applied = Cart.changeZone(select.value, product);
    if (!applied) {
      // La cliente a refusé le changement : on revient à la zone précédente dans le sélecteur.
      select.value = Cart.getShippingZone();
      return;
    }
    updateCartPageSummary();
    renderCartPage();
  });
}

function initPromoForm() {
  const form = document.getElementById("promo-form");
  if (!form) return;
  const status = document.getElementById("promo-status");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = new FormData(form).get("promoCode")?.toString().trim().toUpperCase();
    const promo = window.PureOra?.settings?.promoCode;
    if (!promo || !promo.active || !promo.code) {
      status.textContent = "Aucun code promotionnel actif pour le moment.";
      status.hidden = false;
      return;
    }
    if (code === promo.code.toUpperCase()) {
      status.textContent = "Code promotionnel appliqué.";
    } else {
      status.textContent = "Ce code promotionnel n'est pas valide.";
    }
    status.hidden = false;
  });
}

/* ---------- Ouverture / fermeture du panier latéral ---------- */
function initCartDrawerToggle() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  const openBtn = document.getElementById("cart-toggle");
  const closeBtn = document.getElementById("cart-close");
  if (!drawer || !openBtn) return;

  const open = () => { drawer.classList.add("is-open"); overlay.classList.add("is-open"); document.body.classList.add("menu-open"); };
  const close = () => { drawer.classList.remove("is-open"); overlay.classList.remove("is-open"); document.body.classList.remove("menu-open"); };

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  window.PureOraCartDrawer = { open, close };
}

document.addEventListener("pureora:components-ready", () => {
  renderCartCount();
  renderCartDrawer();
  initCartDrawerToggle();
});
document.addEventListener("pureora:data-ready", () => {
  populateShippingZoneSelect();
  updateCartPageSummary();
});
document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
  initPromoForm();
});
document.addEventListener("pureora:cart-updated", () => {
  renderCartCount();
  renderCartDrawer();
  renderCartPage();
});
