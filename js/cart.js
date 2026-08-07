// cart.js — Panier client géré en localStorage + logique de livraison par zone.
// Architecture prête pour plusieurs produits/variantes et pour de nouvelles zones.
//
// Tarification par zone : Pure Ora vend le même produit à deux prix fixés manuellement
// (35 € France/Belgique, 45 $ Kinshasa) — ce n'est jamais une conversion de devise automatique.
// La zone choisie (pureOraShippingZone) détermine à la fois le prix affiché et les frais de
// livraison, et un panier ne peut jamais contenir des articles dans deux devises différentes.
//
// Toutes les zones (France, Kinshasa, et celles ajoutées plus tard) sont décrites dans
// data/shipping.json. Aucune zone n'est codée en dur ici : la liste des destinations, leurs
// libellés, devises et frais sont entièrement pilotés par ce fichier de données.

const CART_STORAGE_KEY = "pureora_cart_v1";
const SHIPPING_ZONE_KEY = "pureOraShippingZone";

function getShippingZones() {
  return (window.PureOra?.shipping?.zones || []).filter((z) => z.enabled);
}

function getZoneMeta(zoneId) {
  const zones = window.PureOra?.shipping?.zones || [];
  return zones.find((z) => z.id === zoneId) || null;
}

function zoneLabel(zoneId) {
  return getZoneMeta(zoneId)?.label || zoneId;
}

function formatCurrency(amount, currency) {
  if (amount === null || amount === undefined) return "Prix à venir";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "EUR" }).format(amount);
}
// Alias conservé pour compatibilité avec le reste du site.
const formatPrice = formatCurrency;

// Format court recommandé pour les prix de zone : "35 €", "45 $" (pas de conversion, juste le montant fixé).
function formatZoneAmount(amount, symbol) {
  if (amount === null || amount === undefined) return "Prix à venir";
  return `${amount} ${symbol || ""}`.trim();
}

// Texte générique pour des frais non encore configurés — jamais "0 €" / "Gratuit".
function shippingFeeText(zone) {
  if (!zone) return "Sélectionnez votre zone de livraison";
  if (zone.shippingPrice === null || zone.shippingPrice === undefined) {
    return "Les frais de livraison seront précisés avant le paiement.";
  }
  return formatCurrency(zone.shippingPrice, zone.currency);
}

/**
 * Calcule les frais de livraison pour une zone donnée. Fonction unique et générique :
 * ne contient aucune branche par zone ("if france" / "if kinshasa").
 */
