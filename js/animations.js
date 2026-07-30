// animations.js — Révélations au scroll, parallaxe léger, avant/après, lightbox.
// Respecte prefers-reduced-motion : les animations sont neutralisées si l'utilisateur le demande.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initScrollReveal() {
  const targets = document.querySelectorAll("[data-reveal], [data-reveal-lines], [data-reveal-scale]");
  if (targets.length === 0) return;

  if (prefersReducedMotion) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  // Prépare les titres en lignes révélées individuellement.
  document.querySelectorAll("[data-reveal-lines]").forEach((el) => {
    if (el.dataset.revealPrepared) return;
    const text = el.textContent.trim();
    const words = text.split(" ");
    el.innerHTML = `<span class="reveal-line"><span>${words.join(" ")}</span></span>`;
    el.dataset.revealPrepared = "true";
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  targets.forEach((t) => observer.observe(t));
}

function initParallax() {
  if (prefersReducedMotion) return;
  const items = document.querySelectorAll("[data-parallax]");
  if (items.length === 0) return;

  let ticking = false;
  function update() {
    const viewportH = window.innerHeight;
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const progress = (rect.top - viewportH) / (viewportH + rect.height);
      const intensity = Number(el.dataset.parallax) || 18;
      el.style.transform = `translateY(${(progress * intensity).toFixed(2)}px)`;
    });
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* ---------- Slider avant / après ---------- */
function initBeforeAfter() {
  document.querySelectorAll(".before-after").forEach((slider) => {
    const handle = slider.querySelector(".before-after__handle");
    const afterImg = slider.querySelector(".before-after__after");
    if (!handle || !afterImg) return;

    let dragging = false;
    const setPosition = (clientX) => {
      const rect = slider.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.min(100, Math.max(0, pct));
      handle.style.left = `${pct}%`;
      afterImg.style.clipPath = `inset(0 0 0 ${pct}%)`;
    };

    handle.addEventListener("pointerdown", (e) => { dragging = true; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener("pointerup", () => { dragging = false; });
    handle.addEventListener("pointermove", (e) => { if (dragging) setPosition(e.clientX); });
    slider.addEventListener("click", (e) => { if (e.target === handle) return; setPosition(e.clientX); });

    handle.addEventListener("keydown", (e) => {
      const rect = slider.getBoundingClientRect();
      const current = parseFloat(handle.style.left) || 50;
      if (e.key === "ArrowLeft") setPosition(rect.left + (rect.width * (current - 5) / 100));
      if (e.key === "ArrowRight") setPosition(rect.left + (rect.width * (current + 5) / 100));
    });
    handle.setAttribute("tabindex", "0");
    handle.setAttribute("role", "slider");
    handle.setAttribute("aria-label", "Curseur avant/après");
    handle.setAttribute("aria-valuemin", "0");
    handle.setAttribute("aria-valuemax", "100");
    handle.setAttribute("aria-valuenow", "50");
  });
}

/* ---------- Lightbox galerie ---------- */
function initLightbox() {
  let lightboxEl = document.getElementById("lightbox");
  if (!lightboxEl) {
    lightboxEl = document.createElement("div");
    lightboxEl.className = "lightbox";
    lightboxEl.id = "lightbox";
    lightboxEl.innerHTML = `
      <button type="button" class="lightbox__close" aria-label="Fermer">&times;</button>
      <button type="button" class="lightbox__nav lightbox__prev" aria-label="Image précédente">&larr;</button>
      <img class="lightbox__img" alt="">
      <button type="button" class="lightbox__nav lightbox__next" aria-label="Image suivante">&rarr;</button>`;
    document.body.appendChild(lightboxEl);
  }
  const imgEl = lightboxEl.querySelector(".lightbox__img");
  let currentImages = [];
  let currentIndex = 0;

  function show(idx) {
    currentIndex = (idx + currentImages.length) % currentImages.length;
    const img = currentImages[currentIndex];
    imgEl.src = img.src;
    imgEl.alt = img.alt || "";
  }

  window.PureOraLightbox = {
    open(images, startIndex = 0) {
      currentImages = images;
      show(startIndex);
      lightboxEl.classList.add("is-open");
    },
    close() { lightboxEl.classList.remove("is-open"); },
  };

  lightboxEl.querySelector(".lightbox__close").addEventListener("click", () => window.PureOraLightbox.close());
  lightboxEl.querySelector(".lightbox__prev").addEventListener("click", () => show(currentIndex - 1));
  lightboxEl.querySelector(".lightbox__next").addEventListener("click", () => show(currentIndex + 1));
  lightboxEl.addEventListener("click", (e) => { if (e.target === lightboxEl) window.PureOraLightbox.close(); });
  document.addEventListener("keydown", (e) => {
    if (!lightboxEl.classList.contains("is-open")) return;
    if (e.key === "Escape") window.PureOraLightbox.close();
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
  });

  document.querySelectorAll(".gallery-item").forEach((item, idx, all) => {
    item.addEventListener("click", () => {
      const images = [...all].map((el) => ({ src: el.querySelector("img")?.src, alt: el.querySelector("img")?.alt }));
      window.PureOraLightbox.open(images, idx);
    });
  });
}

/* ---------- Vidéo hero : lecture différée / respectueuse des connexions lentes ---------- */
function initHeroVideo() {
  const video = document.querySelector(".hero__media video");
  if (!video) return;
  const connection = navigator.connection || navigator.webkitConnection;
  const isSlowConnection = connection && (connection.saveData || /^(slow-2g|2g)$/.test(connection.effectiveType || ""));
  if (isSlowConnection || prefersReducedMotion) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }
  video.muted = true;
  video.play?.().catch(() => { /* lecture automatique bloquée par le navigateur : le poster reste affiché */ });
}

document.addEventListener("pureora:components-ready", () => {
  initScrollReveal();
  initParallax();
  initBeforeAfter();
  initLightbox();
  initHeroVideo();
});
