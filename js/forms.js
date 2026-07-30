// forms.js — Gestion générique des formulaires (contact, newsletter, avis, réclamation).
// Validation client + honeypot anti-spam + limitation simple des soumissions répétées.
// Aucun endpoint n'est appelé tant que settings.forms.endpoint n'est pas configuré.

const SUBMIT_THROTTLE_MS = 30000;
const lastSubmitByForm = {};

function setStatus(statusEl, message, type) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.hidden = false;
  statusEl.className = `form-status form-status--${type}`;
}

function validateForm(form) {
  const errors = [];
  form.querySelectorAll("[required]").forEach((field) => {
    const value = field.type === "checkbox" ? field.checked : field.value.trim();
    if (!value) {
      errors.push(field);
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  });
  const emailField = form.querySelector('input[type="email"]');
  if (emailField && emailField.value) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value);
    if (!valid) { errors.push(emailField); emailField.setAttribute("aria-invalid", "true"); }
  }
  return errors;
}

async function submitForm(form, statusEl) {
  const formId = form.id || "form";
  const now = Date.now();
  if (lastSubmitByForm[formId] && now - lastSubmitByForm[formId] < SUBMIT_THROTTLE_MS) {
    setStatus(statusEl, "Votre message précédent a déjà été envoyé. Merci de patienter un instant avant de renvoyer une demande.", "info");
    return;
  }

  // Honeypot anti-spam : si rempli, on simule un succès silencieux (piège à robots).
  const honeypot = form.querySelector(".honeypot-field");
  if (honeypot && honeypot.value.trim() !== "") {
    setStatus(statusEl, "Merci, votre message a bien été pris en compte.", "success");
    form.reset();
    return;
  }

  const errors = validateForm(form);
  if (errors.length > 0) {
    setStatus(statusEl, "Merci de vérifier les champs indiqués avant d'envoyer votre message.", "error");
    errors[0].focus();
    return;
  }

  const endpoint = window.PureOra?.settings?.forms?.endpoint;
  const submitBtn = form.querySelector('[type="submit"]');
  const originalLabel = submitBtn?.textContent;
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Envoi en cours…"; }

  try {
    if (!endpoint) {
      // Pas d'endpoint configuré : on ne simule pas un faux envoi réussi côté back-end,
      // mais le formulaire reste pleinement fonctionnel côté validation.
      await new Promise((r) => setTimeout(r, 400));
      setStatus(statusEl, "Ce formulaire est prêt mais l'adresse de réception n'est pas encore configurée (settings.json → forms.endpoint). Aucune donnée n'a été transmise.", "info");
    } else {
      const formData = new FormData(form);
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Endpoint error ${res.status}`);
      setStatus(statusEl, "Merci, votre message a bien été envoyé. Nous reviendrons vers vous rapidement.", "success");
      form.reset();
      lastSubmitByForm[formId] = now;
    }
  } catch (err) {
    console.error(err);
    setStatus(statusEl, "Une erreur est survenue lors de l'envoi. Merci de réessayer ou de nous contacter directement.", "error");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
  }
}

function initForms() {
  document.querySelectorAll("form[data-po-form]").forEach((form) => {
    const statusId = form.dataset.statusTarget;
    const statusEl = statusId ? document.getElementById(statusId) : form.parentElement.querySelector(".form-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm(form, statusEl);
    });
  });

  // Formulaires newsletter (footer + section dédiée) : même logique, gabarit plus court.
  document.querySelectorAll('[id^="newsletter-form"]').forEach((form) => {
    const statusEl = document.getElementById(form.id.replace("newsletter-form", "newsletter-status"));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm(form, statusEl);
    });
  });
}

document.addEventListener("pureora:components-ready", initForms);
document.addEventListener("DOMContentLoaded", initForms);