function calculateShipping(zoneId) {
  const zone = getZoneMeta(zoneId);
  if (!zone) return { zone: null, shippingPrice: null, currency: null, known: false, text: shippingFeeText(null) };
  return {
    zone,
    shippingPrice: zone.shippingPrice,
    currency: zone.currency,
    known: zone.shippingPrice !== null && zone.shippingPrice !== undefined,
    text: shippingFeeText(zone),
  };
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
      const message = `Votre panier est actuellement configuré pour la zone ${zoneLabel(existingZone)}. Souhaitez-vous le passer sur la zone ${zoneLabel(zoneId)} ?`;
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
   * Change la zone active (depuis la fiche produit ou la page panier). Si le panier contient
   * déjà des articles dans une autre devise, demande confirmation puis met à jour tous les
   * articles avec le tarif de la nouvelle zone (à partir des prix du produit fourni).
   */
  changeZone(newZoneId, product) {
    const items = this.read();
    const existingZone = items[0]?.shippingZone;

    if (items.length === 0 || !existingZone || existingZone === newZoneId) {
      this.setShippingZone(newZoneId);
      return true;
    }

    const message = `Votre panier est actuellement configuré pour la zone ${zoneLabel(existingZone)}. Souhaitez-vous le passer sur la zone ${zoneLabel(newZoneId)} ?`;
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

  /**
   * Calcul générique et unique du total panier : sous-total produits + frais de livraison
   * de la zone active. Aucune branche par zone — tout vient de calculateShipping().
   */
  calculateCartTotal() {
    const items = this.read();
    const currency = this.currentCurrency();
    const subtotal = this.subtotal();
    const hasUnpriced = this.hasUnpricedItems();
    const zoneId = this.getShippingZone();
    const shipping = calculateShipping(zoneId);

    const totalKnown = !hasUnpriced && shipping.known;
    return {
      items,
      currency,
      subtotal,
      hasUnpriced,
      zoneId,
      zone: shipping.zone,
      shippingPrice: shipping.shippingPrice,
      shippingKnown: shipping.known,
      shippingText: shipping.text,
      total: totalKnown ? subtotal + shipping.shippingPrice : null,
    };
  },
};

window.PureOraCart = Cart;
window.PureOra = window.PureOra || {};
window.PureOra.formatPrice = formatPrice;
window.PureOra.formatCurrency = formatCurrency;
window.PureOra.formatZoneAmount = formatZoneAmount;
window.PureOra.calculateShipping = calculateShipping;
window.PureOra.getShippingZones = getShippingZones;
window.PureOra.zoneLabel = zoneLabel;

/* ---------- Sélecteur "Où souhaitez-vous être livrée ?" — réutilisable ---------- */
// Composant unique utilisé par la fiche produit (accueil + produit.html) et par la page
// panier : gros boutons tactiles (jamais de petit <select>), toutes les zones actives
// affichées, aucune présélection imposée sauf choix déjà enregistré.

function shippingOptionMarkup(zone, product, groupName, isSelected) {
  const zonePrice = product?.prices?.[zone.id];
  const priceText = zonePrice ? formatZoneAmount(zonePrice.amount, zonePrice.symbol) : "";
  const shipping = calculateShipping(zone.id);
  return `
    <label class="shipping-option${isSelected ? " is-selected" : ""}" data-shipping-option="${zone.id}">
      <input type="radio" name="${groupName}" value="${zone.id}" ${isSelected ? "checked" : ""}>
      <span class="shipping-option__flag" aria-hidden="true">${zone.flag || ""}</span>
      <span class="shipping-option__body">
        <span class="shipping-option__label">${zone.label}</span>
        <span class="shipping-option__meta">${priceText ? `${priceText} produit` : ""}${priceText ? " · " : ""}Livraison : ${shipping.text}</span>
      </span>
    </label>`;
}

function shippingSummaryText(zone, product) {
  if (!zone) return "";
  const zonePrice = product?.prices?.[zone.id];
  const shipping = calculateShipping(zone.id);
  const parts = [`Livraison : ${zone.label}`];
  if (zonePrice) parts.push(`Produit : ${formatZoneAmount(zonePrice.amount, zonePrice.symbol)}`);
  parts.push(`Frais de livraison : ${shipping.text}`);
  if (zonePrice && shipping.known) {
    parts.push(`Total estimé : ${formatCurrency(zonePrice.amount + shipping.shippingPrice, zonePrice.currency)}`);
  }
  return parts.join(" — ");
}

/**
 * Rend le sélecteur de zone dans `mountId`. `product` (optionnel) permet d'afficher le prix
 * produit associé à chaque zone en plus des frais de livraison. `onChange(zoneId)` est appelé
 * après un changement de zone accepté par la cliente (ou immédiatement si le panier est vide).
 */
function renderShippingSelector(mountId, { product, onChange } = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return null;

  const zones = getShippingZones();
  if (zones.length === 0) return null;

  const groupName = `pureora-shipping--${mountId}`;
  const savedZone = Cart.getShippingZone();
  let currentZoneId = zones.find((z) => z.id === savedZone) ? savedZone : "";
  const listeners = onChange ? [onChange] : [];

  const paint = () => {
    const currentZone = zones.find((z) => z.id === currentZoneId) || null;
    mount.innerHTML = `
      <fieldset class="shipping-selector">
        <legend>Où souhaitez-vous être livrée ?</legend>
        <div class="shipping-selector__options">
          ${zones.map((z) => shippingOptionMarkup(z, product, groupName, z.id === currentZoneId)).join("")}
        </div>
        <p class="shipping-selector__summary" aria-live="polite" data-shipping-summary>${currentZone ? shippingSummaryText(currentZone, product) : ""}</p>
      </fieldset>`;

    mount.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener("change", () => {
        const newZoneId = input.value;
        const applied = Cart.changeZone(newZoneId, product);
        if (!applied) {
          // La cliente a refusé la bascule : on revient visuellement à la zone précédente.
          input.checked = false;
          const prev = mount.querySelector(`input[value="${currentZoneId}"]`);
          if (prev) prev.checked = true;
          return;
        }
        currentZoneId = newZoneId;
        mount.querySelectorAll(".shipping-option").forEach((el) => el.classList.remove("is-selected"));
        input.closest(".shipping-option")?.classList.add("is-selected");
        const summaryEl = mount.querySelector("[data-shipping-summary]");
        if (summaryEl) summaryEl.textContent = shippingSummaryText(zones.find((z) => z.id === newZoneId), product);
        listeners.forEach((fn) => fn(newZoneId));
      });
    });
  };

  paint();

  return {
    getZone: () => currentZoneId,
    onChange: (fn) => listeners.push(fn),
    focus: () => mount.querySelector('input[type="radio"]')?.focus(),
    scrollIntoView: () => mount.scrollIntoView({ behavior: "smooth", block: "center" }),
  };
}

