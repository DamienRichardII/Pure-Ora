// faq.js — Accordéon FAQ accessible + injection des données structurées FAQPage (contenu visible uniquement).

function faqItemTemplate(item, index) {
  return `
    <div class="faq-item" id="faq-${item.id}">
      <button type="button" class="faq-item__question" aria-expanded="false" aria-controls="faq-answer-${item.id}">
        <span>${item.question}</span>
        <span class="faq-item__icon" aria-hidden="true">+</span>
      </button>
      <div class="faq-item__answer" id="faq-answer-${item.id}" role="region">
        <div class="faq-item__answer-inner"><p>${item.answer}</p></div>
      </div>
    </div>`;
}

function renderFaqList(mountId, limit) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  let items = window.PureOra.faq || [];
  if (limit) items = items.slice(0, limit);
  mount.innerHTML = items.map(faqItemTemplate).join("");
  wireAccordion(mount);
  injectFaqStructuredData(items);
}

function wireAccordion(mount) {
  mount.querySelectorAll(".faq-item").forEach((item) => {
    const btn = item.querySelector(".faq-item__question");
    btn.addEventListener("click", () => {
      const isOpen = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  });
}

function injectFaqStructuredData(items) {
  if (items.length === 0) return;
  const existing = document.getElementById("faq-structured-data");
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "faq-structured-data";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
  document.head.appendChild(script);
}

document.addEventListener("pureora:data-ready", () => {
  renderFaqList("faq-list-home", 6);
  renderFaqList("faq-list-full");
});
