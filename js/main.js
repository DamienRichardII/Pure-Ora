// main.js — Point d'entrée global : charge les composants partagés, les données,
// puis initialise les modules disponibles sur la page courante.

const COMPONENT_TARGETS = [
  { id: "component-announcement", src: "components/announcement-bar.html" },
  { id: "component-header", src: "components/header.html" },
  { id: "component-footer", src: "components/footer.html" },
  { id: "component-cart-drawer", src: "components/cart-drawer.html" },
  { id: "component-cookie-banner", src: "components/cookie-banner.html" },
];

/**
 * Charge un fragment HTML distant et l'injecte dans un conteneur.
 * Fonctionne servi par un serveur local (Live Server, `python -m http.server`) ou Vercel.
 */
async function loadComponent(targetId, src) {
  const el = document.getElementById(targetId);
  if (!el) return;
  try {
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) throw new Error(`${src} → ${res.status}`);
    el.innerHTML = await res.text();
  } catch (err) {
    console.warn(`[Pure Ora] Impossible de charger le composant ${src}. Servez le site via un serveur local (Live Server ou "python -m http.server").`, err);
  }
}

async function loadJSON(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[Pure Ora] Impossible de charger ${path}.`, err);
    return null;
  }
}

window.PureOra = window.PureOra || {};
window.PureOra.loadJSON = loadJSON;

async function bootstrap() {
  await Promise.all(COMPONENT_TARGETS.map((c) => loadComponent(c.id, c.src)));

  const [settings, products, shipping, faq, reviewsData, categories] = await Promise.all([
    loadJSON("data/settings.json"),
    loadJSON("data/products.json"),
    loadJSON("data/shipping.json"),
    loadJSON("data/faq.json"),
    loadJSON("data/reviews.json"),
    loadJSON("data/categories.json"),
  ]);

  window.PureOra.settings = settings || {};
  window.PureOra.products = products || [];
  window.PureOra.shipping = shipping || { zones: [] };
  window.PureOra.faq = faq || [];
  window.PureOra.reviewsData = reviewsData || { published: false, reviews: [] };
  window.PureOra.categories = categories || [];

  document.dispatchEvent(new CustomEvent("pureora:data-ready"));

  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  applySettingsToDOM();

  document.dispatchEvent(new CustomEvent("pureora:components-ready"));
}

function applySettingsToDOM() {
  const { settings } = window.PureOra;
  if (!settings) return;

  const bar = document.getElementById("announcement-bar");
  if (bar && settings.announcementBar) {
    bar.textContent = settings.announcementBar.text || "";
    bar.hidden = !settings.announcementBar.enabled;
  }

  // WhatsApp flottant — visible uniquement si un numéro valide est renseigné.
  const waNumber = (settings.contact && settings.contact.whatsapp || "").replace(/\D/g, "");
  const waContainer = document.getElementById("whatsapp-float-container");
  if (waContainer) {
    if (waNumber.length >= 8) {
      const message = encodeURIComponent(settings.contact.whatsappMessage || "");
      waContainer.innerHTML = `<a class="whatsapp-float" href="https://wa.me/${waNumber}?text=${message}" target="_blank" rel="noopener" aria-label="Contacter Pure Ora sur WhatsApp">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.44 5.15L2 22l5.11-1.54a9.85 9.85 0 0 0 4.93 1.34c5.46 0 9.91-4.45 9.91-9.9C21.95 6.45 17.5 2 12.04 2zm0 17.9c-1.6 0-3.15-.43-4.5-1.24l-.32-.19-3.03.91.92-2.95-.21-.31a7.94 7.94 0 0 1-1.29-4.3c0-4.4 3.58-7.98 8-7.98 4.4 0 7.98 3.58 7.98 7.98 0 4.42-3.58 8.08-7.55 8.08zm4.4-5.98c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/></svg>
      </a>`;
    } else {
      waContainer.innerHTML = "";
    }
  }

  // Réseaux sociaux footer
  document.querySelectorAll("[data-instagram-link]").forEach((el) => { el.href = settings.contact?.instagram || "#"; });
  document.querySelectorAll("[data-tiktok-link]").forEach((el) => { el.href = settings.contact?.tiktok || "#"; });

  // Email de contact — n'affiche le bouton que si renseigné
  document.querySelectorAll("[data-contact-email]").forEach((el) => {
    const email = settings.contact?.email;
    if (email && email !== "À compléter") {
      el.href = `mailto:${email}`;
      el.textContent = email;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });
}

document.addEventListener("DOMContentLoaded", bootstrap);
