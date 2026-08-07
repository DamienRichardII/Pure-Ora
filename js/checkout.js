// checkout.js — Page commande : récapitulatif, CGV, redirection vers le paiement.
//
// La zone de livraison (et donc la devise) est déterminée par les articles du panier
// (chaque article porte shippingZone/currency) — jamais recalculée ni convertie ici.
// Le lien de paiement utilisé est celui de la zone active : product.paymentLinks[zoneId].

function renderCheckoutSummary() {
  const mount = document.getElementById("checkout-items");
  if (!mount) return;
  const items = window.PureOraCart.read();

  if (items.length === 0) {
    mount.innerHTML = `<p class="cart-empty">Votre panier est vide. <a href="boutique.html" class="text-link">Retourner à la boutique</a></p>`;
  } else {
    mount.innerHTML = items.map((item) => `
      <div class="cart-line" data-line-id="${item.lineId}">
        <div class="cart-line__thumb ratio-1x1">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" width="76" height="76" loading="lazy">` : `<div class="media-placeholder ratio-1x1"></div>`}
        </div>
        <div class="cart-line__body">
          <span class="cart-line__title">${item.name} × ${item.qty}</span>
          ${item.variantLabel ? `<span class="form-hint">${item.variantLabel}</span>` : ""}
          <span>${window.PureOra.formatPrice(item.price, item.currency)}</span>
        </div>
      </div>`).join("");
  }

  const totals = window.PureOraCart.calculateCartTotal();

  document.getElementById("checkout-subtotal").textContent = totals.hasUnpriced ? "Prix à venir" : window.PureOra.formatPrice(totals.subtotal, totals.currency);

  const zoneEl = document.getElementById("checkout-zone");
  if (zoneEl) zoneEl.textContent = totals.zone?.label || "Non sélectionnée";

  const shippingEl = document.getElementById("checkout-shipping");
  if (shippingEl) shippingEl.textContent = totals.shippingText;

  const totalEl = document.getElementById("checkout-total");
  if (totalEl) totalEl.textContent = totals.total === null ? "Communiqué lors de la commande" : window.PureOra.formatPrice(totals.total, totals.currency);
}

function initCheckoutForm() {
  const form = document.getElementById("checkout-form");
  const payBtn = document.getElementById("checkout-pay-button");
  if (!form || !payBtn) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const cgv = document.getElementById("checkout-cgv");
    const items = window.PureOraCart.read();

    if (items.length === 0) {
      showCheckoutStatus("Votre panier est vide.", "error");
      return;
    }
    if (!cgv.checked) {
      showCheckoutStatus("Veuillez accepter les conditions générales de vente pour continuer.", "error");
      return;
    }

    const zoneId = window.PureOraCart.getShippingZone();
    if (!zoneId) {
      showCheckoutStatus("Merci de sélectionner votre zone de livraison depuis le panier avant de continuer.", "error");
      return;
    }

    const featured = window.PureOra.featuredProduct || (window.PureOra.products || [])[0];
    const paymentLink = featured?.paymentLinks?.[zoneId];

    if (!paymentLink || paymentLink.trim() === "") {
      const label = window.PureOra.zoneLabel(zoneId);
      showCheckoutStatus(`Le paiement en ligne n'est pas encore configuré pour la zone ${label} (environnement de développement). Le lien doit être renseigné dans data/products.json ("paymentLinks.${zoneId}").`, "info");
      return;
    }
    window.location.href = paymentLink;
  });
}

function showCheckoutStatus(message, type) {
  const el = document.getElementById("checkout-status");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.className = `form-status form-status--${type}`;
}

document.addEventListener("pureora:data-ready", renderCheckoutSummary);
document.addEventListener("pureora:cart-updated", renderCheckoutSummary);
document.addEventListener("pureora:shipping-zone-changed", renderCheckoutSummary);
document.addEventListener("DOMContentLoaded", initCheckoutForm);