window.PureOra.renderShippingSelector = renderShippingSelector;

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
  const label = item.shippingZone ? zoneLabel(item.shippingZone) : "";
  return `
    <div class="cart-line" data-line-id="${item.lineId}">
      <div class="cart-line__thumb ratio-1x1">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" width="76" height="76" loading="lazy">` : `<div class="media-placeholder ratio-1x1"></div>`}
      </div>
      <div class="cart-line__body">
        <span class="cart-line__title">${item.name}</span>
        ${item.variantLabel ? `<span class="form-hint">${item.variantLabel}</span>` : ""}
        ${label ? `<span class="form-hint">Livraison : ${label}</span>` : ""}
        <span>${formatCurrency(item.price, currency)}</span>
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
    const totals = Cart.calculateCartTotal();
    const subtotalEl = document.getElementById("cart-drawer-subtotal");
    if (subtotalEl) subtotalEl.textContent = totals.hasUnpriced ? "Prix à venir" : formatCurrency(totals.subtotal, totals.currency);
    const zoneEl = document.getElementById("cart-drawer-zone");
    if (zoneEl) zoneEl.textContent = totals.zone ? `Livraison : ${totals.zone.label}` : "Zone de livraison à choisir";
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

  const totals = Cart.calculateCartTotal();
  subtotalEl.textContent = totals.hasUnpriced ? "Prix à venir" : formatCurrency(totals.subtotal, totals.currency);
  if (shippingEl) shippingEl.textContent = totals.shippingText;
  if (totalEl) totalEl.textContent = totals.total === null ? "Communiqué lors de la commande" : formatCurrency(totals.total, totals.currency);

  const checkoutBtn = document.getElementById("go-to-checkout");
  if (checkoutBtn) checkoutBtn.classList.toggle("is-disabled", Cart.read().length === 0);
}

function initShippingSelectorOnCartPage() {
  const mount = document.getElementById("shipping-zone-selector");
  if (!mount) return;
  const product = window.PureOra?.featuredProduct || (window.PureOra?.products || [])[0];
  renderShippingSelector("shipping-zone-selector", {
    product,
    onChange: () => {
      updateCartPageSummary();
      renderCartPage();
    },
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
  initShippingSelectorOnCartPage();
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
