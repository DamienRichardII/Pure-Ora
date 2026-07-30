// tracking.js — Hooks d'activation des outils analytiques, désactivés tant qu'aucun consentement n'est donné.
// Aucun identifiant réel n'est intégré : à compléter par la marque avant mise en ligne.

const PureOraTracking = {
  analyticsEnabled: false,
  marketingEnabled: false,

  enableAnalytics() {
    if (this.analyticsEnabled) return;
    this.analyticsEnabled = true;
    const gaId = window.PureOra?.settings?.analytics?.googleAnalyticsId;
    if (!gaId) {
      console.info("[Pure Ora] Google Analytics non configuré (settings.analytics.googleAnalyticsId vide).");
      return;
    }
    // Exemple d'intégration différée — décommenter et compléter une fois l'ID fourni :
    // const script = document.createElement("script");
    // script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    // script.async = true;
    // document.head.appendChild(script);
  },

  enableMarketing() {
    if (this.marketingEnabled) return;
    this.marketingEnabled = true;
    const pixelId = window.PureOra?.settings?.analytics?.metaPixelId;
    const tiktokId = window.PureOra?.settings?.analytics?.tiktokPixelId;
    if (!pixelId && !tiktokId) {
      console.info("[Pure Ora] Meta Pixel / TikTok Pixel non configurés.");
      return;
    }
    // Intégrations Meta Pixel / TikTok Pixel à activer une fois les identifiants fournis.
  },
};

window.PureOraTracking = PureOraTracking;
