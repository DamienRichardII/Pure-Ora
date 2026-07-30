// reviews.js — Affichage des avis clients (masqués tant qu'aucun avis validé n'est publié).

function starString(rating) {
  const full = "★".repeat(rating);
  const empty = "☆".repeat(5 - rating);
  return full + empty;
}

function reviewCardTemplate(review) {
  return `
    <article class="review-card ${review.isDemoContent ? "review-card--demo" : ""}">
      <div class="review-card__head">
        <span class="review-card__name">${review.firstName}</span>
        <span class="review-card__date">${review.date}</span>
      </div>
      <div class="review-card__stars" aria-label="Note : ${review.rating} sur 5">${starString(review.rating)}</div>
      <p>${review.text}</p>
      <div class="review-card__head">
        <span class="review-card__product">${review.product}</span>
        ${review.verifiedPurchase ? `<span class="review-card__badge">Achat vérifié</span>` : ""}
      </div>
    </article>`;
}

function renderReviews() {
  const mounts = document.querySelectorAll("[data-reviews-mount]");
  if (mounts.length === 0) return;
  const data = window.PureOra.reviewsData || { published: false, reviews: [] };
  const visibleReviews = data.published ? data.reviews.filter((r) => r.status === "published") : [];

  mounts.forEach((mount) => {
    const showDemo = mount.dataset.reviewsMount === "allow-demo";
    if (visibleReviews.length === 0 && !showDemo) {
      const section = mount.closest("section");
      if (section) section.hidden = true;
      return;
    }
    const list = visibleReviews.length > 0 ? visibleReviews : (showDemo ? data.reviews : []);
    mount.innerHTML = list.map(reviewCardTemplate).join("");
  });
}

document.addEventListener("pureora:data-ready", renderReviews);
