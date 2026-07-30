// cookies.js — Bannière de consentement (accepter / refuser / personnaliser).
// Aucun script analytique n'est chargé avant consentement explicite.

const CONSENT_KEY = "pureora_cookie_consent_v1";

function readConsent() {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch { return null; }
}
function writeConsent(consent) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  document.dispatchEvent(new CustomEvent("pureora:consent-updated", { detail: consent }));
}

function applyConsent(consent) {
  if (!consent) return;
  if (consent.analytics) window.PureOraTracking?.enableAnalytics();
  if (consent.marketing) window.PureOraTracking?.enableMarketing();
}

function initCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  const reopenBtn = document.getElementById("cookie-reopen");
  if (!banner) return;

  const existing = readConsent();
  if (existing) {
    applyConsent(existing);
    reopenBtn?.classList.add("is-visible");
  } else {
    banner.classList.add("is-visible");
  }

  const prefsPanel = document.getElementById("cookie-prefs");
  const saveBtn = document.getElementById("cookie-save-prefs");
  const customizeBtn = document.getElementById("cookie-customize");

  document.getElementById("cookie-accept-all")?.addEventListener("click", () => {
    const consent = { necessary: true, analytics: true, marketing: true, date: new Date().toISOString() };
    writeConsent(consent);
    applyConsent(consent);
    banner.classList.remove("is-visible");
    reopenBtn?.classList.add("is-visible");
  });

  document.getElementById("cookie-refuse-all")?.addEventListener("click", () => {
    const consent = { necessary: true, analytics: false, marketing: false, date: new Date().toISOString() };
    writeConsent(consent);
    banner.classList.remove("is-visible");
    reopenBtn?.classList.add("is-visible");
  });

  customizeBtn?.addEventListener("click", () => {
    prefsPanel.classList.toggle("is-open");
    saveBtn.hidden = !prefsPanel.classList.contains("is-open");
  });

  saveBtn?.addEventListener("click", () => {
    const consent = {
      necessary: true,
      analytics: document.getElementById("cookie-analytics").checked,
      marketing: document.getElementById("cookie-marketing").checked,
      date: new Date().toISOString(),
    };
    writeConsent(consent);
    applyConsent(consent);
    banner.classList.remove("is-visible");
    reopenBtn?.classList.add("is-visible");
  });

  reopenBtn?.addEventListener("click", () => {
    banner.classList.add("is-visible");
  });
}

document.addEventListener("pureora:components-ready", initCookieBanner);
